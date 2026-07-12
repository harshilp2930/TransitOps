"""Main URL configuration for TransitOps backend."""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/vehicles/", include("apps.vehicles.urls")),
    path("api/v1/drivers/", include("apps.drivers.urls")),
    path("api/v1/trips/", include("apps.trips.urls")),
    path("api/v1/maintenance/", include("apps.maintenance.urls")),
    path("api/v1/fuel-logs/", include("apps.finance.urls.fuel_urls")),
    path("api/v1/expenses/", include("apps.finance.urls.expense_urls")),
    path("api/v1/payments/", include("apps.finance.urls.payment_urls")),
    path("api/v1/reports/", include("apps.reports.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    # OpenAPI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
