from django.urls import path
from apps.reports.views import dashboard_view, analytics_view, export_csv, export_pdf

urlpatterns = [
    path("dashboard/", dashboard_view, name="reports-dashboard"),
    path("analytics/", analytics_view, name="reports-analytics"),
    path("export.csv", export_csv, name="reports-export-csv"),
    path("export.pdf", export_pdf, name="reports-export-pdf"),
]
