"""Trip serializers."""
from rest_framework import serializers
from apps.trips.models import Trip, TripLRDetail
from apps.vehicles.serializers import VehicleListSerializer
from apps.drivers.serializers import DriverListSerializer


class TripLRDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripLRDetail
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

class TripSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleListSerializer(source="vehicle", read_only=True)
    driver_detail = DriverListSerializer(source="driver", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True, default=""
    )
    lr_details = TripLRDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            "id", "trip_code", "trip_date", "source", "destination",
            "vehicle", "vehicle_detail",
            "driver", "driver_detail",
            "departure_km", "run_km", "average_kmpl",
            "cargo_weight_kg", "planned_distance_km", "revenue", "planned_eta",
            "arrival_date", "arrival_km", "narration",
            "load_type", "freight_type",
            "status", "created_at", "updated_at",
            "dispatched_at", "completed_at", "cancelled_at",
            "final_odometer_km", "fuel_consumed_l",
            "home_depot_id", "expected_return_date", "created_by", "created_by_name", "lr_details"
        ]
        read_only_fields = [
            "id", "trip_code", "created_at", "updated_at",
            "dispatched_at", "completed_at", "cancelled_at",
            "status", "created_by"
        ]

    def validate_cargo_weight_kg(self, value):
        # allow zero weight (legacy behaviour); only reject negative values
        if value is not None and value < 0:
            raise serializers.ValidationError("Cargo weight cannot be negative.")
        return value


class TripCreateSerializer(serializers.ModelSerializer):
    """Used for creating Draft trips."""
    class Meta:
        model = Trip
        fields = [
            "id", "trip_code",
            "source", "destination", "vehicle", "driver", "departure_km",
            "cargo_weight_kg", "planned_distance_km", "revenue", "planned_eta",
            "load_type", "freight_type", "home_depot_id", "expected_return_date"
        ]
        read_only_fields = ["id", "trip_code"]

    def validate_cargo_weight_kg(self, value):
        # allow zero weight on create to match legacy behaviour
        if value is not None and value < 0:
            raise serializers.ValidationError("Cargo weight cannot be negative.")
        return value


class TripCompleteSerializer(serializers.Serializer):
    """Input for completing a trip — final odometer + fuel consumed."""
    final_odometer_km = serializers.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Final odometer reading at trip completion"
    )
    fuel_consumed_l = serializers.DecimalField(
        max_digits=8, decimal_places=2,
        help_text="Total fuel consumed during the trip in litres"
    )
    fuel_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Optional: fuel cost for this fill-up (updates auto-created FuelLog)"
    )

    def validate_fuel_consumed_l(self, value):
        if value <= 0:
            raise serializers.ValidationError("Fuel consumed must be greater than 0.")
        return value


class TripListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list/board views."""
    vehicle_reg = serializers.CharField(
        source="vehicle.registration_number", read_only=True, default=""
    )
    driver_name = serializers.CharField(
        source="driver.name", read_only=True, default=""
    )

    class Meta:
        model = Trip
        fields = [
            "id", "trip_code", "source", "destination",
            "vehicle", "vehicle_reg", "driver", "driver_name",
            "cargo_weight_kg", "planned_distance_km", "revenue", "planned_eta",
            "load_type", "freight_type", "status", "expected_return_date",
            "created_at", "dispatched_at", "completed_at", "cancelled_at"
        ]
