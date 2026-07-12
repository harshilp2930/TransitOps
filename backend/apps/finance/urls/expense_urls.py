from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.finance.views.expense_views import ExpenseViewSet

router = DefaultRouter()
router.register(r"", ExpenseViewSet, basename="expense")
urlpatterns = [path("", include(router.urls))]
