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


def _get_vehicle_stats():
    """Aggregated vehicle stats used in dashboard KPIs."""
    total = Vehicle.objects.exclude(status=Vehicle.RETIRED).count()
    active = Vehicle.objects.filter(status=Vehicle.ON_TRIP).count()
    available = Vehicle.objects.filter(status=Vehicle.AVAILABLE).count()
    in_shop = Vehicle.objects.filter(status=Vehicle.IN_SHOP).count()
    retired = Vehicle.objects.filter(status=Vehicle.RETIRED).count()
    utilization = round((active / total * 100), 1) if total > 0 else 0
    return {
        "total_vehicles": total + retired,
        "active_vehicles": active,
        "available_vehicles": available,
        "vehicles_in_maintenance": in_shop,
        "retired_vehicles": retired,
        "fleet_utilization_pct": utilization,
    }


def _get_trip_stats():
    active_trips = Trip.objects.filter(status=Trip.DISPATCHED).count()
    pending_trips = Trip.objects.filter(status=Trip.DRAFT).count()
    drivers_on_duty = Driver.objects.filter(status=Driver.ON_TRIP).count()
    return {
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    """GET /api/v1/reports/dashboard/ — KPI tiles + recent trips + vehicle status distribution."""
    vehicle_stats = _get_vehicle_stats()
    trip_stats = _get_trip_stats()

    # Recent trips (last 10)
    recent_trips = Trip.objects.select_related("vehicle", "driver").order_by("-created_at")[:10]
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
        Vehicle.AVAILABLE: Vehicle.objects.filter(status=Vehicle.AVAILABLE).count(),
        Vehicle.ON_TRIP: Vehicle.objects.filter(status=Vehicle.ON_TRIP).count(),
        Vehicle.IN_SHOP: Vehicle.objects.filter(status=Vehicle.IN_SHOP).count(),
        Vehicle.RETIRED: Vehicle.objects.filter(status=Vehicle.RETIRED).count(),
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
