from rest_framework.test import APITestCase
from django.urls import reverse
from django.utils import timezone
from decimal import Decimal

from apps.accounts.models import Role, User
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip


class TripAPITests(APITestCase):
    def setUp(self):
        # Roles
        self.dispatcher_role, _ = Role.objects.get_or_create(name=Role.DISPATCHER)

        # Dispatcher user
        self.dispatcher = User.objects.create_user(
            email='disp@transitops.test', password='password123', full_name='Disp'
        )
        self.dispatcher.role = self.dispatcher_role
        self.dispatcher.save()

        # Vehicle and driver
        self.vehicle = Vehicle.objects.create(
            registration_number='API-001', name_model='API Truck', max_load_capacity_kg=Decimal('3000'), odometer_km=Decimal('5000'), acquisition_cost=Decimal('200000')
        )

        self.driver = Driver.objects.create(
            name='API Driver', license_number='API-LIC-1', license_expiry_date=(timezone.now().date() + timezone.timedelta(days=365))
        )

    def authenticate(self):
        url = '/api/v1/auth/login/'
        resp = self.client.post(url, {'email': 'disp@transitops.test', 'password': 'password123'}, format='json')
        self.assertEqual(resp.status_code, 200)
        token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_dispatch_endpoint(self):
        # create trip in DB
        trip = Trip.objects.create(source='A', destination='B', cargo_weight_kg=Decimal('100.00'), planned_distance_km=Decimal('50.00'), vehicle=self.vehicle, driver=self.driver)
        self.authenticate()
        url = f'/api/v1/trips/{trip.id}/dispatch/'
        resp = self.client.post(url, {}, format='json')
        self.assertEqual(resp.status_code, 200)
        trip.refresh_from_db()
        self.assertEqual(trip.status, Trip.DISPATCHED)

    def test_complete_endpoint(self):
        trip = Trip.objects.create(source='A', destination='B', cargo_weight_kg=Decimal('100.00'), planned_distance_km=Decimal('50.00'), vehicle=self.vehicle, driver=self.driver)
        # dispatch first
        self.authenticate()
        self.client.post(f'/api/v1/trips/{trip.id}/dispatch/', {}, format='json')
        # complete
        resp = self.client.post(f'/api/v1/trips/{trip.id}/complete/', {'final_odometer_km': '5100.00', 'fuel_consumed_l': '30.00'}, format='json')
        self.assertEqual(resp.status_code, 200)
        trip.refresh_from_db()
        self.assertEqual(trip.status, Trip.COMPLETED)
