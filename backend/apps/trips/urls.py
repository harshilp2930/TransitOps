from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.trips.views import TripViewSet, TripLRDetailViewSet

router = DefaultRouter()
router.register(r'lr-details', TripLRDetailViewSet, basename='trip-lr-detail')
router.register(r'', TripViewSet, basename='trip')

urlpatterns = [
    path('', include(router.urls)),
]
