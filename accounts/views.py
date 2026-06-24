from django.shortcuts import render, redirect

# Create your views here.
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth import authenticate

def register(request):
    if request.method == "POST":

        username = request.POST["username"]
        password = request.POST["password"]

        User.objects.create_user(
            username=username,
            password=password
        )

        return redirect("login")
    
    return render(request, "register.html")

def user_login(request):
    if request.method == "POST":

        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(
            username=username,
            password=password
        )

        if user:
            login(request, user)

            return redirect("users")
        
    return render(request, "login.html")