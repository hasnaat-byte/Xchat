from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .forms import ProfileForm


def home(request):
    if request.user.is_authenticated:
        return redirect("users")
    return redirect("login")


def register(request):

    if request.method == "POST":

        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")
        username = request.POST.get("username")
        email = request.POST.get("email")
        password1 = request.POST.get("password")
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

            messages.success(
                request,
                "Welcome back!"
            )

            return redirect("users")

        messages.error(
            request,
            "Invalid username or password."
        )

    return render(
        request,
        "index.html"
    )


def user_logout(request):

    logout(request)
    return redirect("login")


@login_required
def edit_profile(request):

    profile = request.user.profile

    if request.method == "POST":

        form = ProfileForm(
            request.POST,
            request.FILES,
            instance=profile
        )

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Profile updated successfully."
            )

            return redirect("edit_profile")

    else:

        form = ProfileForm(
            instance=profile
        )

    return render(
        request,
        "index.html",
        {
            "form": form
        }
    )

@login_required
def profile(request):

    profile = request.user.profile

    return render(
        request,
        "profile.html",
        {
            "profile": profile,
        }
    )

@login_required
def user_profile(request, username):

    user = get_object_or_404(
       User,
       username = username 
    )

    profile = user.profile

    return render(
        "profile.html",
        {
            "profile":profile,
        }
    )