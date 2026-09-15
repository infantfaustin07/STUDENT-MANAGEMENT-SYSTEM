from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """
    A ViewSet that provides full CRUD operations for Student records.

    Endpoints (via DRF DefaultRouter):
        GET    /api/students/          - list all students
        POST   /api/students/          - create a student
        GET    /api/students/{id}/     - retrieve a single student
        PUT    /api/students/{id}/     - full update
        PATCH  /api/students/{id}/     - partial update
        DELETE /api/students/{id}/     - delete a student
    """

    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    # ── List (GET /api/students/) ──────────────────────────────────────────

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        # Optional: search by name or department via ?search=
        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                name__icontains=search
            ) | queryset.filter(
                department__icontains=search
            )
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": queryset.count(),
            "students": serializer.data,
        }, status=status.HTTP_200_OK)

    # ── Create (POST /api/students/) ───────────────────────────────────────

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Student created successfully.",
                "student": serializer.data,
            }, status=status.HTTP_201_CREATED)
        return Response({
            "message": "Validation failed.",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    # ── Retrieve (GET /api/students/{id}/) ────────────────────────────────

    def retrieve(self, request, pk=None, *args, **kwargs):
        student = get_object_or_404(Student, pk=pk)
        serializer = self.get_serializer(student)
        return Response({
            "student": serializer.data,
        }, status=status.HTTP_200_OK)

    # ── Update (PUT /api/students/{id}/) ──────────────────────────────────

    def update(self, request, pk=None, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        student = get_object_or_404(Student, pk=pk)
        serializer = self.get_serializer(student, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Student updated successfully.",
                "student": serializer.data,
            }, status=status.HTTP_200_OK)
        return Response({
            "message": "Validation failed.",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    # ── Partial Update (PATCH /api/students/{id}/) ────────────────────────

    def partial_update(self, request, pk=None, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, pk, *args, **kwargs)

    # ── Destroy (DELETE /api/students/{id}/) ──────────────────────────────

    def destroy(self, request, pk=None, *args, **kwargs):
        student = get_object_or_404(Student, pk=pk)
        name = student.name
        student.delete()
        return Response({
            "message": f"Student \"{name}\" deleted successfully.",
        }, status=status.HTTP_200_OK)
