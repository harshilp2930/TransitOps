from django.contrib import admin
from apps.drivers.models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ["name", "license_number", "license_category", "license_expiry_date", "safety_score", "status"]
    list_filter = ["status", "license_category"]
    search_fields = ["name", "license_number"]
