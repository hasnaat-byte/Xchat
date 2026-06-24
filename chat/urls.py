from django.urls import path
from . import views

urlpatterns = [
    path("users/",views.users, name ="users"),
    path("chat/<int:user_id>/",
         views.chat_room,
         name="chat"
         ),
]