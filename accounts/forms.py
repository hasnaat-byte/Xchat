from django import forms
from django.contrib.auth.models import User

class RegisterForm(forms.Form):

    username = forms.CharField(max_length=150)

    email = forms.EmailField()

    password = forms.CharField(
        widget=forms.PasswordInput()
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput()
    )

    def clean_username(self):

        username = self.cleaned_data["username"]

        if len(username) < 5:

            raise forms.ValidationError(
                "Username must be at least 5 characters."
            )
        
        if " " in username:

            raise forms.ValidationError(
                "Username should not contain spaces."
            )
        
        return username
    
    def clean(self):

        cleaned_data = super().clean()

        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password != confirm_password:

            raise forms.ValidationError(
                "Passwords do not match."
            )
        
        return cleaned_data
    
class UserForm(forms.ModelForm):

    class Meta:

        model = User

        fields = [
            "first_name",
            "last_name",
            "username",
            "email",
        ]

