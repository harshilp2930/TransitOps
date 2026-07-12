"""Payment serializers and views."""
from rest_framework import serializers, viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.finance.models import Payment
from apps.accounts.permissions import IsFinancialAnalystOrDispatcher


class PaymentSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(
        source="vehicle.registration_number", read_only=True
    )
    trip_code = serializers.CharField(
        source="trip.trip_code", read_only=True, default=""
    )

    class Meta:
        model = Payment
        fields = [
            "id", "vehicle", "vehicle_reg", "trip", "trip_code",
            "date", "payment_type", "amount", "payment_mode",
            "reference_no", "remarks", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class PaymentViewSet(viewsets.ModelViewSet):
    """
    GET  /api/v1/payments/ — list (all roles)
    POST /api/v1/payments/ — create (Financial Analyst + Dispatcher)
    """
    queryset = Payment.objects.select_related("vehicle", "trip").all()
    permission_classes = [IsAuthenticated, IsFinancialAnalystOrDispatcher]
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["vehicle", "trip", "payment_type", "payment_mode"]
    ordering_fields = ["date", "amount"]
    ordering = ["-date"]
