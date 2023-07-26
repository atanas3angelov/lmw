class InsufficientWordsError(Exception):
    """
    Exception type to be raised when a (ORM) query cannot gather enough words to practice according to specifications
    """
    def __init__(self, message):
        super().__init__(message)
