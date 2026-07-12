from django.contrib import admin
from apps.trips.models import Trip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ["trip_code", "source", "destination", "vehicle", "driver", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["trip_code", "source", "destination"]
    readonly_fields = ["trip_code", "dispatched_at", "completed_at", "cancelled_at"]
