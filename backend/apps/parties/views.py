"""Views for parties module."""
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from apps.parties.models import Party, FreightRate, Route
from apps.parties.serializers import PartySerializer, PartyListSerializer, FreightRateSerializer, RouteSerializer
from apps.accounts.permissions import IsFleetManagerOrReadOnly


class PartyFilter(django_filters.FilterSet):
    party_type = django_filters.CharFilter(field_name="party_type", lookup_expr="iexact")
    city = django_filters.CharFilter(field_name="city", lookup_expr="icontains")
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = Party
        fields = ["party_type", "city", "is_active"]


class PartyViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/parties/         — list (all roles)
    POST   /api/v1/parties/         — create (Fleet Manager)
    GET    /api/v1/parties/{id}/    — detail (all roles)
    PATCH  /api/v1/parties/{id}/    — update (Fleet Manager)
    DELETE /api/v1/parties/{id}/    — delete (Fleet Manager)
    """
    queryset = Party.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated, IsFleetManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PartyFilter
    search_fields = ["name", "city", "gstin", "mobile", "contact_person"]
    ordering_fields = ["name", "party_type", "city", "created_at", "balance"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action == "list":
            return PartyListSerializer
        return PartySerializer


class FreightRateViewSet(viewsets.ModelViewSet):
    """Rate card management."""
    queryset = FreightRate.objects.filter(is_active=True)
    serializer_class = FreightRateSerializer
    permission_classes = [IsAuthenticated, IsFleetManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["from_city", "to_city", "truck_type"]
    ordering_fields = ["from_city", "to_city", "rate"]
    ordering = ["from_city", "to_city"]


class RouteViewSet(viewsets.ModelViewSet):
    """Route master management: standard city pairs with costs and distances."""
    queryset = Route.objects.filter(is_active=True)
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated, IsFleetManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["source", "destination"]
    ordering_fields = ["source", "destination", "standard_distance_km"]
    ordering = ["source", "destination"]
