from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from .models import Message


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "online": False,
    }


def serialize_message(message, current_user):
    return {
        "id": message.id,
        "sender": "me" if message.sender_id == current_user.id else "them",
        "text": message.text,
        "created_at": message.created_at.isoformat(),
        "status": "sent",
    }


@login_required
def users(request):
    query = request.GET.get("q")

    if query:
        all_users = User.objects.filter(
            username__icontains=query
        ).exclude(
            id=request.user.id
        )
    else:
        all_users = User.objects.exclude(
            id=request.user.id
        )

    return render(
        request,
        "index.html",
        {
            "users": all_users,
            "query": query,
        }
    )


@login_required
def api_me(request):
    return JsonResponse({"user": serialize_user(request.user)})


@login_required
def api_conversations(request):
    conversations = []
    other_users = User.objects.exclude(id=request.user.id)

    for other_user in other_users:
        messages = Message.objects.filter(
            Q(sender=request.user, receiver=other_user)
            |
            Q(sender=other_user, receiver=request.user)
        ).order_by("created_at")

        conversations.append({
            "id": other_user.id,
            "user": serialize_user(other_user),
            "unread_count": 0,
            "messages": [serialize_message(message, request.user) for message in messages],
        })

    return JsonResponse({"conversations": conversations})


@login_required
@require_POST
def api_send_message(request, user_id):
    other_user = get_object_or_404(User, id=user_id)
    text = request.POST.get("text", "").strip()

    if not text:
        return JsonResponse({"message": "Message cannot be empty."}, status=400)

    message = Message.objects.create(
        sender=request.user,
        receiver=other_user,
        text=text
    )

    return JsonResponse({"message": serialize_message(message, request.user)})


@login_required
def chat_room(request, user_id):

    other_user = get_object_or_404(
        User,
        id=user_id
    )

    if request.method == "POST":

        text = request.POST.get("text")

        Message.objects.create(
            sender=request.user,
            receiver=other_user,
            text=text
        )

        return redirect(
            "chat",
            user_id=user_id
        )

    messages = Message.objects.filter(

        Q(
            sender=request.user,
            receiver=other_user
        )
        |
        Q(
            sender=other_user,
            receiver=request.user
        )

    ).order_by("created_at")

    return render(
        request,
        "index.html",
        {
            "other_user": other_user,
            "messages": messages,
        }
    )
