"""Notifications views and URLs."""
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "type", "reference_entity", "reference_id", "message", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=["patch"], url_path="read-all")
    def mark_all_read(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."})

    @action(detail=False, methods=["get"], url_path="expiries")
    def get_upcoming_expiries(self, request):
        """BR13: Fetch upcoming expiries (30 days) for Drivers and VehicleDocuments."""
        from django.utils import timezone
        from datetime import timedelta
        from apps.drivers.models import Driver
        from apps.vehicles.models import VehicleDocument
        
        today = timezone.now().date()
        threshold_date = today + timedelta(days=30)
        
        # Drivers
        drivers = Driver.objects.filter(
            license_expiry_date__lte=threshold_date,
            license_expiry_date__gte=today
        ).values("id", "name", "license_expiry_date")
        
        # Vehicle Documents
        docs = VehicleDocument.objects.filter(
            expiry_date__lte=threshold_date,
            expiry_date__gte=today
        ).select_related("vehicle")
        
        docs_data = []
        for d in docs:
            docs_data.append({
                "id": d.id,
                "vehicle_registration": d.vehicle.registration_number,
                "doc_type": d.doc_type,
                "expiry_date": d.expiry_date
            })
            
        return Response({
            "drivers": list(drivers),
            "vehicle_documents": docs_data
        })
