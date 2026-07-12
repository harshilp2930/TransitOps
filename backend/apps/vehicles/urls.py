"""Vehicle URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.vehicles.views import VehicleViewSet

router = DefaultRouter()
router.register(r"", VehicleViewSet, basename="vehicle")

urlpatterns = [
    path("", include(router.urls)),
]
