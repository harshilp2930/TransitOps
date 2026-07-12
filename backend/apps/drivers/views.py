"""Driver views."""
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.drivers.models import Driver
from apps.drivers.serializers import DriverSerializer, DriverListSerializer
from apps.accounts.permissions import (
    IsFleetManagerOrSafetyOfficer, IsFleetManagerOrReadOnly
)
from apps.accounts.models import Role


class DriverFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")

    class Meta:
        model = Driver
        fields = ["status"]


class DriverViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/drivers/          — list (all roles)
    POST   /api/v1/drivers/          — create (Fleet Manager + Safety Officer)
    GET    /api/v1/drivers/{id}/     — detail (all roles)
    PATCH  /api/v1/drivers/{id}/     — update (FM + SO only for status/safety_score)
    DELETE /api/v1/drivers/{id}/     — delete (FM + SO)
    GET    /api/v1/drivers/available/ — eligible dispatch pool (BR3)
    """
    queryset = Driver.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DriverFilter
    search_fields = ["name", "license_number", "contact_number"]
    ordering_fields = ["name", "status", "license_expiry_date", "safety_score"]
    ordering = ["name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "available"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsFleetManagerOrSafetyOfficer()]

    def get_serializer_class(self):
        if self.action == "list":
            return DriverListSerializer
        return DriverSerializer

    def partial_update(self, request, *args, **kwargs):
        """
        Restrict safety_score and status=Suspended fields to Safety Officer / Fleet Manager.
        Other roles get a 403 if they try to update these fields.
        """
        restricted_fields = {"safety_score", "status"}
        role = request.user.role_name
        allowed_roles = (Role.FLEET_MANAGER, Role.SAFETY_OFFICER)
        if restricted_fields.intersection(request.data.keys()):
            if role not in allowed_roles:
                return Response(
                    {"detail": "Only Safety Officers and Fleet Managers can update safety score or status."},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="available")
    def available(self, request):
        """
        BR3: Returns only drivers eligible for dispatch:
        - Status = Available
        - License not expired
        - Not Suspended
        """
        from django.utils import timezone
        today = timezone.now().date()
        qs = Driver.objects.filter(
            status=Driver.AVAILABLE,
            license_expiry_date__gt=today,  # not expired
        ).exclude(status=Driver.SUSPENDED)
        serializer = DriverListSerializer(qs, many=True)
        return Response(serializer.data)
