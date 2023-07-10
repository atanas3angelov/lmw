from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class Language(models.Model):

    class Meta:
        db_table = 'language'

    name = models.CharField(max_length=30)


class Word(models.Model):

    class Meta:
        db_table = 'word'

    class WordType(models.TextChoices):
        NOUN = 'n', _('noun')
        VERB = 'v', _('verb')
        ADJECTIVE = 'adj', _('adjective')
        ADVERB = 'adv', _('adverb')
        CONJUNCTION = 'con', _('conjunction')
        OTHER = 'other', _('other')

    class GenderType(models.TextChoices):
        MALE = 'm', _('male')
        FEMALE = 'f', _('female')
        NEUTRAL = 'n', _('neutral')
        NONE = 'na', _('none')

    word_text = models.CharField(max_length=200)
    word_type = models.CharField(max_length=20, choices=WordType.choices, default=WordType.OTHER)
    language = models.CharField(max_length=30, default='English')
    gender = models.CharField(max_length=2, default=GenderType.NONE)
    date_added = models.DateTimeField()
    translations = models.ManyToManyField('self', through="translation", symmetrical=False)
    pronunciation = models.CharField(max_length=300, default='')
    last_practiced = models.DateTimeField(default=timezone.now)
    mistakes = models.IntegerField(default=0)
    correct = models.IntegerField(default=0)


class Translation(models.Model):

    class Meta:
        db_table = 'translation'

    source_word = models.ForeignKey(Word, on_delete=models.CASCADE, related_name='source_word')
    target_word = models.ForeignKey(Word, on_delete=models.CASCADE, related_name='target_word')
    date_added = models.DateTimeField()
