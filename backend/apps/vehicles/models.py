"""
Vehicle model — Phase 2.
BR1: registration_number unique enforced at DB level.
Status enum: Available / On Trip / In Shop / Retired.
"""
from django.db import models


class Vehicle(models.Model):
    # Status constants
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"

    STATUS_CHOICES = [
        (AVAILABLE, "Available"),
        (ON_TRIP, "On Trip"),
        (IN_SHOP, "In Shop"),
        (RETIRED, "Retired"),
    ]

    # Type constants
    VAN = "Van"
    TRUCK = "Truck"
    MINI = "Mini"
    BUS = "Bus"
    OTHER = "Other"

    TYPE_CHOICES = [
        (VAN, "Van"),
        (TRUCK, "Truck"),
        (MINI, "Mini"),
        (BUS, "Bus"),
        (OTHER, "Other"),
    ]

    # BR1: unique at DB level
    registration_number = models.CharField(max_length=50, unique=True, db_index=True)
    name_model = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=VAN)
    max_load_capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    odometer_km = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tyre_changed_odometer_km = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # BR14
    acquisition_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=AVAILABLE)
    region = models.CharField(max_length=100, blank=True, default="")
    owner_name = models.CharField(max_length=200, blank=True, default="")
    account_reference = models.CharField(max_length=100, blank=True, default="")
    last_depot_return = models.DateTimeField(null=True, blank=True)  # BR12
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "vehicles"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.registration_number} — {self.name_model}"

    @property
    def is_available_for_dispatch(self):
        """BR2: Only Available vehicles can be dispatched."""
        return self.status == self.AVAILABLE

    @property
    def needs_tyre_change(self):
        """BR14: Tyre wear threshold flag (40,000 km)"""
        return (self.odometer_km - self.tyre_changed_odometer_km) >= 40000

    @property
    def is_depot_overdue(self):
        """BR12: Flag vehicles that haven't returned to depot in > 7 days."""
        if not self.last_depot_return:
            return False
        from django.utils import timezone
        return (timezone.now() - self.last_depot_return).days > 7


class VehicleDocument(models.Model):
    """Enhancement: Vehicle documents (RC, Insurance, PUC, Permit) with expiry tracking."""
    RC = "RC"
    INSURANCE = "Insurance"
    PUC = "PUC"
    PERMIT = "Permit"

    DOC_TYPE_CHOICES = [
        (RC, "RC Book"),
        (INSURANCE, "Insurance"),
        (PUC, "PUC"),
        (PERMIT, "Permit"),
    ]

    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="documents"
    )
    doc_type = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES)
    doc_number = models.CharField(max_length=100)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    file_attachment_url = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vehicle_documents"
        unique_together = [("vehicle", "doc_type")]

    def __str__(self):
        return f"{self.vehicle.registration_number} — {self.doc_type}"
