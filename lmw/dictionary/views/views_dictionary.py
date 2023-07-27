from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.utils import timezone
from django.utils.html import escape
from django.db.models import Q
from django.core.files.uploadedfile import UploadedFile

from ..models import Word, Translation, Language

import os

files_dir = "dictionary/static/dictionary/files/"


def index(request, lang=''):

    langs, lang = get_lang_menu(lang)

    return render(request, "dictionary/index.html", {"langs": langs, "lang": lang})


def languages_view(request):
    if request.method == 'POST':
        language = Language(name=request.POST['language'])
        language.save()
        return redirect("dictionary:languages")
    else:
        langs = Language.objects.values_list('name', flat=True).order_by('name')

        lang = langs[0] if langs else 'English'

        context = {
            "langs": langs,
            "lang": lang,
            "languages": Language.objects.order_by('name')
        }
        return render(request, "dictionary/languages.html", context)


def delete_language(_request, language_id):
    language = get_object_or_404(Language, pk=language_id)
    language.delete()

    # clear any words related to the language
    related_words = Word.objects.filter(language=language.name)
    trs = Translation.objects.filter(source_word__in=[w.id for w in related_words])
    translations = [_.target_word for _ in trs]

    # delete from Translation table
    trs.delete()

    # delete audio files
    for w in related_words:
        delete_file(w.pronunciation)
    for w in translations:
        delete_file(w.pronunciation)

    # delete from Word table
    related_words.delete()
    for translation in translations:
        translation.delete()

    return HttpResponse(status=200)


def words_view(request, lang=''):

    langs, lang = get_lang_menu(lang)

    # add new word
    if request.method == "POST":

        try:
            f1: UploadedFile = request.FILES['pronunciation'] \
                if 'pronunciation' in request.FILES else False

            if f1:
                handle_uploaded_file(f1)
                f1_name = escape(f1.name)
            else:
                f1_name = ''

            word = Word(
                word_text=escape(request.POST['word_text']),
                word_type=escape(request.POST['word_type']),
                language=escape(lang),
                gender=escape(request.POST['gender']),
                date_added=timezone.now(),
                pronunciation=f1_name,
            )
            word.save()

            translations_count = int(request.POST['translation_count'])

            for i in range(1, translations_count+1):

                if escape(request.POST[f'translation_text{i}']):

                    f: UploadedFile = request.FILES[f'translation_pronunciation{i}'] \
                        if f'translation_pronunciation{i}' in request.FILES \
                        else False

                    if f:
                        handle_uploaded_file(f)
                        f_name = escape(f.name)
                    else:
                        f_name = ''

                    translation = Word(
                        word_text=escape(request.POST[f'translation_text{i}']),
                        word_type=escape(request.POST['word_type']),
                        language='origin',
                        gender=escape('na'),
                        date_added=timezone.now(),
                        pronunciation=f_name,
                    )

                    translation.save()

                    Translation.objects.create(source_word=word, target_word=translation, date_added=timezone.now())
                    Translation.objects.create(source_word=translation, target_word=word, date_added=timezone.now())

            return redirect("dictionary:words", lang=lang)

        except KeyError:  # if no POST data

            context = {
                'langs': langs,
                'lang': lang,
                'error_message': "Fill in the required fields"
            }

            return render(request, "dictionary/new_word.html", context)

    # GET -> return all words
    else:

        words = Word.objects.filter(language=lang)

        context = {
            'langs': langs,
            'lang': lang,
            'words': words
        }

        return render(request, "dictionary/words.html", context)


# form to add word (actual adding happens in words_view after form submitted)
def new_word(request, lang=''):

    langs, lang = get_lang_menu(lang)

    context = {
        'langs': langs,
        'lang': lang
    }

    return render(request, "dictionary/new_word.html", context)


def word_view(request, word_id, lang=''):

    langs, lang = get_lang_menu(lang)

    word = Word.objects.get(pk=word_id)

    if request.method == 'DELETE':

        # find synonyms and translations to delete with the word
        translations, synonyms = get_translations_and_synonyms(word_id)

        # delete from Translation table
        Translation.objects.filter(
            Q(source_word=word_id) | Q(target_word=word_id)
        ).delete()

        # delete audio files
        delete_file(word.pronunciation)
        for w in translations:
            delete_file(w.pronunciation)
        for w in synonyms:
            delete_file(w.pronunciation)

        # delete from Word table
        word.delete()
        for translation in translations:
            translation.delete()
        for synonym in synonyms:
            synonym.delete()

        return redirect("dictionary:words", lang=lang)

    # fancy update
    elif request.method == "POST":

        try:
            # Update for main word

            word.word_text = escape(request.POST['word_text']) \
                if request.POST['word_text'] else word.word_text

            word.word_type = escape(request.POST['word_type'])

            word.gender = escape(request.POST['gender'])

            if int(request.POST['pronunciation_deleted']):
                delete_file(word.pronunciation)

            f1: UploadedFile = request.FILES['pronunciation'] \
                if 'pronunciation' in request.FILES else False

            if f1:
                delete_file(word.pronunciation)
                handle_uploaded_file(f1)
                word.pronunciation = escape(f1.name)

            word.save()

            # Delete for removed synonyms/translations

            ids_to_delete = request.POST.getlist('ids_to_delete[]')  # includes both synonym and translation ids
            ids_to_delete = [x for x in list(map(int, ids_to_delete)) if x > 0]

            if ids_to_delete:
                words_to_delete = Word.objects.filter(pk__in=ids_to_delete)

                for w in words_to_delete:
                    delete_file(w.pronunciation)

                words_to_delete.delete()

            # Add new synonyms

            new_synonyms_count = int(request.POST['synonym_count']) \
                if 'synonym_count' in request.POST else 0

            if new_synonyms_count > 0:

                for i in range(1, new_synonyms_count + 1):

                    if escape(request.POST[f'synonym_text{i}']):

                        f: UploadedFile = request.FILES[f'synonym_pronunciation{i}'] \
                            if f'synonym_pronunciation{i}' in request.FILES else False

                        if f:
                            handle_uploaded_file(f)
                            f_name = escape(f.name)
                        else:
                            f_name = ''

                        synonym = Word(
                            word_text=escape(request.POST[f'synonym_text{i}']),
                            word_type=word.word_type,
                            language=escape(lang),
                            date_added=timezone.now(),
                            pronunciation=f_name,
                        )

                        synonym.save()

                        old_translations = [_.target_word for _ in Translation.objects.filter(source_word=word_id)]

                        # add synonyms to all old translations
                        for old_translation in old_translations:
                            Translation.objects.create(source_word=synonym,
                                                       target_word=old_translation,
                                                       date_added=timezone.now())
                            Translation.objects.create(source_word=old_translation,
                                                       target_word=synonym,
                                                       date_added=timezone.now())

            # Add new translations

            new_translations_count = int(request.POST['translation_count'])

            if new_translations_count > 0:

                for i in range(1, new_translations_count + 1):

                    if escape(request.POST[f'translation_text{i}']):

                        f = request.FILES[f'translation_pronunciation{i}'] \
                            if f'translation_pronunciation{i}' in request.FILES else False

                        if f:
                            handle_uploaded_file(f)
                            f_name = escape(f.name)
                        else:
                            f_name = ''

                        old_translations = [tr.target_word for tr in Translation.objects.filter(source_word=word_id)]
                        reverse_lang = old_translations[0].language

                        translation = Word(
                            word_text=escape(request.POST[f'translation_text{i}']),
                            word_type=word.word_type,
                            language=escape(reverse_lang),
                            date_added=timezone.now(),
                            pronunciation=f_name,
                        )

                        translation.save()

                        # add only to current word, and not its synonyms
                        Translation.objects.create(source_word=word,
                                                   target_word=translation,
                                                   date_added=timezone.now())
                        Translation.objects.create(source_word=translation,
                                                   target_word=word,
                                                   date_added=timezone.now())

            redirect("dictionary:word", lang=lang, word_id=word.id)

        except KeyError:
            redirect("dictionary:word", lang=lang, word_id=word.id)

        return redirect("dictionary:word", lang=lang, word_id=word.id)

    # GET -> return word detail
    else:

        translations, synonyms = get_translations_and_synonyms(word_id)

        context = {
            'langs': langs,
            'lang': lang,
            'word': word,
            'synonyms': synonyms,
            'translations': translations
        }

        return render(request, "dictionary/word.html", context)


# form to edit word (actual editing happens in word_view after form submitted)
def edit_word(request, word_id, lang=''):

    langs, lang = get_lang_menu(lang)

    word = Word.objects.get(pk=word_id)

    translations, synonyms = get_translations_and_synonyms(word_id)

    context = {
        'langs': langs,
        'lang': lang,
        'word': word,
        'synonyms': synonyms,
        'translations': translations,
    }

    return render(request, "dictionary/edit_word.html", context)


def handle_uploaded_file(f):
    with open(files_dir + f.name, "wb+") as destination:
        for chunk in f.chunks():
            destination.write(chunk)


def delete_file(f_name):
    if f_name and os.path.exists(files_dir + f_name):
        os.remove(files_dir + f_name)


def get_translations_and_synonyms(word_id):

    translations = [_.target_word for _ in Translation.objects.filter(source_word=word_id)]

    synonyms = [_.source_word for _ in
                Translation.objects.filter(target_word__in=[tr.id for tr in translations])
                if not _.source_word.id == word_id]

    return translations, synonyms


def get_lang_menu(lang):
    langs = Language.objects.values_list('name', flat=True).order_by('name')

    if not lang:
        if langs:
            lang = langs[0]
        else:
            lang = 'English'

    return langs, lang
