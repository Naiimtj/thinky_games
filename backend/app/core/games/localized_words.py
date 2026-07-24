"""Locale-aware word pools and category sets for word games.

The module keeps hand-curated, frequency-tuned fallback pools for the languages
we support (Spanish, English, German). When ``DICTIONARY_SERVICE_URL`` is
configured, the backend fetches a curated pool from the external dictionary
service instead. Each pool entry carries an answer and a simple clue/definition
so word games can work fully offline and without external API keys, while still
producing content adapted to the player's language.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config.env import get_settings
from app.core.dictionary_client import common_words as service_common_words
from app.core.games.wiktionary import fetch_definition


SUPPORTED_LOCALES = ("es", "en", "de")
LOCALIZED_GAME_IDS = frozenset({"pinpoint", "crossword", "wend"})


@dataclass(frozen=True)
class WordEntry:
    answer: str
    clue: str


SPANISH_COMMON_WORDS: list[WordEntry] = [
    WordEntry("CASA", "Lugar donde vives"),
    WordEntry("MESA", "Mueble con patas para comer"),
    WordEntry("CAMA", "Mueble para dormir"),
    WordEntry("PERRO", "Animal doméstico que ladra"),
    WordEntry("GATO", "Felino doméstico"),
    WordEntry("HOJA", "Lámina verde de las plantas"),
    WordEntry("UVA", "Fruto pequeño que crece en racimo"),
    WordEntry("MANZANA", "Fruta roja o verde, muy común"),
    WordEntry("LUNA", "Satélite natural de la Tierra"),
    WordEntry("SOL", "Estrella que ilumina el día"),
    WordEntry("AGUA", "Líquido esencial para la vida"),
    WordEntry("FUEGO", "Combustión que produce calor y luz"),
    WordEntry("LIBRO", "Conjunto de hojas escritas"),
    WordEntry("ESCUELA", "Lugar donde se enseña"),
    WordEntry("BOSQUE", "Sitio poblado de árboles"),
    WordEntry("SALTAR", "Levantarse del suelo de golpe"),
]

ENGLISH_COMMON_WORDS: list[WordEntry] = [
    WordEntry("HOUSE", "Place where you live"),
    WordEntry("TABLE", "Furniture with legs for eating"),
    WordEntry("BED", "Furniture for sleeping"),
    WordEntry("DOG", "Domestic animal that barks"),
    WordEntry("CAT", "Domestic feline"),
    WordEntry("LEAF", "Green flat part of a plant"),
    WordEntry("GRAPE", "Small fruit that grows in a bunch"),
    WordEntry("APPLE", "Common red or green fruit"),
    WordEntry("MOON", "Earth's natural satellite"),
    WordEntry("SUN", "Star that lights up the day"),
    WordEntry("WATER", "Essential liquid for life"),
    WordEntry("FIRE", "Combustion producing heat and light"),
    WordEntry("BOOK", "Set of written pages"),
    WordEntry("SCHOOL", "Place where people are taught"),
    WordEntry("FOREST", "Area covered with trees"),
    WordEntry("JUMP", "Push yourself off the ground"),
]

GERMAN_COMMON_WORDS: list[WordEntry] = [
    WordEntry("HAUS", "Ort, an dem man wohnt"),
    WordEntry("TISCH", "Möbel mit Beinen zum Essen"),
    WordEntry("BETT", "Möbel zum Schlafen"),
    WordEntry("HUND", "Haustier, das bellt"),
    WordEntry("KATZE", "Hauskatze"),
    WordEntry("BLATT", "Grüne flache Pflanzenteil"),
    WordEntry("TRAUBE", "Kleine Frucht, die in einer Traube wächst"),
    WordEntry("APFEL", "Häufige rote oder grüne Frucht"),
    WordEntry("MOND", "Natürlicher Satellit der Erde"),
    WordEntry("SONNE", "Stern, der den Tag erhellt"),
    WordEntry("WASSER", "Essentiale Flüssigkeit für das Leben"),
    WordEntry("FEUER", "Verbrennung, die Wärme und Licht erzeugt"),
    WordEntry("BUCH", "Geordnete geschriebene Seiten"),
    WordEntry("SCHULE", "Ort, an dem unterrichtet wird"),
    WordEntry("WALD", "Mit Bäumen bewachsener Bereich"),
    WordEntry("SPRINGEN", "Sich vom Boden abstoßen"),
]

COMMON_WORDS_BY_LANG: dict[str, list[WordEntry]] = {
    "es": SPANISH_COMMON_WORDS,
    "en": ENGLISH_COMMON_WORDS,
    "de": GERMAN_COMMON_WORDS,
}


def normalize_locale(locale: str | None) -> str:
    """Return a supported locale, defaulting unknown values to Spanish."""
    return locale if locale in SUPPORTED_LOCALES else "es"


def puzzle_locale(game_id: str, locale: str | None) -> str:
    """Return the locale that changes a puzzle's contents for a game."""
    return normalize_locale(locale) if game_id in LOCALIZED_GAME_IDS else "es"


def puzzle_locales(game_id: str) -> tuple[str, ...]:
    """Return every persisted puzzle locale required for a game."""
    return SUPPORTED_LOCALES if game_id in LOCALIZED_GAME_IDS else ("es",)

PINPOINT_CATEGORIES: dict[str, list[dict]] = {
    "es": [
        {"name": "Frutas", "members": ["Manzana", "Plátano", "Naranja", "Uva", "Fresa", "Pera", "Sandía", "Melón"]},
        {"name": "Verduras", "members": ["Zanahoria", "Lechuga", "Tomate", "Cebolla", "Pepino", "Espinaca", "Brócoli"]},
        {"name": "Colores", "members": ["Rojo", "Azul", "Verde", "Amarillo", "Morado", "Marrón", "Negro", "Blanco"]},
        {"name": "Animales", "members": ["Perro", "Gato", "Caballo", "León", "Tigre", "Elefante", "Conejo", "Lobo"]},
        {"name": "Bebidas", "members": ["Café", "Té", "Zumo", "Leche", "Refresco", "Cerveza", "Vino"]},
        {"name": "Días de la semana", "members": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]},
        {"name": "Meses", "members": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto"]},
        {"name": "Instrumentos musicales", "members": ["Guitarra", "Piano", "Violín", "Batería", "Flauta", "Trompeta", "Arpa"]},
        {"name": "Profesiones", "members": ["Médico", "Abogado", "Ingeniero", "Profesor", "Bombero", "Enfermero", "Cocinero"]},
        {"name": "Transportes", "members": ["Coche", "Tren", "Avión", "Barco", "Bicicleta", "Autobús", "Moto"]},
    ],
    "en": [
        {"name": "Fruits", "members": ["Apple", "Banana", "Orange", "Grape", "Strawberry", "Pear", "Watermelon", "Melon"]},
        {"name": "Vegetables", "members": ["Carrot", "Lettuce", "Tomato", "Onion", "Cucumber", "Spinach", "Broccoli"]},
        {"name": "Colors", "members": ["Red", "Blue", "Green", "Yellow", "Purple", "Brown", "Black", "White"]},
        {"name": "Animals", "members": ["Dog", "Cat", "Horse", "Lion", "Tiger", "Elephant", "Rabbit", "Wolf"]},
        {"name": "Drinks", "members": ["Coffee", "Tea", "Juice", "Milk", "Soda", "Beer", "Wine"]},
        {"name": "Days of the week", "members": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]},
        {"name": "Months", "members": ["January", "February", "March", "April", "May", "June", "July", "August"]},
        {"name": "Musical instruments", "members": ["Guitar", "Piano", "Violin", "Drums", "Flute", "Trumpet", "Harp"]},
        {"name": "Professions", "members": ["Doctor", "Lawyer", "Engineer", "Teacher", "Firefighter", "Nurse", "Chef"]},
        {"name": "Transport", "members": ["Car", "Train", "Plane", "Ship", "Bicycle", "Bus", "Motorcycle"]},
    ],
    "de": [
        {"name": "Obst", "members": ["Apfel", "Banane", "Orange", "Traube", "Erdbeere", "Birne", "Wassermelone", "Melone"]},
        {"name": "Gemüse", "members": ["Karotte", "Salat", "Tomate", "Zwiebel", "Gurke", "Spinat", "Brokkoli"]},
        {"name": "Farben", "members": ["Rot", "Blau", "Grün", "Gelb", "Lila", "Braun", "Schwarz", "Weiß"]},
        {"name": "Tiere", "members": ["Hund", "Katze", "Pferd", "Löwe", "Tiger", "Elefant", "Kaninchen", "Wolf"]},
        {"name": "Getränke", "members": ["Kaffee", "Tee", "Saft", "Milch", "Limonade", "Bier", "Wein"]},
        {"name": "Wochentage", "members": ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]},
        {"name": "Monate", "members": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August"]},
        {"name": "Musikinstrumente", "members": ["Gitarre", "Klavier", "Geige", "Schlagzeug", "Flöte", "Trompete", "Harfe"]},
        {"name": "Berufe", "members": ["Arzt", "Anwalt", "Ingenieur", "Lehrer", "Feuerwehrmann", "Krankenpfleger", "Koch"]},
        {"name": "Verkehrsmittel", "members": ["Auto", "Zug", "Flugzeug", "Schiff", "Fahrrad", "Bus", "Motorrad"]},
    ],
}


def common_words(lang: str = "es") -> list[WordEntry]:
    """Return the curated common-word pool for ``lang``.

    Prefer the external dictionary service when configured; fall back to the
    bundled hand-curated lists otherwise.
    """
    if get_settings().dictionary_service_url:
        service_words = service_common_words(lang)
        if service_words:
            return service_words
    return list(COMMON_WORDS_BY_LANG[normalize_locale(lang)])


def pinpoint_categories(lang: str = "es") -> list[dict]:
    """Return Pinpoint category sets for ``lang``."""
    return PINPOINT_CATEGORIES[normalize_locale(lang)]


def enrich_with_wiktionary(entry: WordEntry, lang: str) -> WordEntry:
    """Try to replace the simple clue with a Wiktionary definition."""
    definitions = fetch_definition(entry.answer.lower(), lang)
    if definitions:
        return WordEntry(entry.answer, definitions[0])
    return entry
