"""
Accounts app: Custom User model, Role model, JWT auth.
Phase 1 — Auth & RBAC
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.Model):
    """4 roles: Fleet Manager, Dispatcher, Safety Officer, Financial Analyst."""
    FLEET_MANAGER = "Fleet Manager"
    DISPATCHER = "Dispatcher"
    SAFETY_OFFICER = "Safety Officer"
    FINANCIAL_ANALYST = "Financial Analyst"

    ROLE_CHOICES = [
        (FLEET_MANAGER, "Fleet Manager"),
        (DISPATCHER, "Dispatcher"),
        (SAFETY_OFFICER, "Safety Officer"),
        (FINANCIAL_ANALYST, "Financial Analyst"),
    ]

    name = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)
    # Editable permission matrix (Design Doc §5) — stored as JSON
    permission_matrix = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with role-based access."""
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    role = models.ForeignKey(
        Role, on_delete=models.PROTECT, null=True, blank=True, related_name="users"
    )
    depot_id = models.CharField(max_length=50, blank=True, default="")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    # Track failed login attempts (in-memory via cache; stored here for audit)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    @property
    def role_name(self):
        return self.role.name if self.role else None
