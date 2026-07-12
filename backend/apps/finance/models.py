"""
Finance models — Phase 6.
FuelLog: tracks fuel consumption per vehicle/trip.
Expense: tracks toll/misc expenses per vehicle/trip.
"""
from django.db import models


class FuelLog(models.Model):
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.CASCADE,
        related_name="fuel_logs"
    )
    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="fuel_logs"
    )
    date = models.DateField()
    litres = models.DecimalField(max_digits=8, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    odometer_at_fill = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Derived — computed and stored when a log is created (BR11 check)
    computed_mileage_kmpl = models.DecimalField(
        max_digits=8, decimal_places=4, null=True, blank=True
    )
    is_anomaly_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fuel_logs"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.vehicle.registration_number} — {self.date} — {self.litres}L"


class Expense(models.Model):
    TOLL = "Toll"
    MISC = "Misc"
    OTHER = "Other"

    CATEGORY_CHOICES = [
        (TOLL, "Toll"),
        (MISC, "Miscellaneous"),
        (OTHER, "Other"),
    ]

    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.CASCADE,
        related_name="expenses"
    )
    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="expenses"
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default=MISC)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "expenses"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.vehicle.registration_number} — {self.category} — ₹{self.amount}"
