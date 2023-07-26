from django.urls import path
from . import views

app_name = 'dictionary'

urlpatterns = [
    path("", views.index, name="index"),  # GET -> main menu
    path("<str:lang>/words/", views.words_view, name="words"),  # GET -> all, POST -> add word
    path("<str:lang>/forms/new_word/", views.new_word, name="new_word_form"),  # GET -> new word form
    path("<str:lang>/words/<int:word_id>", views.word_view, name="word"),  # POST -> fancy update, DELETE, GET
    path("<str:lang>/forms/edit_word/<int:word_id>", views.edit_word, name="edit_word_form"),  # GET -> update word form

    path("languages/", views.languages_view, name="languages"),  # GET -> all, POST -> add word
    path("languages/<int:language_id>", views.delete_language, name="delete_language"),  # any -> delete lang

    path("<str:lang>/", views.index, name="index"),  # GET -> main menu
]

'''
GET     /api/words  # Getting all resources
POST    /api/words  # Create new resource
GET     /api/words/<id>  # Get a single resource
PUT     /api/words/<id>  # Edit all fields
PATCH   /api/words/<id>  # Edit some fields
DELETE  /api/words/<id>  # Delete a resource
'''

'''
urlpatterns =[
    path('my-class/', views.MyClassView.as_view(http_method_names=['get'])),
    path('my-class/<int:id>/', views.MyClassView.as_view(http_method_names=['get'])),
    path('my-class/create/', views.MyClassView.as_view(http_method_names=['post'])),
    path('my-class/update/<int:id>/', views.MyClassView.as_view(http_method_names=['put'])),
    path('my-class/delete/<int:id>/', views.MyClassView.as_view(http_method_names=['delete'])),
]
'''