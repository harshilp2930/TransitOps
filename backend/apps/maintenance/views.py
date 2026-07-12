"""Maintenance serializers and views."""
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.maintenance.models import MaintenanceRecord
from apps.accounts.permissions import IsFleetManagerForMaintenance
from services.maintenance_service import (
    open_maintenance, close_maintenance, MaintenanceServiceError
)


class MaintenanceSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(
        source="vehicle.registration_number", read_only=True
    )
    vehicle_name = serializers.CharField(
        source="vehicle.name_model", read_only=True
    )

    class Meta:
        model = MaintenanceRecord
        fields = [
            "id", "vehicle", "vehicle_reg", "vehicle_name",
            "service_type", "cost", "date", "status", "notes",
            "closed_at", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "status", "closed_at", "created_at", "updated_at"]


class MaintenanceCreateSerializer(serializers.Serializer):
    """Input for creating a maintenance record (triggers BR9)."""
    vehicle_id = serializers.IntegerField()
    service_type = serializers.CharField(max_length=200)
    cost = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    date = serializers.DateField()
    notes = serializers.CharField(required=False, default="", allow_blank=True)


class MaintenanceViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/maintenance/            — list (all roles)
    POST   /api/v1/maintenance/            — create (Fleet Manager) → triggers BR9
    GET    /api/v1/maintenance/{id}/       — detail (all roles)
    PATCH  /api/v1/maintenance/{id}/close/ — close (Fleet Manager) → triggers BR10
    """
    queryset = MaintenanceRecord.objects.select_related("vehicle").all()
    permission_classes = [IsAuthenticated, IsFleetManagerForMaintenance]
    serializer_class = MaintenanceSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return MaintenanceCreateSerializer
        return MaintenanceSerializer

    def create(self, request, *args, **kwargs):
        """BR9: Delegates to maintenance_service.open_maintenance()."""
        serializer = MaintenanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        try:
            record = open_maintenance(
                vehicle_id=d["vehicle_id"],
                service_type=d["service_type"],
                cost=d["cost"],
                date=d["date"],
                notes=d.get("notes", ""),
            )
            return Response(
                MaintenanceSerializer(record).data,
                status=status.HTTP_201_CREATED
            )
        except MaintenanceServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["patch"], url_path="close")
    def close(self, request, pk=None):
        """PATCH /api/v1/maintenance/{id}/close/ — BR10."""
        try:
            record = close_maintenance(int(pk))
            return Response(MaintenanceSerializer(record).data)
        except MaintenanceServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
