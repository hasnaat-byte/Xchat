from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("register/", views.register, name="register"),
    path("login/", views.user_login, name="login"),
    path("logout/", views.user_logout, name="logout"),
    path(
        "edit-profile/",
        views.edit_profile,
        name="edit_profile"
    ),
    path("profile/", views.profile, name="profile"),
    path("user/<str:username>/",views.user_profile,name="user_profile"),
]
