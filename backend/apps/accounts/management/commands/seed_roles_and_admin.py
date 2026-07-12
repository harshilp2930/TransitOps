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

        # Create a demo fleet manager if not exists
        if not User.objects.filter(email="admin@transitops.local").exists():
            fm = User.objects.create_user(
                email="admin@transitops.local",
                password="password123",
                full_name="Demo Fleet Manager",
            )
            role = Role.objects.get(name=Role.FLEET_MANAGER)
            fm.role = role
            fm.is_staff = True
            fm.save(update_fields=["role_id", "is_staff"])
            self.stdout.write(self.style.SUCCESS("Created demo Fleet Manager user: admin@transitops.local / password123"))
        else:
            self.stdout.write(self.style.NOTICE("Demo user already exists"))
