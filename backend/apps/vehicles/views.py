"""Vehicle views — CRUD with filters, documents sub-endpoint."""
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.vehicles.models import Vehicle, VehicleDocument
from apps.vehicles.serializers import (
    VehicleSerializer, VehicleListSerializer, VehicleDocumentSerializer
)
from apps.accounts.permissions import IsFleetManagerOrReadOnly, IsFleetManager


class VehicleFilter(django_filters.FilterSet):
    type = django_filters.CharFilter(field_name="type", lookup_expr="iexact")
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    region = django_filters.CharFilter(field_name="region", lookup_expr="icontains")

    class Meta:
        model = Vehicle
        fields = ["type", "status", "region"]


class VehicleViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/vehicles/         — list (all roles)
    POST   /api/v1/vehicles/         — create (Fleet Manager only)
    GET    /api/v1/vehicles/{id}/    — detail (all roles)
    PATCH  /api/v1/vehicles/{id}/    — update (Fleet Manager only)
    DELETE /api/v1/vehicles/{id}/    — delete (Fleet Manager only)
    GET    /api/v1/vehicles/available/ — dispatch pool (Available only)
    """
    queryset = Vehicle.objects.prefetch_related(
        "documents", "fuel_logs", "maintenance_records"
    ).all()
    permission_classes = [IsAuthenticated, IsFleetManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VehicleFilter
    search_fields = ["registration_number", "name_model", "region"]
    ordering_fields = ["registration_number", "status", "created_at", "acquisition_cost"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return VehicleListSerializer
        return VehicleSerializer

    @action(detail=False, methods=["get"], url_path="available")
    def available(self, request):
        """
        BR2: Returns only Available vehicles for dispatch pool.
        Retired and In Shop vehicles are excluded.
        """
        qs = Vehicle.objects.filter(status=Vehicle.AVAILABLE)
        serializer = VehicleListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=True, methods=["get", "post"],
        url_path="documents",
        permission_classes=[IsAuthenticated, IsFleetManager]
    )
    def documents(self, request, pk=None):
        """GET/POST /api/v1/vehicles/{id}/documents/"""
        vehicle = self.get_object()
        if request.method == "GET":
            docs = vehicle.documents.all()
            return Response(VehicleDocumentSerializer(docs, many=True).data)
        serializer = VehicleDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(vehicle=vehicle)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
