"""
Fuel Service Layer — BR11: Mileage deviation alert.
mileage_this_fill = (odometer_at_fill - previous_odometer) / litres
rolling_avg = avg of last N computed_mileage_kmpl for this vehicle
if mileage_this_fill < rolling_avg * (1 - threshold): flag anomaly + create Notification
"""
from decimal import Decimal

ROLLING_AVG_WINDOW = 5  # last N fuel logs
DEVIATION_THRESHOLD = Decimal("0.15")  # 15% below rolling avg


def compute_and_store_mileage(fuel_log) -> None:
    """
    Compute mileage for a new FuelLog entry.
    Uses odometer delta from previous fuel log for this vehicle.
    BR11: Flags anomaly if mileage is below rolling average by threshold.
    """
    from apps.finance.models import FuelLog

    vehicle = fuel_log.vehicle
    # Get previous fuel log for this vehicle (excluding current)
    prev_log = (
        FuelLog.objects.filter(vehicle=vehicle)
        .exclude(pk=fuel_log.pk)
        .order_by("-date", "-created_at")
        .first()
    )

    if prev_log and prev_log.odometer_at_fill and fuel_log.odometer_at_fill:
        distance = Decimal(str(fuel_log.odometer_at_fill)) - Decimal(str(prev_log.odometer_at_fill))
        if distance > 0 and fuel_log.litres > 0:
            mileage = distance / Decimal(str(fuel_log.litres))
            fuel_log.computed_mileage_kmpl = mileage

            # BR11: Check against rolling average
            recent_logs = (
                FuelLog.objects.filter(vehicle=vehicle, computed_mileage_kmpl__isnull=False)
                .exclude(pk=fuel_log.pk)
                .order_by("-date", "-created_at")[:ROLLING_AVG_WINDOW]
            )
            if recent_logs.exists():
                mileage_values = [Decimal(str(log.computed_mileage_kmpl)) for log in recent_logs]
                rolling_avg = sum(mileage_values) / len(mileage_values)
                threshold = rolling_avg * (1 - DEVIATION_THRESHOLD)
                if mileage < threshold:
                    fuel_log.is_anomaly_flagged = True
                    # Create notification (Enhancement BR11)
                    try:
                        from apps.notifications.models import Notification
                        Notification.objects.create(
                            type=Notification.MILEAGE_DEVIATION,
                            reference_entity="FuelLog",
                            reference_id=str(fuel_log.pk),
                            message=(
                                f"Mileage anomaly detected for {vehicle.registration_number}: "
                                f"{float(mileage):.2f} km/l vs rolling avg {float(rolling_avg):.2f} km/l "
                                f"(>{int(DEVIATION_THRESHOLD*100)}% below average)."
                            ),
                        )
                    except Exception:
                        pass  # Notification failure must not block fuel log save

            fuel_log.save(update_fields=["computed_mileage_kmpl", "is_anomaly_flagged"])
