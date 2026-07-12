"""
Seed management command — creates demo data for testing and presentation.
Run: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta


class Command(BaseCommand):
    help = "Seed demo data for TransitOps"

    def handle(self, *args, **options):
        from apps.accounts.models import Role, User
        from apps.vehicles.models import Vehicle
        from apps.drivers.models import Driver
        from apps.trips.models import Trip
        from apps.maintenance.models import MaintenanceRecord
        from apps.finance.models import FuelLog, Expense

        self.stdout.write("Seeding demo data...")

        # Create roles
        roles_data = [
            Role.FLEET_MANAGER,
            Role.DISPATCHER,
            Role.SAFETY_OFFICER,
            Role.FINANCIAL_ANALYST,
        ]
        roles = {}
        for rname in roles_data:
            role, _ = Role.objects.get_or_create(name=rname)
            roles[rname] = role
            self.stdout.write(f"  Role: {rname}")

        # Create users (one per role)
        users_data = [
            ("fleet@transitops.com", "Fleet Manager", Role.FLEET_MANAGER),
            ("dispatcher@transitops.com", "Trip Dispatcher", Role.DISPATCHER),
            ("safety@transitops.com", "Safety Officer", Role.SAFETY_OFFICER),
            ("finance@transitops.com", "Financial Analyst", Role.FINANCIAL_ANALYST),
        ]
        users = {}
        for email, name, role_name in users_data:
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_user(
                    email=email,
                    password="transitops123",
                    full_name=name,
                    role=roles[role_name],
                )
                users[role_name] = user
                self.stdout.write(f"  User: {email} / password: transitops123")
            else:
                users[role_name] = User.objects.get(email=email)
                self.stdout.write(f"  User exists: {email}")

        # Create superuser
        if not User.objects.filter(email="admin@transitops.com").exists():
            User.objects.create_superuser(
                email="admin@transitops.com",
                password="admin123",
                full_name="Admin",
            )
            self.stdout.write("  Superuser: admin@transitops.com / admin123")

        # Create vehicles
        vehicles_data = [
            ("AU12AB4891", "Van-04", "Van", 800, 74000, 630000, Vehicle.AVAILABLE, "North"),
            ("AU12AB4892", "Truck-01", "Truck", 1000, 120000, 1200000, Vehicle.ON_TRIP, "South"),
            ("AU12AB4893", "Van-05", "Van", 500, 44000, 420000, Vehicle.IN_SHOP, "East"),
            ("AU40AB4893", "Truck-02", "Truck", 707, 88000, 990000, Vehicle.RETIRED, "West"),
            ("MH12AB1234", "Mini-01", "Mini", 300, 22000, 280000, Vehicle.AVAILABLE, "North"),
            ("KA05CD5678", "Van-06", "Van", 600, 55000, 510000, Vehicle.AVAILABLE, "South"),
            ("TN09EF9012", "Truck-03", "Truck", 1200, 200000, 1500000, Vehicle.AVAILABLE, "East"),
        ]
        vehicles = {}
        for reg, name, vtype, cap, odo, acq, vstatus, region in vehicles_data:
            v, created = Vehicle.objects.get_or_create(
                registration_number=reg,
                defaults={
                    "name_model": name, "type": vtype,
                    "max_load_capacity_kg": cap, "odometer_km": odo,
                    "acquisition_cost": acq, "status": vstatus, "region": region
                }
            )
            vehicles[reg] = v
            if created:
                self.stdout.write(f"  Vehicle: {reg} ({name})")

        # Create drivers
        drivers_data = [
            ("Alex Kumar", "DL001234", "LMV", date.today() + timedelta(days=500), "9876543210", 95, Driver.AVAILABLE),
            ("Suresh Patel", "DL005678", "HMV", date.today() + timedelta(days=200), "9876543211", 88, Driver.ON_TRIP),
            ("Rajesh Singh", "DL009012", "LMV", date.today() - timedelta(days=30), "9876543212", 72, Driver.AVAILABLE),  # expired license
            ("Priya Sharma", "DL003456", "LMV", date.today() + timedelta(days=365), "9876543213", 91, Driver.SUSPENDED),
            ("Mohan Das", "DL007890", "HMV", date.today() + timedelta(days=180), "9876543214", 85, Driver.AVAILABLE),
            ("Vijay Kumar", "DL002345", "HMV", date.today() + timedelta(days=730), "9876543215", 93, Driver.AVAILABLE),
        ]
        drivers = {}
        for name, lic, cat, expiry, contact, score, dstatus in drivers_data:
            d, created = Driver.objects.get_or_create(
                license_number=lic,
                defaults={
                    "name": name, "license_category": cat,
                    "license_expiry_date": expiry, "contact_number": contact,
                    "safety_score": score, "status": dstatus
                }
            )
            drivers[lic] = d
            if created:
                self.stdout.write(f"  Driver: {name} ({lic})")

        # Create completed trip with fuel log
        disp_user = users.get(Role.DISPATCHER)
        van04 = vehicles.get("AU12AB4891")
        alex = drivers.get("DL001234")
        if van04 and alex:
            trip1, created = Trip.objects.get_or_create(
                source="Mumbai Depot",
                destination="Pune Hub",
                defaults={
                    "vehicle": van04, "driver": alex,
                    "cargo_weight_kg": 400, "planned_distance_km": 150,
                    "revenue": 25000, "status": Trip.COMPLETED,
                    "dispatched_at": timezone.now() - timedelta(days=2),
                    "completed_at": timezone.now() - timedelta(days=1),
                    "final_odometer_km": 74150, "fuel_consumed_l": 18,
                    "created_by": disp_user,
                }
            )
            if created:
                FuelLog.objects.get_or_create(
                    vehicle=van04, trip=trip1,
                    defaults={"date": date.today() - timedelta(days=1), "litres": 18, "cost": 2340, "odometer_at_fill": 74150}
                )
                self.stdout.write(f"  Trip: {trip1.trip_code} (Completed)")

        # Create a dispatched trip
        truck1 = vehicles.get("AU12AB4892")
        suresh = drivers.get("DL005678")
        if truck1 and suresh:
            trip2, created = Trip.objects.get_or_create(
                source="Chennai Port",
                destination="Bangalore Depot",
                defaults={
                    "vehicle": truck1, "driver": suresh,
                    "cargo_weight_kg": 800, "planned_distance_km": 350,
                    "revenue": 45000, "status": Trip.DISPATCHED,
                    "dispatched_at": timezone.now() - timedelta(hours=3),
                    "created_by": disp_user,
                }
            )
            if created:
                self.stdout.write(f"  Trip: {trip2.trip_code} (Dispatched)")

        # Create draft trips
        mini1 = vehicles.get("MH12AB1234")
        mohan = drivers.get("DL007890")
        if mini1 and mohan:
            trip3, created = Trip.objects.get_or_create(
                source="Delhi Hub",
                destination="Noida Depot",
                defaults={
                    "vehicle": mini1, "driver": mohan,
                    "cargo_weight_kg": 200, "planned_distance_km": 40,
                    "revenue": 8000, "status": Trip.DRAFT,
                    "created_by": disp_user,
                }
            )
            if created:
                self.stdout.write(f"  Trip: {trip3.trip_code} (Draft)")

        # Create maintenance record (Van-05 In Shop)
        van05 = vehicles.get("AU12AB4893")
        if van05:
            mr, created = MaintenanceRecord.objects.get_or_create(
                vehicle=van05, service_type="Oil Change",
                defaults={
                    "cost": 6800, "date": date.today() - timedelta(days=1),
                    "status": MaintenanceRecord.IN_SHOP
                }
            )
            if created:
                self.stdout.write(f"  Maintenance: {van05.registration_number} — Oil Change")

        # Expenses
        if van04:
            Expense.objects.get_or_create(
                vehicle=van04, category="Toll", amount=150, date=date.today() - timedelta(days=1),
                defaults={"notes": "Highway toll"}
            )

        self.stdout.write(self.style.SUCCESS("\nDEMO DATA SEEDED SUCCESSFULLY!"))
        self.stdout.write("\nDemo credentials:")
        self.stdout.write("  fleet@transitops.com        / transitops123 (Fleet Manager)")
        self.stdout.write("  dispatcher@transitops.com   / transitops123 (Dispatcher)")
        self.stdout.write("  safety@transitops.com       / transitops123 (Safety Officer)")
        self.stdout.write("  finance@transitops.com      / transitops123 (Financial Analyst)")
        self.stdout.write("  admin@transitops.com        / admin123 (Superuser)")
