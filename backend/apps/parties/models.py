"""
Party model — Sprint 2.
Represents Consignors, Consignees, and Transporters for LR/billing.
"""
from django.db import models


class Party(models.Model):
    CONSIGNOR = "Consignor"
    CONSIGNEE = "Consignee"
    TRANSPORTER = "Transporter"
    BROKER = "Broker"

    PARTY_TYPE_CHOICES = [
        (CONSIGNOR, "Consignor (Sender)"),
        (CONSIGNEE, "Consignee (Receiver)"),
        (TRANSPORTER, "Transporter"),
        (BROKER, "Broker / Agent"),
    ]

    name = models.CharField(max_length=200, db_index=True)
    party_type = models.CharField(max_length=20, choices=PARTY_TYPE_CHOICES, default=CONSIGNOR)
    gstin = models.CharField(max_length=15, blank=True, default="", help_text="GST Identification Number")
    pan = models.CharField(max_length=10, blank=True, default="", help_text="PAN Number")
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")
    pincode = models.CharField(max_length=10, blank=True, default="")
    contact_person = models.CharField(max_length=150, blank=True, default="")
    mobile = models.CharField(max_length=20, blank=True, default="")
    mobile2 = models.CharField(max_length=20, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    credit_limit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit_days = models.IntegerField(default=0)
    balance = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        help_text="Outstanding balance (positive = receivable, negative = payable)"
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "parties"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.party_type})"


class FreightRate(models.Model):
    """Rate card: from_city → to_city per truck type."""
    FLAT = "Flat"
    PER_KM = "Per KM"
    PER_TON = "Per Ton"
    PER_TON_KM = "Per Ton-KM"

    RATE_TYPE_CHOICES = [
        (FLAT, "Flat Rate"),
        (PER_KM, "Per KM"),
        (PER_TON, "Per Ton"),
        (PER_TON_KM, "Per Ton-KM"),
    ]

    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    truck_type = models.CharField(max_length=20, blank=True, default="")  # Van, Truck, etc.
    rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES, default=FLAT)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    min_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "freight_rates"
        ordering = ["from_city", "to_city"]

    def __str__(self):
        return f"{self.from_city} → {self.to_city} ({self.truck_type or 'Any'}) = ₹{self.rate}"
