from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Profile

admin.site.register(Profile)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
    )