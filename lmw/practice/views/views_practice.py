from django.shortcuts import render

from dictionary.views import get_lang_menu
from ..util import get_allowed_question_types, get_random_from
from ..questions import DirectText, MultipleChoice, MultiChoiceConnect


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

            # process answers from multiple_choice_connect - it doesn't have an answer check rendering
            if request.POST.get('word1_id', False):

                for i in range(1, 5):

                    # TODO figure out a more efficient interaction with the db
                    multi_choice_connect = MultiChoiceConnect(context)
                    multi_choice_connect.update(request.POST.get('word' + str(i) + '_id'),
                                                request.POST.get('word' + str(i) + '_correct'),
                                                request.POST.get('word' + str(i) + '_mistakes'))

            context['word_type'] = request.session.get('word_type', None)
            context['frequently_mistaken_words'] = request.session['frequently_mistaken_words']
            context['infrequently_practiced_words'] = request.session['infrequently_practiced_words']
            context['redo_until_correct'] = request.session['redo_until_correct']

            # word_num: unlimited -> do everything in backend
            # TODO guard/recover from browser refresh/back
            if not request.POST.get('answer', False):  # if no answer, ask a question

                # decide translation direction if mixed selected
                if request.session['translation_direction'] == 'mixed':
                    request.session['question_direction'] = get_random_from(['from', 'to'])
                else:
                    request.session['question_direction'] = request.session['translation_direction']

                # decide next question type
                allowed_question_types = get_allowed_question_types(request.session)
                request.session['question_type'] = get_random_from(allowed_question_types)

                # redo setting active -> retrieve word_id from session to redo
                if request.session['redo_until_correct'] and request.session.get('redo_id', False):
                    word_id = request.session['redo_id']
                else:
                    word_id = None

                # render question based on type
                if request.session['question_type'] == 'direct_text' or \
                        request.session['question_type'] == 'listening':

                    context['question_direction'] = request.session['question_direction']
                    context['listening'] = True if request.session['question_type'] == 'listening' else False
                    context['gender_oriented'] = request.session['gender_oriented']

                    question = DirectText(context)
                    question.ask(word_id)  # question picks the word and makes it into property or load from redo
                    request.session['word_id'] = question.word.id
                    request.session['rand_translation_index'] = question.rand_translation_index

                    return render(request, "practice/practice_direct_text.html", question.context)

                elif request.session['question_type'] == 'multiple_choice' or \
                        request.session['question_type'] == 'listening_multiple_choice':

                    context['question_direction'] = request.session['question_direction']
                    context['listening'] = True if request.session['question_type'] == 'listening_multiple_choice' \
                        else False

                    question = MultipleChoice(context)
                    question.ask(word_id)  # question picks the word and makes it into property or load from redo
                    request.session['word_id'] = question.word.id
                    request.session['rand_translation_index'] = question.rand_translation_index
                    request.session['other_words_ids'] = question.other_words_ids

                    return render(request, "practice/practice_multiple_choice.html", question.context)

                elif request.session['question_type'] == 'multiple_choice_connect':

                    question = MultiChoiceConnect(context)
                    question.ask()
                    request.session['words_ids'] = question.words_ids
                    request.session['answers_ids'] = question.answers_ids

                    return render(request, "practice/practice_multi_choice_connect.html", question.context)

            else:   # if answered, show check

                if request.session['question_type'] == 'direct_text' or \
                        request.session['question_type'] == 'listening':

                    context['question_direction'] = request.session['question_direction']
                    context['gender_oriented'] = request.session['gender_oriented']

                    answer = DirectText(context)
                    correct = answer.check(request.session['word_id'],
                                           request.session['rand_translation_index'],
                                           request.POST['answer'],
                                           request.POST.get('gender', False))

                    # redo setting active -> save word_id in session to redo
                    if request.session['redo_until_correct'] and not correct:
                        request.session['redo_id'] = request.session['word_id']
                    else:
                        if request.session.get('redo_id', False):
                            del request.session['redo_id']

                    return render(request, "practice/practice_direct_text.html", answer.context)

                elif request.session['question_type'] == 'multiple_choice' or \
                        request.session['question_type'] == 'listening_multiple_choice':

                    context['question_direction'] = request.session['question_direction']

                    answer = MultipleChoice(context)
                    correct = answer.check(request.session['word_id'],
                                           request.session['rand_translation_index'],
                                           request.session['other_words_ids'],
                                           request.POST['answer'])

                    # redo setting active -> save word_id in session to redo
                    if request.session['redo_until_correct'] and not correct:
                        request.session['redo_id'] = request.session['word_id']
                    else:
                        if request.session.get('redo_id', False):
                            del request.session['redo_id']

                    return render(request, "practice/practice_direct_text.html", answer.context)

                # for multiple_choice_connect no check answer rendering (it happens in js), but
                # processing of answers from multiple_choice_connect happens before checking for answer (top)
                # the redo for multiple_choice_connect is also unnecessary since
                #   next button is activated when all are answered correctly at least once (similar to redo)

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

    if request.session.get('only_one_word_type', False):
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
