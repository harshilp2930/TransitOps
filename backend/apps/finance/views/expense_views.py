"""Expense serializers and views."""
from rest_framework import serializers, viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.finance.models import Expense
from apps.accounts.permissions import IsFinancialAnalystOrDispatcher


class ExpenseSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(
        source="vehicle.registration_number", read_only=True
    )
    trip_code = serializers.CharField(
        source="trip.trip_code", read_only=True, default=""
    )

    class Meta:
        model = Expense
        fields = [
            "id", "vehicle", "vehicle_reg", "trip", "trip_code",
            "category", "amount", "date", "notes", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    GET  /api/v1/expenses/ — list (all roles)
    POST /api/v1/expenses/ — create (Financial Analyst + Dispatcher)
    """
    queryset = Expense.objects.select_related("vehicle", "trip").all()
    permission_classes = [IsAuthenticated, IsFinancialAnalystOrDispatcher]
    serializer_class = ExpenseSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["vehicle", "trip", "category"]
    ordering_fields = ["date", "amount"]
    ordering = ["-date"]
