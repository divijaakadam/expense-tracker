from django.contrib import admin
from django.urls import path
from tracker.views import dashboard, delete_expense

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", dashboard, name="dashboard"),
    path("delete/<int:expense_id>/", delete_expense, name="delete"),
]