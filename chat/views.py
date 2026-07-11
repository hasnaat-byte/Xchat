from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from .models import Message
from .models import Conversation

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

    query = request.GET.get("q", "")

    users = User.objects.exclude(
        id=request.user.id
    )

    if query:

        users = users.filter(
            username__icontains=query
        )

    return render(
        request,
        "users.html",
        {
            "users": users,
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
def chat_room(request, conversation_id):

    conversation = get_object_or_404(
        Conversation,
        id=conversation_id
    )

    # Security check
    if request.user not in conversation.participants.all():
        return redirect("users")

    if request.method == "POST":

        content = request.POST.get("content")

        if content:

            Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=content
            )

            return redirect(
                "chat_room",
                conversation_id
            )


    messages = conversation.messages.all()

    return render(
        request,
        "chat_room.html",
        {
            "conversation":conversation,
            "messages":messages,
        }

    )    

@login_required
def start_conversation(request, username):

    other_user = get_object_or_404(
        User,
        username=username
    )

    # Prevent chatting with yourself
    if other_user == request.user:
        return redirect("users")
    
    conversations = Conversation.objects.filter(
        participants = request.user
    )

    conversations = None

    for conv in conversations:

        participants = conv.participants.all()

        if participants.count() == 2 and other_user in participants:

            conversation = conv
            break
        
        if conversation is None:

            conversation = Conversation.objects.create()

            conversation.participants.add(
                request.user,
                other_user
            )

        return redirect(
            "chat_room",
            conversation.id
        )