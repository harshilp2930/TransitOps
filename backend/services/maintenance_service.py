"""
Maintenance Service Layer.

BR9: open_maintenance() — sets vehicle status to In Shop atomically.
BR10: close_maintenance() — sets vehicle to Available unless Retired.
"""
from django.db import transaction
from django.utils import timezone


class MaintenanceServiceError(Exception):
    pass


def open_maintenance(vehicle_id: int, service_type: str, cost, date, notes: str = "") -> "MaintenanceRecord":
    """
    Create a new maintenance record and set vehicle to In Shop (BR9).
    Enforced atomically.
    """
    from apps.vehicles.models import Vehicle
    from apps.maintenance.models import MaintenanceRecord

    with transaction.atomic():
        vehicle = Vehicle.objects.select_for_update().get(pk=vehicle_id)

        if vehicle.status == Vehicle.RETIRED:
            raise MaintenanceServiceError(
                f"Vehicle {vehicle.registration_number} is Retired. "
                "Cannot create maintenance record for a Retired vehicle."
            )

        if vehicle.status == Vehicle.ON_TRIP:
            raise MaintenanceServiceError(
                f"Vehicle {vehicle.registration_number} is currently On Trip. "
                "Complete or cancel the active trip before creating maintenance."
            )

        # BR9: Set vehicle to In Shop
        vehicle.status = Vehicle.IN_SHOP
        vehicle.save(update_fields=["status", "updated_at"])

        record = MaintenanceRecord.objects.create(
            vehicle=vehicle,
            service_type=service_type,
            cost=cost,
            date=date,
            status=MaintenanceRecord.IN_SHOP,
            notes=notes,
        )

    return record


def close_maintenance(record_id: int) -> "MaintenanceRecord":
    """
    Close a maintenance record and restore vehicle to Available (BR10).
    UNLESS the vehicle is Retired — in that case, leave it Retired.
    """
    from apps.vehicles.models import Vehicle
    from apps.maintenance.models import MaintenanceRecord

    with transaction.atomic():
        try:
            record = MaintenanceRecord.objects.select_for_update().get(pk=record_id)
        except MaintenanceRecord.DoesNotExist:
            raise MaintenanceServiceError("Maintenance record not found.")

        if record.status == MaintenanceRecord.COMPLETED:
            raise MaintenanceServiceError("Maintenance record is already closed.")

        vehicle = Vehicle.objects.select_for_update().get(pk=record.vehicle_id)

        # BR10: Restore to Available unless Retired
        if vehicle.status != Vehicle.RETIRED:
            vehicle.status = Vehicle.AVAILABLE
            vehicle.save(update_fields=["status", "updated_at"])

        record.status = MaintenanceRecord.COMPLETED
        record.closed_at = timezone.now()
        record.save(update_fields=["status", "closed_at", "updated_at"])

    return record
