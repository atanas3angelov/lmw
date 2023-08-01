import random

from django.utils import timezone

from dictionary.models import Word
from practice.util import get_words_for_practice


class MultiChoiceConnect:

    def __init__(self, context):
        self.context = context

    def ask(self):
        # TODO figure out whether words and related translations can be collected with 1 query
        # tried prefetch_related(), select_related(), Manager.raw(), and even tried pure SQL (but can't use LIMIT on 1):
        # SELECT w.word_text, w2.word_text
        # FROM word w
        # JOIN translation tr ON tr.source_word_id = w.id
        # JOIN word w2 ON tr.target_word_id = w2.id
        # WHERE w.id IN
        #     (SELECT source_word_id
        #     FROM translation)

        # TODO related words must conform to section 'What words to include in practice' (get_words_for_practice)
        # self.words = Word.objects.raw("SELECT * FROM word WHERE language=%s LIMIT 4", [self.context['lang']])

        self.words = get_words_for_practice(self.context['lang'], 4,
                                            None,
                                            self.context['frequently_mistaken_words'],
                                            self.context['infrequently_practiced_words']
                                            )

        self.context['words'] = self.words

        self.words_ids = [w.id for w in self.words]  # to be saved in session

        # TODO shuffle answers + add word.id so that the pair can be identified
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

    def update(self, word_id, correct, mistakes):
        word = Word.objects.get(pk=word_id)
        word.correct = correct
        word.mistakes = mistakes
        word.last_practiced = timezone.now()
        word.save()
