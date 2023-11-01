import random

from django.utils import timezone

from dictionary.models import Word
from practice.util import get_words_for_practice


class MultiChoiceConnect:

    def __init__(self, context):
        self.context = context

    def ask(self):

        self.words = get_words_for_practice(self.context['lang'], 4,
                                            self.context['word_type'],
                                            self.context['frequently_mistaken_words'],
                                            self.context['infrequently_practiced_words']
                                            )

        self.context['words'] = self.words

        self.words_ids = [w.id for w in self.words]  # to be saved in session

        self.answers = []
        for word in self.words:
            trs = word.translations.all()
            # pick translation randomly
            ans = trs[random.randint(0, len(trs) - 1)]
            # add word.id so that the pair can be identified
            ans.word_id = word.id
            self.answers.append(ans)
        # shuffle answers
        random.shuffle(self.answers)
        self.context['answers'] = self.answers

        self.answers_ids = [a.id for a in self.answers]  # to be saved in session

    # TODO? make into static (not a class method)
    def update(self, word_id, correct, mistakes):
        word = Word.objects.get(pk=word_id)
        word.correct = correct
        word.mistakes = mistakes
        word.last_practiced = timezone.now()
        word.save()
