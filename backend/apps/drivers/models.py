"""
Driver model — Phase 3.
BR3: Expired license or Suspended status → excluded from dispatch pool.
"""
from django.db import models
from django.utils import timezone


class Driver(models.Model):
    # Status constants
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"

    STATUS_CHOICES = [
        (AVAILABLE, "Available"),
        (ON_TRIP, "On Trip"),
        (OFF_DUTY, "Off Duty"),
        (SUSPENDED, "Suspended"),
    ]

    name = models.CharField(max_length=150)
    license_number = models.CharField(max_length=50, unique=True)
    license_category = models.CharField(max_length=20, blank=True, default="")
    license_expiry_date = models.DateField()
    contact_number = models.CharField(max_length=20, blank=True, default="")
    safety_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=100.00,
        help_text="Safety score out of 100"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "drivers"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.license_number})"

    @property
    def is_license_expired(self):
        """BR3: Check if license is expired."""
        return self.license_expiry_date < timezone.now().date()

    @property
    def is_eligible_for_dispatch(self):
        """
        BR3: Driver is eligible only if:
        - License is not expired
        - Status is not Suspended
        - Status is Available (not already On Trip)
        """
        return (
            not self.is_license_expired
            and self.status == self.AVAILABLE
        )
