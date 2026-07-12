from django.urls import path
from apps.reports.views import dashboard_view, analytics_view, export_csv

urlpatterns = [
    path("dashboard/", dashboard_view, name="reports-dashboard"),
    path("analytics/", analytics_view, name="reports-analytics"),
    path("export.csv", export_csv, name="reports-export-csv"),
]
