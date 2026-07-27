"""Serializers for parties."""
from rest_framework import serializers
from apps.parties.models import Party, FreightRate


class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = [
            "id", "name", "party_type", "gstin", "pan",
            "address", "city", "state", "pincode",
            "contact_person", "mobile", "mobile2", "email",
            "credit_limit", "credit_days", "balance",
            "is_active", "notes", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PartyListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = ["id", "name", "party_type", "city", "mobile", "gstin", "balance", "is_active"]


class FreightRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreightRate
        fields = [
            "id", "from_city", "to_city", "truck_type", "rate_type",
            "rate", "min_weight_kg", "max_weight_kg", "is_active", "notes", "created_at"
        ]
        read_only_fields = ["id", "created_at"]
