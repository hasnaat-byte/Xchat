from django.shortcuts import render, redirect

# Create your views here.
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth import authenticate
from django.contrib.auth import logout
from django.contrib import messages

from .forms import RegisterForm


def home(request):
    if request.user.is_authenticated:
        return redirect("users")
    return redirect("login")


def register(request):

    form = RegisterForm(request.POST)
    if form.is_valid():

        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")
        username = form.cleaned_data["username"]
        email = form.cleaned_data["email"]
        password = form.cleaned_data["password"]
        password2 = request.POST.get("password2")

        if password1 != password2:

            messages.error(
                request,
                "Passwords do not match."
            )

            return redirect("register")

        if User.objects.filter(username=username).exists():

            messages.error(
                request,
                "Username already exists."
            )

            return redirect("register")

        if User.objects.filter(email=email).exists():

            messages.error(
                request,
                "Email already exists."
            )

            return redirect("register")

        User.objects.create_user(
            first_name=first_name,
            last_name=last_name,
            username=username,
            email=email,
            password=password1
        )

        messages.success(
            request,
            "Account created successfully."
        )

        return redirect("login")

    return render(
        request,
        "index.html"
    )


def user_login(request):
    if request.user.is_authenticated:
        return redirect("users")

    if request.method == "POST":

        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(
            username=username,
            password=password
        )

        if user:
            login(request, user)
            messages.success(request, "Welcome back!")
            return redirect("users")

        messages.error(request, "Invalid username or password.")

    return render(request, "index.html")


def user_logout(request):
    logout(request)
    return redirect("login")
