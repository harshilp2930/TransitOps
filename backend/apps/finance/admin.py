from django.contrib import admin
from apps.finance.models import FuelLog, Expense, Payment


@admin.register(FuelLog)
class FuelLogAdmin(admin.ModelAdmin):
    list_display = ["vehicle", "trip", "date", "litres", "cost", "computed_mileage_kmpl", "is_anomaly_flagged"]
    list_filter = ["is_anomaly_flagged"]


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ["vehicle", "trip", "category", "amount", "date"]
    list_filter = ["category"]

from simple_history.admin import SimpleHistoryAdmin

@admin.register(Payment)
class PaymentAdmin(SimpleHistoryAdmin):
    list_display = ["vehicle", "trip", "payment_type", "amount", "payment_mode", "date"]
    list_filter = ["payment_type", "payment_mode"]
