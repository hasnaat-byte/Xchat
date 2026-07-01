from django import forms
from .models import Profile

class ProfileForm(forms.ModelForm):

    class Meta:

        model = Profile

        fields = [
            "bio",
            "profile_picture",
        ]

        widgets = {
            "bio": forms.Textarea(
                attrs={
                    "class": "bio-textarea",
                    "placeholder": "Write something about yourself..."
                }
            )
        }

    def clean_profile_picture(self):

        image = self.cleaned_data.get("profile_picture")

        if image:

            # Max size = 2MB
            if image.size > 2 * 1024 * 1024:

                raise forms.ValidationError(
                    "Image size must be less than 2 MB."
                )

            allowed_types = [
                "image/jpeg",
                "image/png",
                "image/webp",
            ]

        return image
    
