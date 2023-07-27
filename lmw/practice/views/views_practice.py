from django.shortcuts import render

from dictionary.views import get_lang_menu
from ..util import get_allowed_question_types, get_random_from
from ..questions.DirectText import DirectText


def practice_view(request, lang=''):

    if request.method == 'POST':

        langs, lang = get_lang_menu(lang)
        context = {"langs": langs, "lang": lang}

        # don't allow practice for 'origin'
        if lang == 'origin':
            context["user_error"] = 'Change language to anything but "origin" in order to practice!'
            return render(request, "practice/practice.html", context)

        # ini session setting preferences
        if request.POST.get('start', False):

            request.session['started'] = True
            request.session['lang'] = lang

            try:
                set_session_ini_preferences(request)   # only populate session from POST fields

            except KeyError as e:

                request.session.flush()
                context['error_message'] = f'POST param {e.args[0]} is required'
                return render(request, "practice/practice.html", context)

        # handle question / answer
        if request.session.get('started', False):

            # abort session and return to practice setup
            if request.POST.get('end', False):
                request.session.flush()
                return render(request, "practice/practice.html", context)

            # word_num: limited  -> activate react frontend
            if request.session['word_num'] == 'fixed':
                return render(request, "practice/practice_react.html", context)

            # word_num: unlimited -> do everything in backend
            # TODO guard/recover from browser refresh/back
            if not request.POST.get('answer', False):  # if no answer, ask a question

                # decide translation direction if mixed selected
                if request.session['translation_direction'] == 'mixed':
                    request.session['question_direction'] = get_random_from(['from', 'to'])

                # decide next question type
                allowed_question_types = get_allowed_question_types(request.session)
                request.session['question_type'] = get_random_from(allowed_question_types)

                # render question based on type
                if request.session['question_type'] == 'direct_text':

                    question = DirectText(context, request.session['question_direction'])
                    question.ask()  # question picks the word and makes it into property
                    request.session['word_id'] = question.word.id

                    return render(request, "practice/practice_direct_text.html", question.context)

                # TODO do the rest question_type responses to set a question

            else:   # if answered, show check

                if request.session['question_type'] == 'direct_text':

                    answer = DirectText(context, request.session['question_direction'])
                    answer.check(request.session['word_id'], request.POST['answer'])

                    return render(request, "practice/practice_direct_text.html", answer.context)

                # TODO do the rest question_type responses to check an answer

    else:
        # session clean-up before starting new one
        request.session.flush()

        langs, lang = get_lang_menu(lang)
        context = {"langs": langs, "lang": lang}

        return render(request, "practice/practice.html", context)


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

