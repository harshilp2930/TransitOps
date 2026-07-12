from django.contrib import admin
from apps.vehicles.models import Vehicle, VehicleDocument


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ["registration_number", "name_model", "type", "status", "max_load_capacity_kg"]
    list_filter = ["status", "type", "region"]
    search_fields = ["registration_number", "name_model"]


@admin.register(VehicleDocument)
class VehicleDocumentAdmin(admin.ModelAdmin):
    list_display = ["vehicle", "doc_type", "doc_number", "expiry_date"]
    list_filter = ["doc_type"]
