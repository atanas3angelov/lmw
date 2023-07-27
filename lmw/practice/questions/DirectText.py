from django.utils import timezone
from dictionary.models import Word, Translation

from ..util import get_words_for_practice


class DirectText:

    def __init__(self, context, question_direction):
        self.context = context
        self.question_direction = question_direction

    def ask(self):
        self.word = get_words_for_practice(self.context['lang'], 1)
        # TODO question_direction to decide word (but keep word_id as is)
        self.context['word'] = self.word

    def check(self, word_id, answer):

        word = Word.objects.get(pk=word_id)
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

        self.context['word'] = word
        self.context['answer'] = answer
        self.context['message'] = message

        # TODO question_direction reference word_text
        self.context['message_additional'] = ' OR '.join(translations)

