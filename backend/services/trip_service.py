"""
Trip Service Layer — Design Doc §7
===========================================
ALL business rule enforcement happens HERE.
Views NEVER mutate model status directly.

BR4: select_for_update() prevents race conditions on double-dispatch.
BR5: Cargo weight validation before dispatch.
BR6: Dispatch → vehicle + driver = On Trip.
BR7: Complete → vehicle + driver = Available + auto-create FuelLog.
BR8: Cancel (from Dispatched) → vehicle + driver = Available.
BR2: Vehicle must be Available (not Retired/In Shop).
BR3: Driver must be Available + license not expired + not Suspended.
"""
from django.db import transaction
from django.utils import timezone


class TripServiceError(Exception):
    """Domain exception — maps to HTTP 400 with user-facing message."""
    pass


def dispatch_trip(trip_id: int, user) -> "Trip":
    """
    Dispatch a trip atomically.

    Guards (all enforced inside a DB transaction with select_for_update):
    - BR2: Vehicle must be Available (not Retired, not In Shop)
    - BR3: Driver license not expired, status not Suspended
    - BR4: Vehicle and Driver must not already be On Trip
    - BR5: Cargo weight ≤ vehicle max load capacity
    - Trip must be in Draft status

    On success:
    - BR6: Sets vehicle.status = On Trip, driver.status = On Trip
    - Sets trip.status = Dispatched, trip.dispatched_at = now
    """
    from apps.trips.models import Trip
    from apps.vehicles.models import Vehicle
    from apps.drivers.models import Driver

    with transaction.atomic():
        try:
            trip = Trip.objects.select_for_update().get(pk=trip_id)
        except Trip.DoesNotExist:
            raise TripServiceError("Trip not found.")

        if trip.status != Trip.DRAFT:
            raise TripServiceError(
                f"Only Draft trips can be dispatched. Current status: {trip.status}."
            )

        if not trip.vehicle_id:
            raise TripServiceError("Trip has no vehicle assigned. Assign a vehicle before dispatching.")
        if not trip.driver_id:
            raise TripServiceError("Trip has no driver assigned. Assign a driver before dispatching.")

        # Lock vehicle and driver rows to prevent race conditions (BR4)
        vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
        driver = Driver.objects.select_for_update().get(pk=trip.driver_id)

        # BR2: Vehicle must be Available
        if vehicle.status == Vehicle.RETIRED:
            raise TripServiceError(
                f"Vehicle {vehicle.registration_number} is Retired and cannot be dispatched."
            )
        if vehicle.status == Vehicle.IN_SHOP:
            raise TripServiceError(
                f"Vehicle {vehicle.registration_number} is In Shop (under maintenance) "
                "and cannot be dispatched."
            )
        if vehicle.status == Vehicle.ON_TRIP:
            # BR4: Already On Trip
            raise TripServiceError(
                f"Vehicle {vehicle.registration_number} is already On Trip. "
                "It cannot be double-assigned."
            )

        # BR3: Driver license check
        if driver.is_license_expired:
            raise TripServiceError(
                f"Driver {driver.name}'s license (#{driver.license_number}) "
                f"expired on {driver.license_expiry_date}. Cannot assign to trip."
            )

        if driver.status == Driver.SUSPENDED:
            raise TripServiceError(
                f"Driver {driver.name} is Suspended and cannot be assigned to trips."
            )

        # BR4: Driver already On Trip
        if driver.status == Driver.ON_TRIP:
            raise TripServiceError(
                f"Driver {driver.name} is already On Trip. Cannot be double-assigned."
            )

        # BR5: Cargo weight check
        if trip.cargo_weight_kg > vehicle.max_load_capacity_kg:
            excess = trip.cargo_weight_kg - vehicle.max_load_capacity_kg
            raise TripServiceError(
                f"Cargo weight ({trip.cargo_weight_kg} kg) exceeds vehicle capacity "
                f"({vehicle.max_load_capacity_kg} kg). "
                f"Capacity exceeded by {excess} kg — dispatch blocked."
            )

        # All guards passed — perform state transitions
        # BR6: Set vehicle and driver to On Trip
        vehicle.status = Vehicle.ON_TRIP
        vehicle.save(update_fields=["status", "updated_at"])

        driver.status = Driver.ON_TRIP
        driver.save(update_fields=["status", "updated_at"])

        # Update trip
        trip.status = Trip.DISPATCHED
        trip.dispatched_at = timezone.now()
        trip.save(update_fields=["status", "dispatched_at", "updated_at"])

    return trip


def complete_trip(trip_id: int, final_odometer_km, fuel_consumed_l, user) -> "Trip":
    """
    Complete a trip.

    Requires: final_odometer_km, fuel_consumed_l (from the completing form)

    On success (BR7):
    - Sets vehicle.status = Available
    - Sets driver.status = Available
    - Updates vehicle.odometer_km
    - Auto-creates a FuelLog entry tied to this trip
    - Sets trip.status = Completed
    """
    from apps.trips.models import Trip
    from apps.vehicles.models import Vehicle
    from apps.drivers.models import Driver
    from apps.finance.models import FuelLog

    with transaction.atomic():
        try:
            trip = Trip.objects.select_for_update().get(pk=trip_id)
        except Trip.DoesNotExist:
            raise TripServiceError("Trip not found.")

        if trip.status != Trip.DISPATCHED:
            raise TripServiceError(
                f"Only Dispatched trips can be completed. Current status: {trip.status}."
            )

        final_odometer_km = float(final_odometer_km)
        fuel_consumed_l = float(fuel_consumed_l)

        if fuel_consumed_l <= 0:
            raise TripServiceError("Fuel consumed must be greater than 0.")
        if final_odometer_km < 0:
            raise TripServiceError("Final odometer reading cannot be negative.")

        vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
        driver = Driver.objects.select_for_update().get(pk=trip.driver_id)

        # Compute actual distance from odometer delta
        prev_odometer = float(vehicle.odometer_km)

        # BR7: Restore vehicle and driver to Available
        vehicle.status = Vehicle.AVAILABLE
        vehicle.odometer_km = final_odometer_km
        vehicle.last_depot_return = timezone.now()  # BR12: update depot return time
        vehicle.save(update_fields=["status", "odometer_km", "last_depot_return", "updated_at"])

        driver.status = Driver.AVAILABLE
        driver.save(update_fields=["status", "updated_at"])

        # Compute fuel cost (placeholder — fuel log will have cost entered separately)
        # Auto-create FuelLog tied to this trip (BR7)
        distance_km = max(final_odometer_km - prev_odometer, float(trip.planned_distance_km))

        FuelLog.objects.create(
            vehicle=vehicle,
            trip=trip,
            date=timezone.now().date(),
            litres=fuel_consumed_l,
            cost=0,  # Cost to be updated by Financial Analyst if needed
            odometer_at_fill=final_odometer_km,
        )

        # Update trip
        trip.status = Trip.COMPLETED
        trip.completed_at = timezone.now()
        trip.final_odometer_km = final_odometer_km
        trip.fuel_consumed_l = fuel_consumed_l
        if not trip.arrival_km:
            trip.arrival_km = final_odometer_km
        if not trip.arrival_date:
            trip.arrival_date = timezone.now().date()
        if trip.arrival_km is not None and trip.departure_km is not None:
            trip.run_km = trip.arrival_km - trip.departure_km

        trip.save(update_fields=[
            "status", "completed_at", "final_odometer_km", "fuel_consumed_l", 
            "arrival_km", "arrival_date", "run_km", "updated_at"
        ])

    return trip


def cancel_trip(trip_id: int, user) -> "Trip":
    """
    Cancel a trip.

    If trip is Dispatched (BR8):
    - Restores vehicle.status = Available
    - Restores driver.status = Available

    If trip is Draft:
    - Just sets trip.status = Cancelled (no vehicle/driver to restore)
    """
    from apps.trips.models import Trip
    from apps.vehicles.models import Vehicle
    from apps.drivers.models import Driver

    with transaction.atomic():
        try:
            trip = Trip.objects.select_for_update().get(pk=trip_id)
        except Trip.DoesNotExist:
            raise TripServiceError("Trip not found.")

        if trip.status == Trip.COMPLETED:
            raise TripServiceError("Cannot cancel a completed trip.")

        if trip.status == Trip.CANCELLED:
            raise TripServiceError("Trip is already cancelled.")

        if trip.status == Trip.DISPATCHED:
            # BR8: Restore vehicle and driver
            if trip.vehicle_id:
                vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
                vehicle.status = Vehicle.AVAILABLE
                vehicle.save(update_fields=["status", "updated_at"])

            if trip.driver_id:
                driver = Driver.objects.select_for_update().get(pk=trip.driver_id)
                driver.status = Driver.AVAILABLE
                driver.save(update_fields=["status", "updated_at"])

        # Update trip status
        trip.status = Trip.CANCELLED
        trip.cancelled_at = timezone.now()
        trip.save(update_fields=["status", "cancelled_at", "updated_at"])

    return trip
