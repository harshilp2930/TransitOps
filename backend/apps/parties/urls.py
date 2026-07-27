"""URL configuration for parties."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.parties.views import PartyViewSet, FreightRateViewSet, RouteViewSet

router = DefaultRouter()
router.register(r"parties", PartyViewSet, basename="party")
router.register(r"freight-rates", FreightRateViewSet, basename="freight-rate")
router.register(r"routes", RouteViewSet, basename="route")

urlpatterns = [
    path("", include(router.urls)),
]
