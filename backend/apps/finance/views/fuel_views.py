"""FuelLog serializers and views."""
from rest_framework import serializers, viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.finance.models import FuelLog
from apps.accounts.permissions import IsFinancialAnalystOrDispatcher
from services.fuel_service import compute_and_store_mileage


class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(
        source="vehicle.registration_number", read_only=True
    )
    trip_code = serializers.CharField(
        source="trip.trip_code", read_only=True, default=""
    )

    class Meta:
        model = FuelLog
        fields = [
            "id", "vehicle", "vehicle_reg", "trip", "trip_code",
            "date", "litres", "cost", "odometer_at_fill",
            "computed_mileage_kmpl", "is_anomaly_flagged", "created_at"
        ]
        read_only_fields = ["id", "computed_mileage_kmpl", "is_anomaly_flagged", "created_at"]


class FuelLogViewSet(viewsets.ModelViewSet):
    """
    GET  /api/v1/fuel-logs/ — list (all roles)
    POST /api/v1/fuel-logs/ — create (Financial Analyst + Dispatcher)
    """
    queryset = FuelLog.objects.select_related("vehicle", "trip").all()
    permission_classes = [IsAuthenticated, IsFinancialAnalystOrDispatcher]
    serializer_class = FuelLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["vehicle", "trip", "is_anomaly_flagged"]
    ordering_fields = ["date", "created_at"]
    ordering = ["-date"]

    def perform_create(self, serializer):
        fuel_log = serializer.save()
        # Compute mileage and check BR11 after save
        compute_and_store_mileage(fuel_log)
