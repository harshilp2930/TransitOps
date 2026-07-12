from django.contrib import admin
from apps.maintenance.models import MaintenanceRecord


@admin.register(MaintenanceRecord)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ["vehicle", "service_type", "cost", "date", "status", "closed_at"]
    list_filter = ["status"]
    search_fields = ["vehicle__registration_number", "service_type"]
