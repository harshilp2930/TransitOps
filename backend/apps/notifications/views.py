"""Notifications views — real-time compliance alerts + persistent notifications."""
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "type", "reference_entity", "reference_id", "message", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.all().order_by("-created_at")

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=["patch"], url_path="read-all")
    def mark_all_read(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read.", "updated": True})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        """Returns total unread count (for bell badge)."""
        count = Notification.objects.filter(is_read=False).count()
        return Response({"unread_count": count})

    @action(detail=False, methods=["get"], url_path="expiries")
    def get_upcoming_expiries(self, request):
        """BR13: Fetch upcoming expiries (30 days) for Drivers and VehicleDocuments.
        Also auto-creates Notification records for new expiries found.
        """
        from apps.drivers.models import Driver
        from apps.vehicles.models import VehicleDocument

        today = timezone.now().date()
        threshold_date = today + timedelta(days=30)

        # Drivers with expiring licenses
        drivers = Driver.objects.filter(
            license_expiry_date__lte=threshold_date,
            license_expiry_date__gte=today - timedelta(days=7)
        ).values("id", "name", "license_expiry_date")

        # Vehicle Documents
        docs = VehicleDocument.objects.filter(
            expiry_date__lte=threshold_date,
            expiry_date__gte=today - timedelta(days=7)
        ).select_related("vehicle")

        docs_data = []
        for d in docs:
            docs_data.append({
                "id": d.id,
                "vehicle_registration": d.vehicle.registration_number,
                "doc_type": d.doc_type,
                "expiry_date": str(d.expiry_date),
            })

        # Auto-create notifications for newly discovered expiries
        _sync_driver_expiry_notifications(list(drivers), today)
        _sync_doc_expiry_notifications(docs, today)

        return Response({
            "drivers": [
                {**d, "license_expiry_date": str(d["license_expiry_date"])}
                for d in drivers
            ],
            "vehicle_documents": docs_data,
        })


def _sync_driver_expiry_notifications(drivers, today):
    """Auto-generate License Expiry notifications for drivers, avoid duplicates."""
    for d in drivers:
        expiry_date = d["license_expiry_date"]
        delta = (expiry_date - today).days
        message = (
            f"Driver {d['name']}'s license expired {abs(delta)} day(s) ago (was {expiry_date})."
            if delta < 0
            else f"Driver {d['name']}'s license expires in {delta} day(s) on {expiry_date}."
        )
        # Only create if one doesn't exist for this driver in the last 1 day
        exists = Notification.objects.filter(
            type=Notification.LICENSE_EXPIRY,
            reference_entity="Driver",
            reference_id=str(d["id"]),
            created_at__gte=timezone.now() - timedelta(days=1),
        ).exists()
        if not exists:
            Notification.objects.create(
                type=Notification.LICENSE_EXPIRY,
                reference_entity="Driver",
                reference_id=str(d["id"]),
                message=message,
            )


def _sync_doc_expiry_notifications(docs, today):
    """Auto-generate Document Expiry notifications for vehicle docs."""
    from apps.vehicles.models import VehicleDocument
    for d in docs:
        delta = (d.expiry_date - today).days
        message = (
            f"{d.doc_type} for {d.vehicle.registration_number} expired {abs(delta)} day(s) ago."
            if delta < 0
            else f"{d.doc_type} for {d.vehicle.registration_number} expires in {delta} day(s)."
        )
        exists = Notification.objects.filter(
            type=Notification.DOCUMENT_EXPIRY,
            reference_entity="VehicleDocument",
            reference_id=str(d.id),
            created_at__gte=timezone.now() - timedelta(days=1),
        ).exists()
        if not exists:
            Notification.objects.create(
                type=Notification.DOCUMENT_EXPIRY,
                reference_entity="VehicleDocument",
                reference_id=str(d.id),
                message=message,
            )
