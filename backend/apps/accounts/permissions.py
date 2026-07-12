"""
RBAC permission classes — Design Doc §5 matrix.

Module            | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst
Dashboard         |      ✓        |     ✓      |       ✓        |        ✓
Fleet/Vehicles    |   ✓ (full)    |    view    |      view      |       view
Drivers           |   ✓ (full)    |    view    |   ✓ (full)     |        —
Trips/Dispatch    |     view      |  ✓ (full)  |        —       |       view
Maintenance       |   ✓ (full)    |     —      |        —       |       view
Fuel & Expenses   |      —        |  log only  |        —       |     ✓ (full)
Analytics/Reports |      ✓        |     —      |  ✓ (safety)    |        ✓
Settings & RBAC   |   ✓ (admin)   |     —      |        —       |        —
"""
from rest_framework.permissions import BasePermission
from apps.accounts.models import Role


class IsFleetManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role_name == Role.FLEET_MANAGER
        )


class IsDispatcher(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role_name == Role.DISPATCHER
        )


class IsSafetyOfficer(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role_name == Role.SAFETY_OFFICER
        )


class IsFinancialAnalyst(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role_name == Role.FINANCIAL_ANALYST
        )


class IsFleetManagerOrSafetyOfficer(BasePermission):
    """For Driver management — both FM and SO have full write access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role_name in (Role.FLEET_MANAGER, Role.SAFETY_OFFICER)
        )


class IsDispatcherOrReadOnly(BasePermission):
    """Trips: Dispatcher can write; others can read."""
    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in self.SAFE_METHODS:
            return True
        return request.user.role_name == Role.DISPATCHER


class IsFleetManagerOrReadOnly(BasePermission):
    """Vehicles: Fleet Manager can write; others can read."""
    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in self.SAFE_METHODS:
            return True
        return request.user.role_name == Role.FLEET_MANAGER


class IsFinancialAnalystOrDispatcher(BasePermission):
    """Fuel/Expense write: Financial Analyst full; Dispatcher log-only (POST only)."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = request.user.role_name
        if role == Role.FINANCIAL_ANALYST:
            return True
        if role == Role.DISPATCHER and request.method == "POST":
            return True
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return False


class IsFleetManagerForMaintenance(BasePermission):
    """Maintenance: Fleet Manager write; others read-only."""
    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in self.SAFE_METHODS:
            return True
        return request.user.role_name == Role.FLEET_MANAGER
