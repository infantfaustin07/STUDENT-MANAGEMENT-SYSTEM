"""
URL configuration for the Student Management System project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # DRF browsable API auth
    path("api-auth/", include("rest_framework.urls")),
    # Student app endpoints
    path("api/", include("students.urls")),
]
