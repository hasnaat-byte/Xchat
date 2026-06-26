from django.shortcuts import render, redirect

# Create your views here.
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth import authenticate
from django.contrib.auth import logout
from .models import Profile

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

def user_logout(request):
    logout(request)
    return redirect("login")

def profile(request):
    profile = Profile.objects.get(user=request.user)

    return render(
        request,
        "profile.html",
        {
            "profile":profile
        }
    )

def edit_profile(request):
    profile = Profile.objects.get(user=request.user)
    if request.method == "POST":

        profile.bio = request.POST["bio"]
        profile.save()

    return render(
        request,
        "edit_profile.html",
        {
            "profile":profile
        }
    )