from django.urls import path
from . import views

urlpatterns = [
    path("users/", views.users, name="users"),
    path("chat/<int:user_id>/", views.chat_room, name="chat"),
    path("api/me/", views.api_me, name="api_me"),
    path("api/conversations/", views.api_conversations, name="api_conversations"),
    path("api/conversations/<int:user_id>/messages/", views.api_send_message, name="api_send_message"),
]
