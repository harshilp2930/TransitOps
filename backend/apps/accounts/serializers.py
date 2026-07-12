"""Serializers for accounts — JWT, user registration, profile."""
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from apps.accounts.models import Role

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends JWT payload to include role + full_name.
    Also enforces login lockout after 5 failed attempts.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role_name
        token["full_name"] = user.full_name
        token["email"] = user.email
        return token

    def validate(self, attrs):
        email = attrs.get("username", attrs.get("email", ""))
        # Check lockout
        try:
            user = User.objects.get(email=email)
            if user.locked_until and user.locked_until > timezone.now():
                remaining = (user.locked_until - timezone.now()).seconds // 60
                raise AuthenticationFailed(
                    f"Account locked due to too many failed attempts. "
                    f"Try again in {remaining + 1} minute(s)."
                )
        except User.DoesNotExist:
            pass

        try:
            data = super().validate(attrs)
            # Reset failed attempts on success
            self.user.failed_login_attempts = 0
            self.user.locked_until = None
            self.user.save(update_fields=["failed_login_attempts", "locked_until"])
            
            data["user_id"] = self.user.id
            data["full_name"] = self.user.full_name
            data["role"] = self.user.role_name
            return data
        except AuthenticationFailed:
            # Increment failed attempts
            try:
                from django.conf import settings
                limit = getattr(settings, "LOGIN_ATTEMPT_LIMIT", 5)
                timeout = getattr(settings, "LOGIN_ATTEMPT_TIMEOUT", 300)
                user = User.objects.get(email=email)
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= limit:
                    user.locked_until = timezone.now() + timezone.timedelta(seconds=timeout)
                user.save(update_fields=["failed_login_attempts", "locked_until"])
            except User.DoesNotExist:
                pass
            raise


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "permission_matrix"]


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "role", "role_name",
            "depot_id", "is_active", "date_joined"
        ]
        read_only_fields = ["id", "date_joined"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Used by admin/seeder to create users with role assignment."""
    password = serializers.CharField(write_only=True, min_length=6)
    role_name = serializers.ChoiceField(
        choices=[r[0] for r in Role.ROLE_CHOICES], write_only=True
    )

    class Meta:
        model = User
        fields = ["email", "full_name", "password", "role_name", "depot_id"]

    def create(self, validated_data):
        role_name = validated_data.pop("role_name")
        password = validated_data.pop("password")
        role, _ = Role.objects.get_or_create(name=role_name)
        user = User.objects.create_user(
            password=password, role=role, **validated_data
        )
        return user
