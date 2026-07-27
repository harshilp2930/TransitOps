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
    # TDS / Tax fields (Indian accounting compliance)
    tds_applicable = models.BooleanField(default=False, help_text="Is TDS applicable on payments to this party?")
    tds_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="TDS rate in %")
    tds_section = models.CharField(max_length=20, blank=True, default="194C", help_text="TDS section (e.g. 194C for transporters)")
    # Bank details for direct transfers
    bank_name = models.CharField(max_length=100, blank=True, default="")
    bank_account_number = models.CharField(max_length=50, blank=True, default="")
    bank_ifsc = models.CharField(max_length=20, blank=True, default="")
    bank_branch = models.CharField(max_length=100, blank=True, default="")
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


class Route(models.Model):
    """Route master: standard city pairs with pre-calculated costs.
    Used for auto-filling trip details and predictive ROI.
    """
    source = models.CharField(max_length=100, db_index=True)
    destination = models.CharField(max_length=100, db_index=True)
    standard_distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    standard_driver_allowance = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Fixed driver allowance/batta for this route (INR)"
    )
    estimated_tolls = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Estimated toll charges for this route (INR)"
    )
    estimated_fuel_cost = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Estimated total fuel cost at average mileage (INR)"
    )
    notes = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "routes"
        unique_together = [("source", "destination")]
        ordering = ["source", "destination"]

    def __str__(self):
        return f"{self.source} → {self.destination} ({self.standard_distance_km} km)"
