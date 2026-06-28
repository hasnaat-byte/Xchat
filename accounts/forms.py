from django import forms
from .models import Profile

class ProfileForm(forms.ModelForm):

    class Meta:

        model = Profile

        fields = [
            "bio",
            "profile_picture",
        ]

class ProfileForm(forms.ModelForm):

    class Meta:

        model = Profile

        fields = [
            "bio",
            "profile_picture",
        ]

    def clean_profile_picture(self):

        image = self.cleaned_data.get("profile_picture")

        if image:

            # Maximum size = 2MB
            if image.size > 2 * 1024 * 1024:

                raise forms.ValidationError(
                    "Image size must be less than 2MB."
                )
            # Allowed file types
            allowed_types = [
                "image/jpeg",
                "image/png",
                "image/webp",

            ]

            if image.content_type not in allowed_types:

                raise forms.ValidationError(
                    "Only JPG, PNG and WEBP images are allowed."
                )
        
        return image
    
