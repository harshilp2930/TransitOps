"""Driver serializers."""
from rest_framework import serializers
from django.utils import timezone
from apps.drivers.models import Driver


class DriverSerializer(serializers.ModelSerializer):
    is_license_expired = serializers.BooleanField(read_only=True)
    is_eligible_for_dispatch = serializers.BooleanField(read_only=True)
    days_until_license_expiry = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = [
            "id", "name", "license_number", "license_category",
            "license_expiry_date", "contact_number", "safety_score",
            "status", "created_at", "updated_at",
            "is_license_expired", "is_eligible_for_dispatch",
            "days_until_license_expiry"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_days_until_license_expiry(self, obj):
        delta = obj.license_expiry_date - timezone.now().date()
        return delta.days

    def validate_status(self, value):
        """
        BR3 enforcement: Safety Score + Suspended status restricted to
        Safety Officer and Fleet Manager. For others it's read-only.
        Validated in view layer via permission check.
        """
        return value


class DriverListSerializer(serializers.ModelSerializer):
    """Lightweight for list endpoints."""
    is_license_expired = serializers.BooleanField(read_only=True)
    days_until_license_expiry = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = [
            "id", "name", "license_number", "license_category",
            "license_expiry_date", "contact_number", "safety_score",
            "status", "is_license_expired", "days_until_license_expiry"
        ]

    def get_days_until_license_expiry(self, obj):
        delta = obj.license_expiry_date - timezone.now().date()
        return delta.days
