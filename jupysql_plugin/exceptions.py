class ConnectionWithNameAlreadyExists(Exception):
    """
    Raised when a user tries to store a new connection with the widget, but
    there's already a connection with such name in the connections file
    """

    def __init__(self, name):
        self.name = name
        self.message = (
            f"A connection named {name!r} already exists in your connections file"
        )
        super().__init__(self.message)
