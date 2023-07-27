import random

from django.forms import model_to_dict
from django.db.models import F

from dictionary.models import Word
from .exceptions.InsufficientWordsError import InsufficientWordsError


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


# TODO if only listening exercises are selected, filter words only for listening (else user sad :( )
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
        # if no other criteria is given, then the order should be based on last_practiced ascending
        # so that the backend can return different word to practice
        # (biased on last_practiced, if not explicitly selected in order to avoid SQL heavy randomizing)
        words = words.order_by('last_practiced')

        # # order('?') can be slow -- figure out faster solution for not contiguous ids
        # words = words.order_by('?')

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


def serialize_words(words, include_translations=True):

    words_json = []
    for word in words:
        w = model_to_dict(word, fields=[field.name for field in word._meta.fields])  # no translations

        if include_translations:
            # add translations
            trs = []
            for translation in word.translations.all():
                trs.append(model_to_dict(translation, fields=[field.name for field in word._meta.fields]))
            w['translations'] = trs

        words_json.append(w)

    return words_json
