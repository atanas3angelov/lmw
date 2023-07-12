from django.shortcuts import render, get_object_or_404, redirect
from .views_dictionary import get_lang_menu
from django.utils import timezone
from django.http import JsonResponse
from django.db import connection
import random
from ..models import Word, Translation


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
            request.session['q_a'] = 'q'  # set state to ask question / check answers

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

            # TODO guard/recover from browser refresh/back
            if request.session['q_a'] == 'q':
                request.session['q_a'] = 'a'    # next expected request should be an answer check request

                # word_num: limited  -> send words+translations to frontend; next answer request update those words
                if request.session['word_num'] == 'fixed':
                    context['react_context'] = {
                        'a': 1,
                        'b': 'abc'
                    }
                    return render(request, "dictionary/practice_react.html", context)
                # TODO

                # word_num: unlimited -> do everything in backend

                # decide translation direction if mixed selected
                if request.session['translation_direction'] == 'mixed':
                    request.session['question_direction'] = get_random_from(['from', 'to'])

                # decide next question type
                allowed_question_types = get_allowed_question_types(request.session)
                request.session['question_type'] = get_random_from(allowed_question_types)

                if request.session['question_type'] == 'direct_text':
                    word = get_practice_direct_text_q_word(context['lang'])
                    request.session['word_id'] = word.id
                    # TODO question_direction to decide word (but keep word_id as is)
                    context['word'] = word

                    return render(request, "dictionary/practice_direct_text_q.html", context)

                # TODO do the rest question_type responses to set a question

            else:   # if request.session['q_a'] == 'a'
                request.session['q_a'] = 'q'    # next expected request should be a new question

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

    # if request.method == 'GET':
    #
    #     return render(request, "dictionary/practice.html", context)

    else:
        langs, lang = get_lang_menu(lang)
        context = {"langs": langs, "lang": lang}

        return render(request, "dictionary/practice.html", context)


def react_view(request):
    if request.method == 'GET':

        data = {'a': 1, 'b': 'abc'}
        response = JsonResponse(data)

        # response["Access-Control-Allow-Origin"] = "*"
        # response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        # response["Access-Control-Max-Age"] = "1000"
        # response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type"

        return response

    if request.method == 'POST':

        pass

    return JsonResponse({'err': 'no clue'})


def set_session_ini_preferences(request):

    request.session['word_num'] = request.POST['word_num']
    # fixed / unlimited

    if request.session['word_num'] == 'fixed':
        request.session['fixed_word_num'] = request.POST.get('fixed_word_num', 0)
    else:  # if request.session['word_num'] == 'unlimited'
        request.session['fixed_word_num'] = 0

    request.session['translation_direction'] = request.POST.get('translation_direction', 'mixed')
    # from / to / mixed

    request.session['only_one_word_type'] = request.POST.get('only_one_word_type', False)

    if request.session:
        request.session['word_type'] = request.POST.get('word_type', 'n')
    # n / v / adj / adv / con / other

    request.session['gender_oriented'] = request.POST.get('gender_oriented', False)

    request.session['frequently_mistaken_words'] = request.POST.get('frequently_mistaken_words', False)
    request.session['infrequently_practiced_words'] = request.POST.get('infrequently_practiced_words', False)

    request.session['direct_text'] = request.POST.get('direct_text', False)
    request.session['multiple_choice'] = request.POST.get('multiple_choice', False)
    request.session['multiple_choice_connect'] = request.POST.get('multiple_choice_connect', False)
    request.session['listening'] = request.POST.get('listening', False)
    request.session['listening_multiple_choice'] = request.POST.get('listening_multiple_choice', False)

    request.session['redo_until_correct'] = request.POST.get('redo_until_correct', False)


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


# TODO generalize func for all the question_type input
def get_practice_direct_text_q_word(lang):

    # TODO? order('?') can be slow -- figure out faster solution for not contiguous ids
    word = Word.objects.filter(language=lang).order_by('?').first()
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
    return word
