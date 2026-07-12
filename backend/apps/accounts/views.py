"""Auth views: login/refresh/logout + user profile + user management."""
from django.contrib.auth import get_user_model
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from apps.accounts.serializers import (
    UserSerializer, UserCreateSerializer, RoleSerializer
)
from apps.accounts.models import Role
from apps.accounts.permissions import IsFleetManager

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/ — Returns access + refresh tokens with role payload."""
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Login",
        description="Authenticate with email+password. Returns JWT tokens with role embedded.",
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class RefreshView(TokenRefreshView):
    """POST /api/v1/auth/refresh/ — Refresh access token."""
    permission_classes = [AllowAny]


@extend_schema(summary="Logout", description="Blacklist the refresh token to logout.")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """POST /api/v1/auth/logout/ — Blacklists refresh token."""
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(summary="Current user profile")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """GET /api/v1/auth/me/ — Returns current user profile with role."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class UserListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/auth/users/ — List or create users (Fleet Manager only)."""
    queryset = User.objects.select_related("role").all()
    permission_classes = [IsAuthenticated, IsFleetManager]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer


class RoleListView(generics.ListAPIView):
    """GET /api/v1/auth/roles/ — List all roles and permission matrix."""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(summary="Update role permission matrix")
@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsFleetManager])
def update_role_permissions(request, pk):
    """PATCH /api/v1/auth/roles/{pk}/permissions/ — Update permission matrix."""
    try:
        role = Role.objects.get(pk=pk)
    except Role.DoesNotExist:
        return Response({"detail": "Role not found."}, status=404)
    matrix = request.data.get("permission_matrix", {})
    role.permission_matrix = matrix
    role.save(update_fields=["permission_matrix"])
    return Response(RoleSerializer(role).data)


class PublicRegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — Public registration."""
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer

    @extend_schema(summary="Public Registration", description="Register a new user.")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Optionally assign a default role if needed, currently left blank pending admin assignment
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ForgotPasswordView(generics.GenericAPIView):
    """POST /api/v1/auth/forgot-password/ — Simulate sending forgot password email."""
    permission_classes = [AllowAny]

    @extend_schema(summary="Forgot Password", description="Simulates sending a password reset email.")
    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Simulate sending email
        print(f"--- SIMULATED EMAIL ---")
        print(f"To: {email}")
        print(f"Subject: Password Reset Request")
        print(f"Body: Click the link to reset your password.")
        print(f"-----------------------")
        
        return Response({"detail": "If an account exists with this email, a reset link has been sent."}, status=status.HTTP_200_OK)
