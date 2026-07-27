"""
Vehicle model — Phase 2 / Phase 4 update.
BR1: registration_number unique enforced at DB level.
Status enum: Available / On Trip / In Shop / Retired.
Phase 4: Added owner_type (Company vs Market), broker FK, avg_mileage_kmpl.
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

    # Owner type: Company-owned vs Market (hired) vehicle
    COMPANY = "Company"
    MARKET = "Market"
    OWNER_TYPE_CHOICES = [
        (COMPANY, "Company Owned"),
        (MARKET, "Market / Hired"),
    ]

    # BR1: unique at DB level
    registration_number = models.CharField(max_length=50, unique=True, db_index=True)
    name_model = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=VAN)
    owner_type = models.CharField(max_length=20, choices=OWNER_TYPE_CHOICES, default=COMPANY)
    broker = models.ForeignKey(
        "parties.Party",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="brokered_vehicles",
        limit_choices_to={"party_type": "Broker"},
        help_text="For Market vehicles: the broker/owner who supplied this truck"
    )
    broker_tds_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="TDS % to deduct on broker freight payments (typically 1-2%)"
    )
    max_load_capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    odometer_km = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tyre_changed_odometer_km = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # BR14
    acquisition_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    rolling_mileage_avg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    avg_mileage_kmpl = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text="Computed average mileage in km/L (for predictive ROI)"
    )
    tyre_replacement_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=40000)
    insurance_expiry = models.DateField(null=True, blank=True)
    fitness_expiry = models.DateField(null=True, blank=True)
    permit_expiry = models.DateField(null=True, blank=True)
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
        """BR14: Tyre wear threshold flag"""
        return (self.odometer_km - self.tyre_changed_odometer_km) >= self.tyre_replacement_threshold

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
