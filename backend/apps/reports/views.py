"""
Reports & Analytics views — Phase 7.
Uses Pandas for aggregation. All 4 core KPIs + CSV export.

Endpoints:
GET /api/v1/reports/dashboard/   — KPI tiles for dashboard
GET /api/v1/reports/analytics/   — full analytics (fuel efficiency, ROI, utilization, cost)
GET /api/v1/reports/export.csv   — CSV export (mandatory per PS)
"""
import io
import csv
from datetime import date
from decimal import Decimal

from django.db.models import Sum, Count, Q, Avg
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip
from apps.finance.models import FuelLog, Expense
from apps.maintenance.models import MaintenanceRecord
from apps.notifications.models import Notification


def _apply_vehicle_filters(queryset, request):
    """Apply dashboard filters: vehicle type, status, and region."""
    vehicle_type = request.query_params.get("type")
    vehicle_status = request.query_params.get("status")
    region = request.query_params.get("region")

    if vehicle_type:
        queryset = queryset.filter(type__iexact=vehicle_type)
    if vehicle_status:
        queryset = queryset.filter(status__iexact=vehicle_status)
    if region:
        queryset = queryset.filter(region__icontains=region)

    return queryset


def _get_vehicle_stats(vehicle_qs):
    """Aggregated vehicle stats used in dashboard KPIs."""
    total = vehicle_qs.exclude(status=Vehicle.RETIRED).count()
    active = vehicle_qs.filter(status=Vehicle.ON_TRIP).count()
    available = vehicle_qs.filter(status=Vehicle.AVAILABLE).count()
    in_shop = vehicle_qs.filter(status=Vehicle.IN_SHOP).count()
    retired = vehicle_qs.filter(status=Vehicle.RETIRED).count()
    utilization = round((active / total * 100), 1) if total > 0 else 0
    return {
        "total_vehicles": total + retired,
        "active_vehicles": active,
        "available_vehicles": available,
        "vehicles_in_maintenance": in_shop,
        "retired_vehicles": retired,
        "fleet_utilization_pct": utilization,
    }


def _get_trip_stats(trip_qs):
    active_trips = trip_qs.filter(status=Trip.DISPATCHED).count()
    pending_trips = trip_qs.filter(status=Trip.DRAFT).count()
    drivers_on_duty = Driver.objects.filter(
        id__in=trip_qs.filter(status=Trip.DISPATCHED).values_list("driver_id", flat=True)
    ).count()
    completed_trips_today = trip_qs.filter(
        status=Trip.COMPLETED,
        completed_at__date=timezone.now().date(),
    ).count()
    total_drivers_available = Driver.objects.filter(status=Driver.AVAILABLE).count()
    return {
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "completed_trips_today": completed_trips_today,
        "total_drivers_available": total_drivers_available,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    """GET /api/v1/reports/dashboard/ — KPI tiles + recent trips + vehicle status distribution."""
    vehicle_qs = _apply_vehicle_filters(Vehicle.objects.all(), request)
    vehicle_ids = list(vehicle_qs.values_list("id", flat=True))
    trip_qs = Trip.objects.all()
    if vehicle_ids:
        trip_qs = trip_qs.filter(vehicle_id__in=vehicle_ids)

    vehicle_stats = _get_vehicle_stats(vehicle_qs)
    trip_stats = _get_trip_stats(trip_qs)

    # Recent trips (last 10)
    recent_trips = (
        trip_qs.select_related("vehicle", "driver").order_by("-created_at")[:10]
    )
    recent_trips_data = [
        {
            "id": t.id,
            "trip_code": t.trip_code,
            "vehicle": t.vehicle.registration_number if t.vehicle else "",
            "driver": t.driver.name if t.driver else "",
            "status": t.status,
            "planned_eta": t.planned_eta.isoformat() if t.planned_eta else "",
            "source": t.source,
            "destination": t.destination,
        }
        for t in recent_trips
    ]

    # Vehicle status distribution for chart
    status_dist = {
        Vehicle.AVAILABLE: vehicle_qs.filter(status=Vehicle.AVAILABLE).count(),
        Vehicle.ON_TRIP: vehicle_qs.filter(status=Vehicle.ON_TRIP).count(),
        Vehicle.IN_SHOP: vehicle_qs.filter(status=Vehicle.IN_SHOP).count(),
        Vehicle.RETIRED: vehicle_qs.filter(status=Vehicle.RETIRED).count(),
    }

    # Unread notifications count
    unread_notifications = Notification.objects.filter(is_read=False).count()

    return Response({
        **vehicle_stats,
        **trip_stats,
        "recent_trips": recent_trips_data,
        "vehicle_status_distribution": status_dist,
        "unread_notifications": unread_notifications,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    """
    GET /api/v1/reports/analytics/ — Full analytics with Pandas aggregation.

    Returns:
    - Fuel efficiency per vehicle (km/litre)
    - Fleet utilization %
    - Operational cost (fuel + maintenance per vehicle)
    - Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
    - Monthly revenue trend (last 6 months)
    - Top 5 costliest vehicles
    - Category-wise expense breakdown
    """
    try:
        import pandas as pd
        import numpy as np
    except ImportError:
        return Response(
            {"detail": "Pandas not available. Install with: pip install pandas"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    vehicles = list(Vehicle.objects.all().values(
        "id", "registration_number", "name_model", "type",
        "max_load_capacity_kg", "acquisition_cost", "status", "odometer_km"
    ))

    # Fuel logs aggregated per vehicle
    fuel_agg = (
        FuelLog.objects.values("vehicle_id")
        .annotate(
            total_litres=Sum("litres"),
            total_fuel_cost=Sum("cost"),
            avg_mileage=Avg("computed_mileage_kmpl"),
            fill_count=Count("id"),
        )
    )
    fuel_map = {row["vehicle_id"]: row for row in fuel_agg}

    # Maintenance cost per vehicle
    maint_agg = (
        MaintenanceRecord.objects.values("vehicle_id")
        .annotate(total_maint_cost=Sum("cost"), record_count=Count("id"))
    )
    maint_map = {row["vehicle_id"]: row for row in maint_agg}

    # Trip revenue per vehicle
    trip_rev = (
        Trip.objects.filter(status=Trip.COMPLETED)
        .values("vehicle_id")
        .annotate(total_revenue=Sum("revenue"), trip_count=Count("id"),
                  total_distance=Sum("planned_distance_km"))
    )
    trip_map = {row["vehicle_id"]: row for row in trip_rev}

    # Build per-vehicle analytics
    vehicle_analytics = []
    total_fuel_cost = Decimal("0")
    total_maint_cost = Decimal("0")
    total_revenue = Decimal("0")

    for v in vehicles:
        vid = v["id"]
        fuel = fuel_map.get(vid, {})
        maint = maint_map.get(vid, {})
        trip = trip_map.get(vid, {})

        fuel_cost = Decimal(str(fuel.get("total_fuel_cost") or 0))
        maint_cost = Decimal(str(maint.get("total_maint_cost") or 0))
        rev = Decimal(str(trip.get("total_revenue") or 0))
        acq = Decimal(str(v["acquisition_cost"] or 1))

        operational_cost = fuel_cost + maint_cost
        roi = float((rev - operational_cost) / acq) if acq > 0 else 0

        total_fuel_cost += fuel_cost
        total_maint_cost += maint_cost
        total_revenue += rev

        # Fuel efficiency: total distance / total litres
        total_distance = float(trip.get("total_distance") or 0)
        total_litres = float(fuel.get("total_litres") or 0)
        efficiency = round(total_distance / total_litres, 2) if total_litres > 0 else 0

        vehicle_analytics.append({
            "vehicle_id": vid,
            "registration_number": v["registration_number"],
            "name_model": v["name_model"],
            "type": v["type"],
            "status": v["status"],
            "fuel_efficiency_kmpl": efficiency,
            "total_fuel_cost": float(fuel_cost),
            "total_maintenance_cost": float(maint_cost),
            "total_operational_cost": float(operational_cost),
            "total_revenue": float(rev),
            "roi_pct": round(roi * 100, 2),
            "total_trips": trip.get("trip_count", 0),
            "avg_mileage_kmpl": round(float(fuel.get("avg_mileage") or 0), 2),
        })

    # Sort by operational cost for "Top Costliest Vehicles"
    top_costliest = sorted(
        vehicle_analytics,
        key=lambda x: x["total_operational_cost"],
        reverse=True
    )[:5]
    for row in top_costliest:
        # Backward-compatible alias used by existing frontend page.
        row["total_cost"] = row["total_operational_cost"]

    # Fleet-wide KPIs
    non_retired = Vehicle.objects.exclude(status=Vehicle.RETIRED).count()
    on_trip_count = Vehicle.objects.filter(status=Vehicle.ON_TRIP).count()
    fleet_utilization = round(on_trip_count / non_retired * 100, 1) if non_retired > 0 else 0

    # Overall fuel efficiency
    total_dist_all = float(
        Trip.objects.filter(status=Trip.COMPLETED)
        .aggregate(d=Sum("planned_distance_km"))["d"] or 0
    )
    total_litres_all = float(
        FuelLog.objects.aggregate(l=Sum("litres"))["l"] or 0
    )
    fleet_efficiency = round(total_dist_all / total_litres_all, 2) if total_litres_all > 0 else 0

    total_op_cost = float(total_fuel_cost + total_maint_cost)
    total_acq = float(
        Vehicle.objects.aggregate(s=Sum("acquisition_cost"))["s"] or 1
    )
    fleet_roi = round(
        (float(total_revenue) - total_op_cost) / total_acq * 100, 2
    ) if total_acq > 0 else 0

    # Monthly revenue trend (last 6 months) using Pandas
    completed_trips = list(
        Trip.objects.filter(status=Trip.COMPLETED)
        .values("completed_at", "revenue")
    )
    monthly_revenue = []
    if completed_trips:
        df = pd.DataFrame(completed_trips)
        df["completed_at"] = pd.to_datetime(df["completed_at"], utc=True)
        df["month"] = df["completed_at"].dt.to_period("M")
        monthly = df.groupby("month")["revenue"].sum().tail(6)
        monthly_revenue = [
            {"month": str(m), "revenue": float(v)}
            for m, v in monthly.items()
        ]

    # Category-wise expense breakdown
    expense_breakdown = list(
        Expense.objects.values("category")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )

    return Response({
        "summary": {
            "fuel_efficiency_kmpl": fleet_efficiency,
            "fleet_utilization_pct": fleet_utilization,
            "total_operational_cost": total_op_cost,
            "vehicle_roi_pct": fleet_roi,
            "total_revenue": float(total_revenue),
            "total_fuel_cost": float(total_fuel_cost),
            "total_maintenance_cost": float(total_maint_cost),
        },
        "vehicle_analytics": vehicle_analytics,
        "top_costliest_vehicles": top_costliest,
        "monthly_revenue": monthly_revenue,
        "expense_breakdown": expense_breakdown,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_csv(request):
    """
    GET /api/v1/reports/export.csv — Mandatory CSV export (per PS §3.8).
    Exports vehicle analytics as CSV using Pandas.
    """
    try:
        import pandas as pd
    except ImportError:
        return HttpResponse("Pandas not available", status=500)

    vehicles = list(Vehicle.objects.all().values(
        "registration_number", "name_model", "type", "status",
        "max_load_capacity_kg", "acquisition_cost", "odometer_km"
    ))

    # Enrich with costs
    fuel_agg = {
        row["vehicle_id"]: row
        for row in FuelLog.objects.values("vehicle_id")
        .annotate(total_fuel_cost=Sum("cost"), total_litres=Sum("litres"))
    }
    maint_agg = {
        row["vehicle_id"]: row
        for row in MaintenanceRecord.objects.values("vehicle_id")
        .annotate(total_maint_cost=Sum("cost"))
    }
    trip_agg = {
        row["vehicle_id"]: row
        for row in Trip.objects.filter(status=Trip.COMPLETED)
        .values("vehicle_id")
        .annotate(total_revenue=Sum("revenue"), trip_count=Count("id"))
    }

    rows = []
    for v in Vehicle.objects.all():
        fuel = fuel_agg.get(v.id, {})
        maint = maint_agg.get(v.id, {})
        trip = trip_agg.get(v.id, {})
        fuel_cost = float(fuel.get("total_fuel_cost") or 0)
        maint_cost = float(maint.get("total_maint_cost") or 0)
        rev = float(trip.get("total_revenue") or 0)
        acq = float(v.acquisition_cost or 1)
        op_cost = fuel_cost + maint_cost
        roi = round((rev - op_cost) / acq * 100, 2) if acq > 0 else 0
        litres = float(fuel.get("total_litres") or 0)
        rows.append({
            "Registration Number": v.registration_number,
            "Vehicle Name": v.name_model,
            "Type": v.type,
            "Status": v.status,
            "Max Load (kg)": float(v.max_load_capacity_kg),
            "Odometer (km)": float(v.odometer_km),
            "Acquisition Cost": float(v.acquisition_cost),
            "Total Fuel Cost": fuel_cost,
            "Total Maintenance Cost": maint_cost,
            "Total Operational Cost": op_cost,
            "Total Revenue": rev,
            "ROI (%)": roi,
            "Total Trips": trip.get("trip_count", 0),
            "Total Litres": litres,
        })

    df = pd.DataFrame(rows)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    response = HttpResponse(output, content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="transitops_report_{date.today().isoformat()}.csv"'
    )
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_pdf(request):
    """
    GET /api/v1/reports/export.pdf — Export vehicle analytics and KPIs as a beautiful PDF using Weasyprint.
    """
    try:
        from weasyprint import HTML
    except ImportError:
        return HttpResponse("Weasyprint not available", status=500)

    # Replicate or extract analytics calculation to get the latest data:
    vehicles = list(Vehicle.objects.all().values(
        "id", "registration_number", "name_model", "type",
        "max_load_capacity_kg", "acquisition_cost", "status", "odometer_km"
    ))

    fuel_agg = {
        row["vehicle_id"]: row
        for row in FuelLog.objects.values("vehicle_id")
        .annotate(total_fuel_cost=Sum("cost"), total_litres=Sum("litres"))
    }
    maint_agg = {
        row["vehicle_id"]: row
        for row in MaintenanceRecord.objects.values("vehicle_id")
        .annotate(total_maint_cost=Sum("cost"))
    }
    trip_agg = {
        row["vehicle_id"]: row
        for row in Trip.objects.filter(status=Trip.COMPLETED)
        .values("vehicle_id")
        .annotate(total_revenue=Sum("revenue"), trip_count=Count("id"), total_distance=Sum("planned_distance_km"))
    }

    # Summary calculations
    total_fuel_cost = Decimal("0")
    total_maint_cost = Decimal("0")
    total_revenue = Decimal("0")
    total_acq = Decimal("0")

    rows = []
    for v in Vehicle.objects.all():
        fuel = fuel_agg.get(v.id, {})
        maint = maint_agg.get(v.id, {})
        trip = trip_agg.get(v.id, {})
        
        fuel_cost = Decimal(str(fuel.get("total_fuel_cost") or 0))
        maint_cost = Decimal(str(maint.get("total_maint_cost") or 0))
        rev = Decimal(str(trip.get("total_revenue") or 0))
        acq = Decimal(str(v.acquisition_cost or 1))
        
        total_fuel_cost += fuel_cost
        total_maint_cost += maint_cost
        total_revenue += rev
        total_acq += acq
        
        op_cost = fuel_cost + maint_cost
        roi = round((rev - op_cost) / acq * 100, 2) if acq > 0 else 0
        litres = float(fuel.get("total_litres") or 0)
        distance = float(trip.get("total_distance") or 0)
        efficiency = round(distance / litres, 2) if litres > 0 else 0
        
        rows.append({
            "registration_number": v.registration_number,
            "name_model": v.name_model,
            "type": v.type,
            "status": v.status,
            "fuel_efficiency": efficiency,
            "total_fuel_cost": float(fuel_cost),
            "total_maint_cost": float(maint_cost),
            "total_op_cost": float(op_cost),
            "revenue": float(rev),
            "roi": roi,
            "trip_count": trip.get("trip_count", 0),
        })

    # Summary numbers
    total_op_cost = float(total_fuel_cost + total_maint_cost)
    fleet_roi = round((float(total_revenue) - total_op_cost) / float(total_acq) * 100, 2) if total_acq > 0 else 0
    non_retired = Vehicle.objects.exclude(status=Vehicle.RETIRED).count()
    on_trip_count = Vehicle.objects.filter(status=Vehicle.ON_TRIP).count()
    fleet_utilization = round(on_trip_count / non_retired * 100, 1) if non_retired > 0 else 0

    # Build the HTML template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>TransitOps Fleet Performance Report</title>
        <style>
            @page {{
                size: A4 landscape;
                margin: 15mm;
                @bottom-right {{
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 9pt;
                    color: #64748b;
                }}
                @bottom-left {{
                    content: "TransitOps Smart Transport Operations Platform • Confidential & Proprietary";
                    font-size: 9pt;
                    color: #64748b;
                }}
            }}
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #1e293b;
                margin: 0;
                padding: 0;
                font-size: 10pt;
                line-height: 1.5;
            }}
            h1 {{
                font-size: 24pt;
                color: #0f172a;
                margin: 0 0 5px 0;
                font-weight: 700;
            }}
            .subtitle {{
                font-size: 11pt;
                color: #64748b;
                margin-bottom: 25px;
            }}
            .kpi-container {{
                display: flex;
                margin-bottom: 30px;
                justify-content: space-between;
                width: 100%;
            }}
            .kpi-card {{
                flex: 1;
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                margin-right: 15px;
                text-align: center;
                box-sizing: border-box;
            }}
            .kpi-card:last-child {{
                margin-right: 0;
            }}
            .kpi-title {{
                font-size: 9pt;
                text-transform: uppercase;
                color: #64748b;
                font-weight: 600;
                margin-bottom: 5px;
            }}
            .kpi-value {{
                font-size: 18pt;
                font-weight: 700;
                color: #1d4ed8;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }}
            th {{
                background-color: #0f172a;
                color: #ffffff;
                text-align: left;
                padding: 10px;
                font-size: 9pt;
                font-weight: 600;
                text-transform: uppercase;
            }}
            td {{
                padding: 10px;
                border-bottom: 1px solid #e2e8f0;
            }}
            tr:nth-child(even) td {{
                background-color: #f8fafc;
            }}
            .text-right {{
                text-align: right;
            }}
            .badge {{
                display: inline-block;
                padding: 3px 8px;
                font-size: 8pt;
                font-weight: 600;
                border-radius: 4px;
            }}
            .badge-available {{ background-color: #dcfce7; color: #15803d; }}
            .badge-ontrip {{ background-color: #dbeafe; color: #1d4ed8; }}
            .badge-inshop {{ background-color: #fef3c7; color: #b45309; }}
            .badge-retired {{ background-color: #f1f5f9; color: #475569; }}
        </style>
    </head>
    <body>
        <h1>TransitOps Fleet Performance Report</h1>
        <div class="subtitle">Generated on {date.today().strftime('%B %d, %Y')} • Detailed Vehicle Aggregations & ROI Metrics</div>
        
        <div class="kpi-container" style="display: table; table-layout: fixed; width: 100%;">
            <div class="kpi-card" style="display: table-cell; width: 25%;">
                <div class="kpi-title">Fleet Utilization</div>
                <div class="kpi-value">{fleet_utilization}%</div>
            </div>
            <div class="kpi-card" style="display: table-cell; width: 25%;">
                <div class="kpi-title">Total Revenue</div>
                <div class="kpi-value">₹{float(total_revenue):,.2f}</div>
            </div>
            <div class="kpi-card" style="display: table-cell; width: 25%;">
                <div class="kpi-title">Operational Cost</div>
                <div class="kpi-value">₹{total_op_cost:,.2f}</div>
            </div>
            <div class="kpi-card" style="display: table-cell; width: 25%;">
                <div class="kpi-title">Fleet ROI</div>
                <div class="kpi-value">{fleet_roi}%</div>
            </div>
        </div>
        <br/>
        
        <table>
            <thead>
                <tr>
                    <th>Reg No</th>
                    <th>Name/Model</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th class="text-right">Trips</th>
                    <th class="text-right">Fuel Eff. (km/L)</th>
                    <th class="text-right">Fuel Cost</th>
                    <th class="text-right">Maint. Cost</th>
                    <th class="text-right">Total Op. Cost</th>
                    <th class="text-right">Revenue</th>
                    <th class="text-right">ROI (%)</th>
                </tr>
            </thead>
            <tbody>
    """
    
    for r in rows:
        status_class = r["status"].lower().replace(" ", "")
        html_content += f"""
                <tr>
                    <td><strong>{r["registration_number"]}</strong></td>
                    <td>{r["name_model"]}</td>
                    <td>{r["type"]}</td>
                    <td><span class="badge badge-{status_class}">{r["status"]}</span></td>
                    <td class="text-right">{r["trip_count"]}</td>
                    <td class="text-right">{r["fuel_efficiency"] or "0.00"}</td>
                    <td class="text-right">₹{r["total_fuel_cost"]:,.2f}</td>
                    <td class="text-right">₹{r["total_maint_cost"]:,.2f}</td>
                    <td class="text-right">₹{r["total_op_cost"]:,.2f}</td>
                    <td class="text-right">₹{r["revenue"]:,.2f}</td>
                    <td class="text-right">{r["roi"]}%</td>
                </tr>
        """
        
    html_content += """
            </tbody>
        </table>
    </body>
    </html>
    """
    
    # Generate PDF from HTML using weasyprint
    pdf_file = io.BytesIO()
    HTML(string=html_content).write_pdf(target=pdf_file)
    pdf_file.seek(0)
    
    response = HttpResponse(pdf_file.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="transitops_report_{date.today().isoformat()}.pdf"'
    )
    return response
