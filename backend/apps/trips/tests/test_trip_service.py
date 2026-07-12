from django.test import TestCase
from django.utils import timezone
from decimal import Decimal

from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip
from apps.finance.models import FuelLog
from services.trip_service import dispatch_trip, complete_trip, cancel_trip, TripServiceError


class TripServiceTests(TestCase):
    def setUp(self):
        # Create vehicle and driver
        self.vehicle = Vehicle.objects.create(
            registration_number="TEST-001",
            name_model="Test Truck",
            max_load_capacity_kg=Decimal('2000.00'),
            odometer_km=Decimal('10000.00'),
            acquisition_cost=Decimal('500000'),
        )

        self.driver = Driver.objects.create(
            name="Test Driver",
            license_number="LIC-123",
            license_expiry_date=(timezone.now().date() + timezone.timedelta(days=365)),
        )

    def test_dispatch_success(self):
        trip = Trip.objects.create(
            source="A",
            destination="B",
            cargo_weight_kg=Decimal('500.00'),
            planned_distance_km=Decimal('120.00'),
            vehicle=self.vehicle,
            driver=self.driver,
        )

        dispatched = dispatch_trip(trip.id, user=None)
        self.assertEqual(dispatched.status, Trip.DISPATCHED)

        v = Vehicle.objects.get(pk=self.vehicle.pk)
        d = Driver.objects.get(pk=self.driver.pk)
        self.assertEqual(v.status, Vehicle.ON_TRIP)
        self.assertEqual(d.status, Driver.ON_TRIP)

    def test_dispatch_vehicle_unavailable(self):
        self.vehicle.status = Vehicle.IN_SHOP
        self.vehicle.save()

        trip = Trip.objects.create(
            source="A",
            destination="B",
            cargo_weight_kg=Decimal('100.00'),
            planned_distance_km=Decimal('50.00'),
            vehicle=self.vehicle,
            driver=self.driver,
        )

        with self.assertRaises(TripServiceError):
            dispatch_trip(trip.id, user=None)

    def test_complete_creates_fuellog_and_restores(self):
        trip = Trip.objects.create(
            source="A",
            destination="B",
            cargo_weight_kg=Decimal('200.00'),
            planned_distance_km=Decimal('80.00'),
            vehicle=self.vehicle,
            driver=self.driver,
        )

        # Dispatch first
        dispatch_trip(trip.id, user=None)

        # Complete
        completed = complete_trip(trip.id, final_odometer_km=Decimal('10100.00'), fuel_consumed_l=Decimal('40.00'), user=None)
        self.assertEqual(completed.status, Trip.COMPLETED)

        v = Vehicle.objects.get(pk=self.vehicle.pk)
        d = Driver.objects.get(pk=self.driver.pk)
        self.assertEqual(v.status, Vehicle.AVAILABLE)
        self.assertEqual(d.status, Driver.AVAILABLE)

        # FuelLog created
        logs = FuelLog.objects.filter(trip=trip)
        self.assertTrue(logs.exists())
        self.assertEqual(logs.first().litres, Decimal('40.00'))

    def test_cancel_restores_from_dispatched(self):
        trip = Trip.objects.create(
            source="A",
            destination="B",
            cargo_weight_kg=Decimal('150.00'),
            planned_distance_km=Decimal('60.00'),
            vehicle=self.vehicle,
            driver=self.driver,
        )

        dispatch_trip(trip.id, user=None)
        cancelled = cancel_trip(trip.id, user=None)
        self.assertEqual(cancelled.status, Trip.CANCELLED)

        v = Vehicle.objects.get(pk=self.vehicle.pk)
        d = Driver.objects.get(pk=self.driver.pk)
        self.assertEqual(v.status, Vehicle.AVAILABLE)
        self.assertEqual(d.status, Driver.AVAILABLE)
