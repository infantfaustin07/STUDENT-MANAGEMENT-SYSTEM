from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Student model with server-side field validation.
    """

    class Meta:
        model = Student
        fields = ["id", "name", "email", "age", "department", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    # ── Field-level validation ──────────────────────────────────────────────

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name cannot be blank.")
        if len(value) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        # On update, exclude the current instance from the uniqueness check
        instance = self.instance
        qs = Student.objects.filter(email=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A student with this email address already exists."
            )
        return value

    def validate_age(self, value):
        if value < 1 or value > 99:
            raise serializers.ValidationError("Age must be between 1 and 99.")
        return value

    def validate_department(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Department cannot be blank.")
        if len(value) < 2:
            raise serializers.ValidationError("Department must be at least 2 characters long.")
        return value
