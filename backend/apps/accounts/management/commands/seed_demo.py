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
        # Create vehicles (Indian registration numbers)
        vehicles_data = [
            ("MH12AB4891", "Tata LPT 1618", "Truck", 10000, 74000, 1600000, Vehicle.AVAILABLE, "West"),
            ("GJ01CD4892", "Ashok Leyland Dost", "Mini-truck", 1250, 120000, 650000, Vehicle.ON_TRIP, "West"),
            ("UP14EF4893", "Tata Ace Gold", "Mini-truck", 750, 44000, 420000, Vehicle.IN_SHOP, "North"),
            ("DL01GH4893", "Mahindra Bolero Pik-Up", "Van", 1700, 88000, 990000, Vehicle.RETIRED, "North"),
            ("KA51JK1234", "Eicher Pro 2049", "Truck", 5000, 22000, 1280000, Vehicle.AVAILABLE, "South"),
            ("TN09LM5678", "BharatBenz 1923C", "Heavy-truck", 19000, 55000, 3100000, Vehicle.AVAILABLE, "South"),
            ("WB02NP9012", "Tata Prima 2830.K", "Heavy-truck", 28000, 200000, 4500000, Vehicle.AVAILABLE, "East"),
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
        # Create drivers (Indian names)
        drivers_data = [
            ("Amit Desai", "DL14202301", "HMV", date.today() + timedelta(days=500), "9876543210", 95, Driver.AVAILABLE),
            ("Suresh Patel", "GJ01201988", "HMV", date.today() + timedelta(days=200), "9876543211", 88, Driver.ON_TRIP),
            ("Rajesh Singh", "UP16201534", "LMV", date.today() - timedelta(days=30), "9876543212", 72, Driver.AVAILABLE),  # expired license
            ("Kavita Sharma", "DL01202156", "LMV", date.today() + timedelta(days=365), "9876543213", 91, Driver.SUSPENDED),
            ("Mohan Das", "WB02201890", "HMV", date.today() + timedelta(days=180), "9876543214", 85, Driver.AVAILABLE),
            ("Vijay Kumar", "TN09202045", "HMV", date.today() + timedelta(days=730), "9876543215", 93, Driver.AVAILABLE),
            ("Arjun Reddy", "KA51201999", "HMV", date.today() + timedelta(days=600), "9876543216", 98, Driver.AVAILABLE),
            ("Manoj Tiwari", "BR01202277", "LMV", date.today() + timedelta(days=150), "9876543217", 82, Driver.AVAILABLE),
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
        tata_lpt = vehicles.get("MH12AB4891")
        amit = drivers.get("DL14202301")
        if tata_lpt and amit:
            trip1, created = Trip.objects.get_or_create(
                source="Mumbai, MH",
                destination="Pune, MH",
                defaults={
                    "vehicle": tata_lpt, "driver": amit,
                    "cargo_weight_kg": 4500, "planned_distance_km": 150,
                    "revenue": 25000, "status": Trip.COMPLETED,
                    "dispatched_at": timezone.now() - timedelta(days=2),
                    "completed_at": timezone.now() - timedelta(days=1),
                    "final_odometer_km": 74150, "fuel_consumed_l": 18,
                    "created_by": disp_user,
                }
            )
            if created:
                FuelLog.objects.get_or_create(
                    vehicle=tata_lpt, trip=trip1,
                    defaults={"date": date.today() - timedelta(days=1), "litres": 18, "cost": 1750, "odometer_at_fill": 74150}
                )
                self.stdout.write(f"  Trip: {trip1.trip_code} (Completed)")

        # Create a dispatched trip
        dost = vehicles.get("GJ01CD4892")
        suresh = drivers.get("GJ01201988")
        if dost and suresh:
            trip2, created = Trip.objects.get_or_create(
                source="Ahmedabad, GJ",
                destination="Surat, GJ",
                defaults={
                    "vehicle": dost, "driver": suresh,
                    "cargo_weight_kg": 1200, "planned_distance_km": 260,
                    "revenue": 14000, "status": Trip.DISPATCHED,
                    "dispatched_at": timezone.now() - timedelta(hours=3),
                    "created_by": disp_user,
                    "expected_return_date": date.today() - timedelta(days=1), # Make it overdue for demo
                }
            )
            if created:
                self.stdout.write(f"  Trip: {trip2.trip_code} (Dispatched & Overdue)")

        # Create draft trips
        eicher = vehicles.get("KA51JK1234")
        arjun = drivers.get("KA51201999")
        if eicher and arjun:
            trip3, created = Trip.objects.get_or_create(
                source="Bengaluru, KA",
                destination="Mysuru, KA",
                defaults={
                    "vehicle": eicher, "driver": arjun,
                    "cargo_weight_kg": 4500, "planned_distance_km": 145,
                    "revenue": 18000, "status": Trip.DRAFT,
                    "created_by": disp_user,
                }
            )
            if created:
                self.stdout.write(f"  Trip: {trip3.trip_code} (Draft)")

        # Create another completed trip
        prima = vehicles.get("WB02NP9012")
        manoj = drivers.get("BR01202277")
        if prima and manoj:
            trip4, created = Trip.objects.get_or_create(
                source="Kolkata, WB",
                destination="Patna, BR",
                defaults={
                    "vehicle": prima, "driver": manoj,
                    "cargo_weight_kg": 24000, "planned_distance_km": 580,
                    "revenue": 75000, "status": Trip.COMPLETED,
                    "dispatched_at": timezone.now() - timedelta(days=5),
                    "completed_at": timezone.now() - timedelta(days=3),
                    "final_odometer_km": 200580, "fuel_consumed_l": 150,
                    "created_by": disp_user,
                }
            )
            if created:
                FuelLog.objects.get_or_create(
                    vehicle=prima, trip=trip4,
                    defaults={"date": date.today() - timedelta(days=3), "litres": 150, "cost": 14000, "odometer_at_fill": 200580}
                )
                self.stdout.write(f"  Trip: {trip4.trip_code} (Completed)")

        # Create maintenance records
        ace_gold = vehicles.get("UP14EF4893")
        if ace_gold:
            mr, created = MaintenanceRecord.objects.get_or_create(
                vehicle=ace_gold, service_type="Oil Change",
                defaults={
                    "cost": 3500, "date": date.today() - timedelta(days=1),
                    "status": MaintenanceRecord.IN_SHOP
                }
            )
            if created:
                self.stdout.write(f"  Maintenance: {ace_gold.registration_number} — Oil Change")
        
        bolero = vehicles.get("DL01GH4893")
        if bolero:
            mr, created = MaintenanceRecord.objects.get_or_create(
                vehicle=bolero, service_type="Engine Repair",
                defaults={
                    "cost": 25000, "date": date.today() - timedelta(days=5),
                    "status": MaintenanceRecord.COMPLETED
                }
            )
            if created:
                self.stdout.write(f"  Maintenance: {bolero.registration_number} — Engine Repair (Completed)")

        # Expenses
        if tata_lpt:
            Expense.objects.get_or_create(
                vehicle=tata_lpt, category="Toll", amount=450, date=date.today() - timedelta(days=1),
                defaults={"notes": "Mumbai-Pune Expressway Toll"}
            )

        self.stdout.write(self.style.SUCCESS("\nDEMO DATA SEEDED SUCCESSFULLY!"))
        self.stdout.write("\nDemo credentials:")
        self.stdout.write("  fleet@transitops.com        / transitops123 (Fleet Manager)")
        self.stdout.write("  dispatcher@transitops.com   / transitops123 (Dispatcher)")
        self.stdout.write("  safety@transitops.com       / transitops123 (Safety Officer)")
        self.stdout.write("  finance@transitops.com      / transitops123 (Financial Analyst)")
        self.stdout.write("  admin@transitops.com        / admin123 (Superuser)")
