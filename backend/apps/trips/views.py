"""Trip views — all state transitions delegate to service layer."""
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.trips.models import Trip, TripLRDetail
from apps.trips.serializers import (
    TripSerializer, TripCreateSerializer, TripListSerializer, TripCompleteSerializer, TripLRDetailSerializer
)
from apps.accounts.permissions import IsDispatcherOrReadOnly
from services.trip_service import dispatch_trip, complete_trip, cancel_trip, TripServiceError


class TripLRDetailViewSet(viewsets.ModelViewSet):
    queryset = TripLRDetail.objects.all()
    serializer_class = TripLRDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        trip_id = self.request.query_params.get("trip_id")
        if trip_id:
            qs = qs.filter(trip_id=trip_id)
        return qs


class TripFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    vehicle = django_filters.NumberFilter(field_name="vehicle__id")
    driver = django_filters.NumberFilter(field_name="driver__id")

    class Meta:
        model = Trip
        fields = ["status", "vehicle", "driver"]


class TripViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/trips/                  — list all trips (all roles)
    POST   /api/v1/trips/                  — create draft trip (Dispatcher)
    GET    /api/v1/trips/{id}/             — detail (all roles)
    PATCH  /api/v1/trips/{id}/             — update draft (Dispatcher)
    POST   /api/v1/trips/{id}/dispatch/    — dispatch trip (Dispatcher)
    POST   /api/v1/trips/{id}/complete/    — complete trip (Dispatcher)
    POST   /api/v1/trips/{id}/cancel/      — cancel trip (Dispatcher)
    GET    /api/v1/trips/board/            — trips grouped by status (all roles)
    """
    queryset = Trip.objects.select_related(
        "vehicle", "driver", "created_by"
    ).all()
    permission_classes = [IsAuthenticated, IsDispatcherOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TripFilter
    search_fields = ["trip_code", "source", "destination"]
    ordering_fields = ["created_at", "dispatched_at", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return TripCreateSerializer
        if self.action == "list":
            return TripListSerializer
        if self.action == "complete":
            return TripCompleteSerializer
        return TripSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="dispatch")
    def dispatch_trip(self, request, pk=None):
        """POST /api/v1/trips/{id}/dispatch/ — BR2,3,4,5,6 enforced in service."""
        try:
            trip = dispatch_trip(int(pk), request.user)
            return Response(TripSerializer(trip).data, status=status.HTTP_200_OK)
        except TripServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """POST /api/v1/trips/{id}/complete/ — BR7 enforced in service."""
        serializer = TripCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            trip = complete_trip(
                int(pk),
                serializer.validated_data["final_odometer_km"],
                serializer.validated_data["fuel_consumed_l"],
                request.user
            )
            # Update fuel cost on the auto-created FuelLog if provided
            fuel_cost = serializer.validated_data.get("fuel_cost", 0)
            if fuel_cost:
                from apps.finance.models import FuelLog
                fl = FuelLog.objects.filter(trip=trip).order_by("-created_at").first()
                if fl:
                    fl.cost = fuel_cost
                    fl.save(update_fields=["cost"])
            return Response(TripSerializer(trip).data, status=status.HTTP_200_OK)
        except TripServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """POST /api/v1/trips/{id}/cancel/ — BR8 enforced in service."""
        try:
            trip = cancel_trip(int(pk), request.user)
            return Response(TripSerializer(trip).data, status=status.HTTP_200_OK)
        except TripServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def board(self, request):
        """GET /api/v1/trips/board/ — trips grouped by lifecycle stage for Live Board UI."""
        qs = self.get_queryset()
        result = {}
        for s in [Trip.DRAFT, Trip.DISPATCHED, Trip.COMPLETED, Trip.CANCELLED]:
            trips = qs.filter(status=s)
            result[s.lower()] = TripListSerializer(trips, many=True).data
        return Response(result)
