class ConnectionWithNameAlreadyExists(Exception):
    """
    Raised when a user tries to store a new connection with the widget, but
    there's already a connection with such name in the connections file
    """

    def __init__(self, name):
        self.name = name
        self.message = f"Connection with name {name} already exists"
        super().__init__(self.message)
