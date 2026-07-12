from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.accounts.models import Role

User = get_user_model()


class Command(BaseCommand):
    help = "Seed default roles and a demo admin user (Fleet Manager)"

    def handle(self, *args, **options):
        roles = [Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST]
        for r in roles:
            role, created = Role.objects.get_or_create(name=r)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role: {r}"))

        # Create demo users for quick sign-in
        demo_users = [
            ("admin@transitops.local", "Demo Fleet Manager", Role.FLEET_MANAGER, "transitops123"),
            ("fleet@transitops.com", "Fleet Manager", Role.FLEET_MANAGER, "transitops123"),
            ("dispatcher@transitops.com", "Dispatcher User", Role.DISPATCHER, "transitops123"),
            ("safety@transitops.com", "Safety Officer", Role.SAFETY_OFFICER, "transitops123"),
            ("finance@transitops.com", "Financial Analyst", Role.FINANCIAL_ANALYST, "transitops123"),
        ]

        for email, full_name, role_name, pwd in demo_users:
            if not User.objects.filter(email=email).exists():
                u = User.objects.create_user(email=email, password=pwd, full_name=full_name)
                role = Role.objects.get(name=role_name)
                u.role = role
                # Make admin@transitops.local staff
                if email == "admin@transitops.local":
                    u.is_staff = True
                u.save(update_fields=["role_id", "is_staff"])
                self.stdout.write(self.style.SUCCESS(f"Created demo user: {email} / {pwd}"))
            else:
                self.stdout.write(self.style.NOTICE(f"Demo user already exists: {email}"))
