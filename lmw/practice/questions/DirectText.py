import random

from django.utils import timezone
from dictionary.models import Word, Translation

from ..util import get_words_for_practice, get_word_by_id


class DirectText:

    def __init__(self, context):
        self.context = context
        self.rand_translation_index = -1

    def ask(self, word_id=None):

        if self.context['redo_until_correct'] and word_id:
            self.word = get_word_by_id(word_id)
        else:
            self.word = get_words_for_practice(self.context['lang'], 1,
                                               self.context['word_type'],
                                               self.context['frequently_mistaken_words'],
                                               self.context['infrequently_practiced_words'])

        if self.context['question_direction'] == 'from':

            # only hide the word_text for unfamiliar language (when there is audio for it)
            if self.context['listening'] and self.word.pronunciation:
                self.word.word_text = "-" * len(self.word.word_text)

            # only add gender oriented practice if translating from unknown language
            if self.context['gender_oriented']:
                self.context['genders'] = ['m', 'f', 'n']

            self.context['word'] = self.word
        else:
            translations = [_.target_word for _ in Translation.objects.filter(source_word=self.word.id)]
            self.rand_translation_index = random.randint(0, len(translations) - 1)
            self.context['word'] = translations[self.rand_translation_index]

    def check(self, word_id, rand_translation_index, answer, gender=False):

        word = Word.objects.get(pk=word_id)
        translations = [_.target_word for _ in Translation.objects.filter(source_word=word.id)]
        translation_texts = [tr.word_text for tr in translations]

        # don't hide the word_text when checking answer (even for listening question type)

        if self.context['question_direction'] == 'from':

            if self.context['gender_oriented']:

                if answer in translation_texts and word.gender == gender:
                    word.correct += 1
                    message = 'correct'
                else:
                    word.mistakes += 1
                    message = 'incorrect'

                self.context['gender_answer'] = gender
                self.context['highlighted'] = word.gender

            else:

                if answer in translation_texts:
                    word.correct += 1
                    message = 'correct'
                else:
                    word.mistakes += 1
                    message = 'incorrect'
        else:
            if answer == word.word_text:
                word.correct += 1
                message = 'correct'
            else:
                word.mistakes += 1
                message = 'incorrect'

        word.last_practiced = timezone.now()
        word.save()

        if self.context['question_direction'] == 'from':
            self.context['word'] = word
        else:
            self.context['word'] = translations[rand_translation_index]

        self.context['answer'] = answer
        self.context['message'] = message

        if self.context['question_direction'] == 'from':
            self.context['message_additional'] = ' OR '.join(translation_texts)
        else:
            self.context['message_additional'] = word.word_text

        return True if message == 'correct' else False
