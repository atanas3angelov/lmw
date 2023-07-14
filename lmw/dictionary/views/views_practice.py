import random

from django.shortcuts import render, get_object_or_404, redirect
from django.utils import timezone
from django.http import JsonResponse
from django.db.models import F
from django.forms import model_to_dict
from django.db import connection

from .views_dictionary import get_lang_menu
from ..models import Word, Translation
from ..exceptions.InsufficientWordsError import InsufficientWordsError


def practice_view(request, lang=''):

    if request.method == 'POST':

        langs, lang = get_lang_menu(lang)
        context = {"langs": langs, "lang": lang}

        if lang == 'origin':    # don't allow practice for 'origin'
            context["user_error"] = 'Change language to anything but "origin" in order to practice!'
            return render(request, "dictionary/practice.html", context)

        if request.POST.get('start', False):
            # ini session setting preferences

            request.session['started'] = True
            request.session['lang'] = lang

            try:
                set_session_ini_preferences(request)   # only populate session from POST fields

            except KeyError as e:

                request.session.flush()
                context['error_message'] = f'POST param {e.args[0]} is required'
                return render(request, "dictionary/practice.html", context)

        # handle question / answer
        if request.session.get('started', False):

            # abort session and return to practice setup
            if request.POST.get('end', False):
                request.session.flush()
                return render(request, "dictionary/practice.html", context)

            # word_num: limited  -> activate react frontend
            if request.session['word_num'] == 'fixed':
                return render(request, "dictionary/practice_react.html", context)

            # word_num: unlimited -> do everything in backend
            # TODO guard/recover from browser refresh/back
            if not request.POST.get('answer', False):  # if no answer, ask a question

                # decide translation direction if mixed selected
                if request.session['translation_direction'] == 'mixed':
                    request.session['question_direction'] = get_random_from(['from', 'to'])

                # decide next question type
                allowed_question_types = get_allowed_question_types(request.session)
                request.session['question_type'] = get_random_from(allowed_question_types)

                if request.session['question_type'] == 'direct_text':
                    word = get_words_for_practice(lang, 1)
                    request.session['word_id'] = word.id
                    # TODO question_direction to decide word (but keep word_id as is)
                    context['word'] = word

                    return render(request, "dictionary/practice_direct_text_q.html", context)

                # TODO do the rest question_type responses to set a question

            else:   # if answered, show check

                # word_num: limited  -> next answer request update words by the submitted ids and correct/mistake vals
                # word_num: unlimited -> do everything in backend

                if request.session['question_type'] == 'direct_text':

                    word_id = request.session['word_id']
                    word = Word.objects.get(pk=word_id)
                    answer = request.POST['answer']
                    translations = [_.target_word.word_text for _ in Translation.objects.filter(source_word=word.id)]

                    # TODO question_direction to decide comparison (but keep correct/mistake/last_practiced counter on word)
                    if answer in translations:
                        word.correct += 1
                        message = 'correct'
                    else:
                        word.mistakes += 1
                        message = 'incorrect'

                    word.last_practiced = timezone.now()
                    word.save()

                    context['word'] = word
                    context['answer'] = answer
                    context['message'] = message
                    # TODO question_direction reference word_text
                    context['message_additional'] = ' '.join(translations)

                    return render(request, "dictionary/practice_direct_text_a.html", context)

                # TODO do the rest question_type responses to check an answer

    else:
        # session clean-up before starting new one
        request.session.flush()

        langs, lang = get_lang_menu(lang)
        context = {"langs": langs, "lang": lang}

        return render(request, "dictionary/practice.html", context)


def react_view(request):

    if request.method == 'GET':

        data = {
            'session': dict(zip(request.session.keys(), request.session.values())),
        }

        try:
            words = get_words_for_practice(request.session['lang'],
                                           request.session['fixed_word_num'],
                                           request.session['word_type'] if request.session['only_one_word_type'] else False,
                                           request.session['frequently_mistaken_words'],
                                           request.session['infrequently_practiced_words'])

            data['words'] = serialize_words(words)

        except InsufficientWordsError as e:
            # TODO inform frontend and let it deal with user's input
            data['error'] = str(e)
            print(e)

        return JsonResponse(data)

    if request.method == 'POST':

        print('Raw Data: "%s"' % request.body)

        lang = request.session['lang']

        # session clean-up before starting new one
        request.session.flush()

        langs, lang = get_lang_menu(lang)
        context = {"langs": langs, "lang": lang}

        return render(request, "dictionary/practice.html", context)

    return JsonResponse({'err': 'no clue'})


def set_session_ini_preferences(request):

    request.session['word_num'] = request.POST['word_num']
    # fixed / unlimited

    if request.session['word_num'] == 'fixed':
        request.session['fixed_word_num'] = int(request.POST.get('fixed_word_num', 0))
    else:  # if request.session['word_num'] == 'unlimited'
        request.session['fixed_word_num'] = 0

    request.session['translation_direction'] = request.POST.get('translation_direction', 'mixed')
    # from / to / mixed

    request.session['only_one_word_type'] = bool(request.POST.get('only_one_word_type', False))

    if request.session:
        request.session['word_type'] = request.POST.get('word_type', 'n')
    # n / v / adj / adv / con / other

    request.session['gender_oriented'] = bool(request.POST.get('gender_oriented', False))

    request.session['frequently_mistaken_words'] = bool(request.POST.get('frequently_mistaken_words', False))
    request.session['infrequently_practiced_words'] = bool(request.POST.get('infrequently_practiced_words', False))

    request.session['direct_text'] = bool(request.POST.get('direct_text', False))
    request.session['multiple_choice'] = bool(request.POST.get('multiple_choice', False))
    request.session['multiple_choice_connect'] = bool(request.POST.get('multiple_choice_connect', False))
    request.session['listening'] = bool(request.POST.get('listening', False))
    request.session['listening_multiple_choice'] = bool(request.POST.get('listening_multiple_choice', False))

    request.session['redo_until_correct'] = bool(request.POST.get('redo_until_correct', False))


def get_allowed_question_types(session):

    allowed_question_types = []

    if session.get('direct_text', False):
        allowed_question_types.append('direct_text')
    if session.get('multiple_choice', False):
        allowed_question_types.append('multiple_choice')
    if session.get('multiple_choice_connect', False):
        allowed_question_types.append('multiple_choice_connect')
    if session.get('listening', False):
        allowed_question_types.append('listening')
    if session.get('listening_multiple_choice', False):
        allowed_question_types.append('listening_multiple_choice')

    if not allowed_question_types:  # empty list -> allow all
        allowed_question_types = [
            'direct_text',
            'multiple_choice',
            'multiple_choice_connect',
            'listening',
            'listening_multiple_choice'
        ]

    return allowed_question_types


def get_random_from(allowed_question_types):

    r = random.randint(0, len(allowed_question_types)-1)
    return allowed_question_types[r]


def get_words_for_practice(lang: str, n: int, word_type=False, frequently_mistaken=False, infrequently_practiced=False):
    """
    get words based on specifications
    :param lang: language for which to return words
    :param n: number of words to return (must be 1 or a positive whole number)
    :param word_type: leave False to return words of any type, else choose one of the following:
    ('n': nouns, 'v': verbs, 'adj': adjectives, 'adv': adverbs, 'con': conjunctions, 'other': other)
    to return words only from specified type
    :param frequently_mistaken: set to True to prioritizes words where num of (mistakes - correct) attempts is highest
    :param infrequently_practiced: set to True to prioritizes words where last_practiced timestamp is the oldest
    (if both frequently_mistaken and infrequently_practiced are set to True infrequently_practiced has priority)
    :return: 1 word if n=1 or words list according to specifications, or raise InsufficientWordsError
    """

    if n <= 0:  # you get nothing for trying to break the app
        return []

    words = Word.objects.filter(language=lang)

    if word_type not in ['n', 'v', 'adj', 'adv', 'con', 'other']:
        word_type = False

    if word_type:
        words = words.filter(word_type=word_type)

    if infrequently_practiced or frequently_mistaken:

        if infrequently_practiced:
            words = words.order_by('last_practiced')

        if frequently_mistaken:
            words = words.annotate(mc_diff=F('mistakes') - F('correct')).order_by('-mc_diff')

    else:
        # TODO? order('?') can be slow -- figure out faster solution for not contiguous ids
        words = words.order_by('?')

        # word = Word.objects.filter(language=lang).order_by('?').first()

        # random word with raw SQL
        # cursor = connection.cursor()
        # cursor.execute('''
        #     SELECT *
        #     FROM random AS r1 JOIN
        #         (SELECT CEIL(RAND() *
        #             (SELECT MAX(id) FROM random)) AS id)
        #         AS r2
        #     WHERE r1.id >= r2.id
        #     ORDER BY r1.id ASC
        #     LIMIT 1''')
        #
        # word = cursor.fetchone()

    if len(words) < n:
        raise InsufficientWordsError(f'available {len(words)}, asked {n}: lang {lang} only of type {word_type}')

    if n == 1:
        return words.first()
    else:
        return words[:n]


def serialize_words(words):

    words_json = []
    for word in words:
        w = model_to_dict(word, fields=[field.name for field in word._meta.fields])  # no translations

        # add translations
        trs = []
        for translation in word.translations.all():
            trs.append(model_to_dict(translation, fields=[field.name for field in word._meta.fields]))
        w['translations'] = trs

        words_json.append(w)

    return words_json
