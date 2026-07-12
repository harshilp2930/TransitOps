from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from apps.notifications.models import Notification
from apps.drivers.models import Driver
from apps.vehicles.models import Vehicle, VehicleDocument
from apps.finance.models import FuelLog


class Command(BaseCommand):
    help = "Scan for upcoming expiries, mileage deviations and depot-overdue vehicles and create notifications"

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=30, help="Days ahead to consider for expiries (default: 30)")
        parser.add_argument("--mileage-threshold", type=float, default=0.15, help="Fractional drop to flag mileage deviation (default: 0.15)")

    def handle(self, *args, **options):
        days = options["days"]
        threshold = options["mileage_threshold"]
        now = timezone.now().date()

        # 1) License expiry
        soon = now + timedelta(days=days)
        expiring_drivers = Driver.objects.filter(license_expiry_date__lte=soon)
        for d in expiring_drivers:
            msg = f"Driver {d.name} (license {d.license_number}) expires on {d.license_expiry_date}."
            Notification.objects.create(
                type=Notification.LICENSE_EXPIRY,
                reference_entity="Driver",
                reference_id=str(d.id),
                message=msg,
            )

        # 2) Vehicle document expiry (VehicleDocument model)
        expiring_docs = VehicleDocument.objects.filter(expiry_date__lte=soon)
        for doc in expiring_docs:
            msg = f"{doc.get_doc_type_display()} for {doc.vehicle.registration_number} expires on {doc.expiry_date}."
            Notification.objects.create(
                type=Notification.DOCUMENT_EXPIRY,
                reference_entity="VehicleDocument",
                reference_id=str(doc.id),
                message=msg,
            )

        # 2b) Direct Vehicle document expiry fields
        vehicles = Vehicle.objects.all()
        for v in vehicles:
            if v.insurance_expiry and v.insurance_expiry <= soon:
                Notification.objects.create(
                    type=Notification.DOCUMENT_EXPIRY,
                    reference_entity="Vehicle",
                    reference_id=str(v.id),
                    message=f"Insurance for {v.registration_number} expires on {v.insurance_expiry}.",
                )
            if v.fitness_expiry and v.fitness_expiry <= soon:
                Notification.objects.create(
                    type=Notification.DOCUMENT_EXPIRY,
                    reference_entity="Vehicle",
                    reference_id=str(v.id),
                    message=f"Fitness for {v.registration_number} expires on {v.fitness_expiry}.",
                )
            if v.permit_expiry and v.permit_expiry <= soon:
                Notification.objects.create(
                    type=Notification.DOCUMENT_EXPIRY,
                    reference_entity="Vehicle",
                    reference_id=str(v.id),
                    message=f"Permit for {v.registration_number} expires on {v.permit_expiry}.",
                )
            # BR14: Tyre Wear Threshold
            if v.needs_tyre_change:
                Notification.objects.create(
                    type=Notification.MILEAGE_DEVIATION,
                    reference_entity="Vehicle",
                    reference_id=str(v.id),
                    message=f"Vehicle {v.registration_number} needs tyre replacement (crossed {v.tyre_replacement_threshold} km limit).",
                )

        # 3) Mileage deviation: for each vehicle, compare last fill mileage to rolling avg of last 5
        vehicles = Vehicle.objects.all()
        for v in vehicles:
            logs = list(FuelLog.objects.filter(vehicle=v).order_by("-date")[:6])
            if len(logs) < 2:
                continue
            # latest computed mileage is in logs[0].computed_mileage_kmpl if present
            latest = logs[0].computed_mileage_kmpl
            # rolling average over previous up to 5 entries (skip latest)
            prev = [l.computed_mileage_kmpl for l in logs[1:6] if l.computed_mileage_kmpl]
            if not prev or latest is None:
                continue
            try:
                avg = sum(prev) / len(prev)
                if latest < avg * (1 - threshold):
                    msg = (
                        f"Mileage drop for {v.registration_number}: latest={latest:.2f} km/l, "
                        f"avg={avg:.2f} km/l — flagged as deviation."
                    )
                    Notification.objects.create(
                        type=Notification.MILEAGE_DEVIATION,
                        reference_entity="Vehicle",
                        reference_id=str(v.id),
                        message=msg,
                    )
            except Exception:
                continue

        # 4) Depot-overdue: vehicles whose last_depot_return is older than 7 days
        overdue_threshold = timezone.now() - timedelta(days=7)
        overdue = Vehicle.objects.filter(last_depot_return__lt=overdue_threshold)
        for v in overdue:
            msg = f"Vehicle {v.registration_number} is overdue for depot return (last seen {v.last_depot_return})."
            Notification.objects.create(
                type=Notification.DEPOT_OVERDUE,
                reference_entity="Vehicle",
                reference_id=str(v.id),
                message=msg,
            )

        # 4b) Overdue Trips (BR12 enhancement)
        from apps.trips.models import Trip
        overdue_trips = Trip.objects.filter(
            status=Trip.DISPATCHED,
            expected_return_date__lt=now
        )
        for trip in overdue_trips:
            msg = f"Trip {trip.trip_code} is overdue. Expected return: {trip.expected_return_date}."
            Notification.objects.create(
                type=Notification.DEPOT_OVERDUE,
                reference_entity="Trip",
                reference_id=str(trip.id),
                message=msg,
            )

        self.stdout.write(self.style.SUCCESS("scan_reminders completed"))
