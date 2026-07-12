"""
MaintenanceRecord model — Phase 5.
BR9: Creating active maintenance → vehicle status = In Shop.
BR10: Closing maintenance → vehicle status = Available (unless Retired).
"""
from django.db import models


class MaintenanceRecord(models.Model):
    IN_SHOP = "In Shop"
    COMPLETED = "Completed"

    STATUS_CHOICES = [
        (IN_SHOP, "In Shop"),
        (COMPLETED, "Completed"),
    ]

    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.CASCADE,
        related_name="maintenance_records"
    )
    service_type = models.CharField(max_length=200)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=IN_SHOP)
    notes = models.TextField(blank=True, default="")
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "maintenance_records"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.vehicle.registration_number} — {self.service_type} [{self.status}]"
