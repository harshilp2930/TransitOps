"""Serializers for vehicles — BR1 uniqueness enforced at serializer level."""
from rest_framework import serializers
from apps.vehicles.models import Vehicle, VehicleDocument


class VehicleDocumentSerializer(serializers.ModelSerializer):
    days_until_expiry = serializers.SerializerMethodField()
    expiry_status = serializers.SerializerMethodField()

    class Meta:
        model = VehicleDocument
        fields = [
            "id", "doc_type", "doc_number", "issue_date", "expiry_date",
            "file_attachment_url", "days_until_expiry", "expiry_status"
        ]

    def get_days_until_expiry(self, obj):
        if not obj.expiry_date:
            return None
        from django.utils import timezone
        delta = obj.expiry_date - timezone.now().date()
        return delta.days

    def get_expiry_status(self, obj):
        days = self.get_days_until_expiry(obj)
        if days is None:
            return "unknown"
        if days < 0:
            return "expired"
        if days <= 30:
            return "warning"
        return "ok"


class VehicleSerializer(serializers.ModelSerializer):
    """
    BR1: registration_number uniqueness validated at serializer level
    with a user-facing error message (not just a DB 500).
    """
    documents = VehicleDocumentSerializer(many=True, read_only=True)
    total_operational_cost = serializers.SerializerMethodField()
    category_expense_totals = serializers.SerializerMethodField()
    is_available_for_dispatch = serializers.BooleanField(read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            "id", "registration_number", "name_model", "type",
            "max_load_capacity_kg", "odometer_km", "tyre_changed_odometer_km", "acquisition_cost",
            "rolling_mileage_avg", "tyre_replacement_threshold",
            "insurance_expiry", "fitness_expiry", "permit_expiry",
            "status", "region", "owner_name", "account_reference", "last_depot_return", "created_at", "updated_at",
            "documents", "total_operational_cost", "category_expense_totals",
            "is_available_for_dispatch", "needs_tyre_change", "is_depot_overdue"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_registration_number(self, value):
        """BR1: Enforce unique registration number with clear error message."""
        value = value.strip().upper()
        qs = Vehicle.objects.filter(registration_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"Vehicle with registration number '{value}' already exists. "
                "Registration numbers must be unique."
            )
        return value

    def get_total_operational_cost(self, obj):
        """Derived: SUM(FuelLog.cost) + SUM(MaintenanceRecord.cost)."""
        fuel_cost = sum(
            fl.cost for fl in obj.fuel_logs.all()
        )
        maint_cost = sum(
            mr.cost for mr in obj.maintenance_records.all()
        )
        return float(fuel_cost + maint_cost)

    def get_category_expense_totals(self, obj):
        """Should-have: category-wise lifetime expense totals for vehicle profile."""
        fuel_cost = sum(fl.cost for fl in obj.fuel_logs.all())
        maint_cost = sum(mr.cost for mr in obj.maintenance_records.all())

        toll_cost = 0
        misc_cost = 0
        other_cost = 0
        for expense in obj.expenses.all():
            if expense.category == "Toll":
                toll_cost += expense.amount
            elif expense.category == "Misc":
                misc_cost += expense.amount
            else:
                other_cost += expense.amount

        return {
            "fuel": float(fuel_cost),
            "maintenance": float(maint_cost),
            "toll": float(toll_cost),
            "misc": float(misc_cost),
            "other": float(other_cost),
            "total": float(fuel_cost + maint_cost + toll_cost + misc_cost + other_cost),
        }


class VehicleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list endpoints (no nested docs)."""
    class Meta:
        model = Vehicle
        fields = [
            "id", "registration_number", "name_model", "type",
            "max_load_capacity_kg", "odometer_km", "tyre_changed_odometer_km", "acquisition_cost",
            "rolling_mileage_avg", "tyre_replacement_threshold",
            "insurance_expiry", "fitness_expiry", "permit_expiry",
            "status", "region", "owner_name", "account_reference", "last_depot_return", "created_at", "needs_tyre_change", "is_depot_overdue"
        ]
