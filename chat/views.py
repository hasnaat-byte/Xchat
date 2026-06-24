from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from .models import Message
from django.db.models import Q

# Create your views here.
def users(request):

    sent_to = Message.objects.filter(
        sender=request.user
    ).values_list("receiver", flat=True)

    received_from = Message.objects.filter(
        receiver=request.user
    ).values_list("sender", flat=True)

    user_ids = set(sent_to) | set(received_from)

    all_users = User.objects.filter(
        id__in=user_ids
    )
    return render(
        request,
        "users.html",
        {
            "users":all_users
        }
    )

def chat_room(request, user_id):
    other_users = User.objects.get(
        id=user_id
    )

    if request.method == "POST":

        text = request.POST["text"]

        Message.objects.create(
            sender=request.user,
            receiver=other_users,
            text=text
        )
        return redirect(
            "chat",
            user_id=user_id
        )
    
    messages = Message.objects.filter(

        Q(
            sender=request.user,
            receiver=other_users
        )
        |
        Q(
            sender=other_users,
            receiver=request.user
        )
    ).order_by("created_at")

    return render(
        request,
        "chat.html",
        {
            "messages": messages,
            "other_user": other_users
        }
    )