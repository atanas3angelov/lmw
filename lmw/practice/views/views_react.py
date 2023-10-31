import json
import urllib

from django.utils import timezone
from django.http import JsonResponse, HttpResponse, HttpResponseNotFound
from django.urls import reverse
from django.conf import settings

from dictionary.views import files_dir
from dictionary.models import Word
from ..exceptions.InsufficientWordsError import InsufficientWordsError
from ..util import get_words_for_practice, serialize_words, get_allowed_question_types


def react_view(request):

    if request.method == 'GET':

        data = {
            'session': dict(zip(request.session.keys(), request.session.values())),
        }

        try:
            allowed_question_types = get_allowed_question_types(request.session)
            listening_only = set(allowed_question_types).issubset({'listening', 'listening_multiple_choice'})

            words = get_words_for_practice(request.session['lang'],
                                           request.session['fixed_word_num'],
                                           request.session['word_type'] if request.session['only_one_word_type'] else False,
                                           request.session['frequently_mistaken_words'],
                                           request.session['infrequently_practiced_words'],
                                           listening_only=listening_only)

            data['words'] = serialize_words(words)

            # send list / lists of other words for multichoice false answers
            if request.session['translation_direction'] == 'from':
                data['other_words_from'] = serialize_words(
                    get_words_for_practice('origin', len(words)), False)

            elif request.session['translation_direction'] == 'to':
                data['other_words_to'] = serialize_words(
                    get_words_for_practice(request.session['lang'], len(words)), False)

            else:  # mixed
                data['other_words_from'] = serialize_words(
                    get_words_for_practice('origin', len(words)), False)
                data['other_words_to'] = serialize_words(
                    get_words_for_practice(request.session['lang'], len(words)), False)

        except InsufficientWordsError as e:
            data['error'] = str(e)
            print(e)

        return JsonResponse(data)

    if request.method == 'POST':

        data_dict = json.loads(request.body)

        # update counts and last_practiced for returned words (don't need to guard against hacky user input)
        for w in data_dict:
            # update row in database without fetching and deserializing it
            Word.objects.filter(id=w['id']).update(
                correct=w['correct'],
                mistakes=w['mistakes'],
                last_practiced=timezone.now())

        lang = request.session['lang']

        # session clean-up before starting new one
        request.session.flush()

        return JsonResponse({'redirect_url': reverse('practice:practice', kwargs={'lang': lang})})

    return JsonResponse({'err': 'no clue'})  # other method types are not supported


def download_file(_request, filename):

    # for specially escaped character in url (e.g. l%C3%B6schen.mp3 -> löschen.mp3)
    filename = urllib.parse.unquote(filename)

    if filename == 'audio.jpg' or filename == 'no_audio.jog':
        file_path = './dictionary' + settings.STATIC_URL + 'dictionary/' + filename
        file_type = 'image/jpeg'
    else:
        file_path = './' + files_dir + filename
        file_type = 'audio/mpeg'

    try:
        with open(file_path, 'rb') as f:
            file_data = f.read()

        response = HttpResponse(file_data, content_type=file_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

    except IOError:
        response = HttpResponseNotFound()

    return response
