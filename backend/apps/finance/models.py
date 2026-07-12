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
    pump_name = models.CharField(max_length=100, blank=True, default="")
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


class Payment(models.Model):
    ADVANCE = "Advance"
    BALANCE = "Balance"
    DIESEL = "Diesel Advance"
    OTHER = "Other"
    
    PAYMENT_TYPE_CHOICES = [
        (ADVANCE, "Driver Advance"),
        (BALANCE, "Balance Payment"),
        (DIESEL, "Diesel Advance"),
        (OTHER, "Other"),
    ]

    CASH = "Cash"
    BANK = "Bank Transfer"
    GPAY = "GPay/UPI"
    CHEQUE = "Cheque"
    
    PAYMENT_MODE_CHOICES = [
        (CASH, "Cash"),
        (BANK, "Bank Transfer"),
        (GPAY, "GPay/UPI"),
        (CHEQUE, "Cheque"),
    ]

    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.CASCADE,
        related_name="payments"
    )
    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="payments"
    )
    date = models.DateField()
    payment_type = models.CharField(max_length=30, choices=PAYMENT_TYPE_CHOICES, default=ADVANCE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES, default=CASH)
    reference_no = models.CharField(max_length=100, blank=True, default="")
    remarks = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.vehicle.registration_number} — {self.payment_type} — ₹{self.amount}"
