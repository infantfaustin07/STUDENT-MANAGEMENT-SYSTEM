from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Student(models.Model):
    """
    Represents a student record in the system.
    """
    name = models.CharField(
        max_length=150,
        help_text="Full name of the student."
    )
    email = models.EmailField(
        unique=True,
        help_text="Unique email address of the student."
    )
    age = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(99)],
        help_text="Age of the student (1–99)."
    )
    department = models.CharField(
        max_length=100,
        help_text="Department or course the student is enrolled in."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Student"
        verbose_name_plural = "Students"

    def __str__(self):
        return f"{self.name} ({self.department})"
