"""URL configuration for parties."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.parties.views import PartyViewSet, FreightRateViewSet

router = DefaultRouter()
router.register(r"parties", PartyViewSet, basename="party")
router.register(r"freight-rates", FreightRateViewSet, basename="freight-rate")

urlpatterns = [
    path("", include(router.urls)),
]
