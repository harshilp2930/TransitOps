"""URL patterns for auth endpoints."""
from django.urls import path
from apps.accounts.views import (
    LoginView, RefreshView, logout_view, me_view,
    UserListCreateView, RoleListView, update_role_permissions,
    PublicRegisterView, ForgotPasswordView
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("logout/", logout_view, name="auth-logout"),
    path("me/", me_view, name="auth-me"),
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("roles/", RoleListView.as_view(), name="role-list"),
    path("roles/<int:pk>/permissions/", update_role_permissions, name="role-permissions"),
    path("register/", PublicRegisterView.as_view(), name="auth-register"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
]
