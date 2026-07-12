"""
Trip model — Phase 4 (core).
Lifecycle: Draft → Dispatched → Completed / Cancelled
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


def generate_trip_code():
    return f"TR{uuid.uuid4().hex[:6].upper()}"


class Trip(models.Model):
    # Status constants
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

    STATUS_CHOICES = [
        (DRAFT, "Draft"),
        (DISPATCHED, "Dispatched"),
        (COMPLETED, "Completed"),
        (CANCELLED, "Cancelled"),
    ]

    # Load type (Should-have; field added to model now)
    PALLETIZED = "Palletized"
    LOOSE = "Loose"
    CONTAINER = "Container"
    LOAD_TYPE_CHOICES = [
        (PALLETIZED, "Palletized"),
        (LOOSE, "Loose"),
        (CONTAINER, "Container"),
    ]

    # Freight type (Should-have; field added to model now)
    FREIGHT_TYPE_CHOICES = [
        ("FMCG", "FMCG"),
        ("Industrial", "Industrial"),
        ("Perishable", "Perishable"),
        ("Pharmaceutical", "Pharmaceutical"),
        ("Automotive", "Automotive"),
        ("Other", "Other"),
    ]

    trip_code = models.CharField(
        max_length=20, unique=True, default=generate_trip_code, editable=False
    )
    trip_date = models.DateField(null=True, blank=True)
    source = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)

    # FK to Vehicle — nullable until assigned (or after cancel)
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="trips"
    )
    # FK to Driver — nullable until assigned
    driver = models.ForeignKey(
        "drivers.Driver",
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="trips"
    )

    cargo_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    planned_distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    arrival_date = models.DateField(null=True, blank=True)
    arrival_km = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    # Departure odometer (Dept. Km) and derived fields
    departure_km = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    run_km = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    average_kmpl = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    narration = models.TextField(blank=True, default="")
    revenue = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        help_text="Trip revenue / fee — used for ROI calculation"
    )
    planned_eta = models.DateTimeField(null=True, blank=True)

    # Enhancement fields (Should-have) — in model from Phase 4
    load_type = models.CharField(
        max_length=20, choices=LOAD_TYPE_CHOICES, blank=True, default=""
    )
    freight_type = models.CharField(
        max_length=30, choices=FREIGHT_TYPE_CHOICES, blank=True, default=""
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Completion data (required when completing a trip)
    final_odometer_km = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    fuel_consumed_l = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )

    # Depot tracking (Enhancement)
    home_depot_id = models.CharField(max_length=50, blank=True, default="")
    expected_return_date = models.DateField(null=True, blank=True)

    # Audit
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="created_trips"
    )

    class Meta:
        db_table = "trips"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.trip_code}: {self.source} → {self.destination} [{self.status}]"


class TripLRDetail(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="lr_details")
    lr_number = models.CharField(max_length=100)
    lr_date = models.DateField(null=True, blank=True)
    consignor = models.CharField(max_length=200)
    consignee = models.CharField(max_length=200)
    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    goods_description = models.CharField(max_length=200, blank=True, default="")
    loading_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unloading_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    party_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_freight = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    shortage_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trip_lr_details"

    def __str__(self):
        return f"LR {self.lr_number} for {self.trip.trip_code}"
