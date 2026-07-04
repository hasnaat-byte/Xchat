from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Conversation(models.Model):

    participants = models.ManyToManyField(
        User,
        related_name="conversations"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):

        return f"Conversation {self.id}"


class Message(models.Model):
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
        null=True,
        blank=True,
    )
    
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE)

    content = models.TextField()

    timestamp = models.DateTimeField(auto_now_add=True)

    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"
