"""Notification model for enhancement features (BR11, BR12, BR13)."""
from django.db import models


class Notification(models.Model):
    LICENSE_EXPIRY = "License Expiry"
    DOCUMENT_EXPIRY = "Document Expiry"
    MILEAGE_DEVIATION = "Mileage Deviation"
    DEPOT_OVERDUE = "Depot Overdue"

    TYPE_CHOICES = [
        (LICENSE_EXPIRY, "License Expiry"),
        (DOCUMENT_EXPIRY, "Document Expiry"),
        (MILEAGE_DEVIATION, "Mileage Deviation"),
        (DEPOT_OVERDUE, "Depot Return Overdue"),
    ]

    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    reference_entity = models.CharField(max_length=50, blank=True, default="")
    reference_id = models.CharField(max_length=50, blank=True, default="")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type}] {self.message[:60]}"
