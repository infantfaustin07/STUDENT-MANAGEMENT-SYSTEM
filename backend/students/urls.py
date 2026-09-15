from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet

# DefaultRouter automatically generates all CRUD routes:
#   GET/POST     /api/students/
#   GET/PUT/PATCH/DELETE  /api/students/{id}/
router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="student")

urlpatterns = [
    path("", include(router.urls)),
]
