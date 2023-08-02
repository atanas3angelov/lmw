import random

from django.utils import timezone
from dictionary.models import Word, Translation

from ..util import get_words_for_practice, get_word_by_id


class MultipleChoice:

    def __init__(self, context):
        self.context = context
        self.rand_translation_index = -1

    def ask(self, word_id):

        if self.context['redo_until_correct'] and word_id:
            self.word = get_word_by_id(word_id)
        else:
            self.word = get_words_for_practice(self.context['lang'], 1,
                                               None,
                                               self.context['frequently_mistaken_words'],
                                               self.context['infrequently_practiced_words'])

        translations = [_.target_word for _ in Translation.objects.filter(source_word=self.word.id)]

        if self.context['question_direction'] == 'from':

            # only hide the word_text for unfamiliar language (when there is audio for it)
            if self.context['listening'] and self.word.pronunciation:
                self.word.word_text = "-" * len(self.word.word_text)

            self.context['word'] = self.word
        else:
            self.rand_translation_index = random.randint(0, len(translations) - 1)
            self.context['word'] = translations[self.rand_translation_index]

        rand_correct_index = random.randint(0, 2)
        if self.context['question_direction'] == 'from':
            self.context['other_words'] = get_words_for_practice(lang='origin', n=2, full_random=True)
            self.context['other_words'].insert(rand_correct_index, translations[self.rand_translation_index])
        else:
            self.context['other_words'] = get_words_for_practice(lang=self.context['lang'], n=2, full_random=True)
            self.context['other_words'].insert(rand_correct_index, self.word)

        self.other_words_ids = [ow.id for ow in self.context['other_words']]

    def check(self, word_id, rand_translation_index, other_words_ids, answer):

        # avoid making several calls to db by querying for all related word ids - translations (new query)
        all_related_word_ids = [word_id, *other_words_ids]
        all_related_words = Word.objects.filter(pk__in=all_related_word_ids)

        # don't hide the word_text when checking answer (even for listening question type)

        other_words = []
        # loop through results to find word and re-establish original order of other_words
        for i in range(len(all_related_word_ids)):
            for rw in all_related_words:
                if rw.id == word_id:
                    word = rw
                    break
                elif rw.id == all_related_word_ids[i]:
                    other_words.append(rw)
                    break

        translations = [_.target_word for _ in Translation.objects.filter(source_word=word.id)]
        translation_texts = [tr.word_text for tr in translations]

        if self.context['question_direction'] == 'from':
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

        self.context['other_words'] = other_words

        self.context['answer'] = answer
        self.context['message'] = message

        if self.context['question_direction'] == 'from':
            self.context['message_additional'] = ' OR '.join(translation_texts)
        else:
            self.context['message_additional'] = word.word_text

        return True if message == 'correct' else False
