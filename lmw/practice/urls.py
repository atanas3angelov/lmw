from django.urls import path
from . import views

app_name = 'practice'

urlpatterns = [
    path("react/", views.react_view, name="react"),
    path("files/<str:filename>", views.download_file, name='download_file'),
    path("<str:lang>/practice/", views.practice_view, name="practice"),
]
