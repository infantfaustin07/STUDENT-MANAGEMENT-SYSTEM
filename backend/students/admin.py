from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "email", "age", "department", "created_at"]
    list_filter = ["department"]
    search_fields = ["name", "email", "department"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]
