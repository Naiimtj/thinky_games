"""Server-side puzzle generation, solving and validation.

Game logic that used to live in the frontend now runs here so puzzles are
generated once on the backend, stored, and served to every client. See
``registry.py`` for the catalogue of available games.
"""
