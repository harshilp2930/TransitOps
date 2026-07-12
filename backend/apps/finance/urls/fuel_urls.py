from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.finance.views.fuel_views import FuelLogViewSet

router = DefaultRouter()
router.register(r"", FuelLogViewSet, basename="fuellog")
urlpatterns = [path("", include(router.urls))]
