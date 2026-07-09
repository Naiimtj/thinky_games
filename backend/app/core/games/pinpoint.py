"""Pinpoint: guess-the-category trivia (ported from the frontend).

Picks a daily category and five of its members as clues, then builds the options
from the answer plus four distinct distractor categories. Deterministic from a
seed. The answer is part of the payload because the board reveals clues on wrong
guesses client-side; the submitted answer is still validated server-side.
"""

from __future__ import annotations

from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.prng import mulberry32, rand_int, shuffle_in_place

CLUE_COUNT = 5
OPTION_COUNT = 5
DEMO_SEED = 1

# Curated Spanish categories. Members are kept unambiguous across categories so
# clues never fit more than one option.
PINPOINT_CATEGORIES: list[dict] = [
    {"name": "Frutas", "members": ["Manzana", "Plátano", "Naranja", "Uva", "Fresa", "Pera", "Sandía", "Melón"]},
    {"name": "Verduras", "members": ["Zanahoria", "Lechuga", "Tomate", "Cebolla", "Pepino", "Espinaca", "Brócoli"]},
    {"name": "Colores", "members": ["Rojo", "Azul", "Verde", "Amarillo", "Morado", "Marrón", "Negro", "Blanco"]},
    {"name": "Animales", "members": ["Perro", "Gato", "Caballo", "León", "Tigre", "Elefante", "Conejo", "Lobo"]},
    {"name": "Países", "members": ["España", "Francia", "Italia", "Alemania", "Portugal", "México", "Argentina", "Brasil"]},
    {"name": "Capitales europeas", "members": ["París", "Madrid", "Roma", "Berlín", "Lisboa", "Viena", "Atenas"]},
    {"name": "Deportes", "members": ["Fútbol", "Baloncesto", "Tenis", "Natación", "Ciclismo", "Boxeo", "Golf"]},
    {"name": "Instrumentos musicales", "members": ["Guitarra", "Piano", "Violín", "Batería", "Flauta", "Trompeta", "Arpa"]},
    {"name": "Profesiones", "members": ["Médico", "Abogado", "Ingeniero", "Profesor", "Bombero", "Enfermero", "Cocinero"]},
    {"name": "Planetas", "members": ["Mercurio", "Venus", "Tierra", "Marte", "Júpiter", "Saturno", "Urano", "Neptuno"]},
    {"name": "Días de la semana", "members": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]},
    {"name": "Meses", "members": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto"]},
    {"name": "Metales", "members": ["Oro", "Plata", "Hierro", "Cobre", "Zinc", "Plomo", "Níquel", "Aluminio"]},
    {"name": "Flores", "members": ["Rosa", "Tulipán", "Girasol", "Margarita", "Clavel", "Orquídea", "Lirio"]},
    {"name": "Árboles", "members": ["Roble", "Pino", "Olivo", "Abedul", "Sauce", "Ciprés", "Álamo"]},
    {"name": "Bebidas", "members": ["Café", "Té", "Zumo", "Leche", "Refresco", "Cerveza", "Vino"]},
    {"name": "Ríos", "members": ["Amazonas", "Nilo", "Ebro", "Danubio", "Tajo", "Duero", "Guadalquivir"]},
    {"name": "Idiomas", "members": ["Español", "Inglés", "Francés", "Alemán", "Chino", "Japonés", "Ruso"]},
    {"name": "Emociones", "members": ["Alegría", "Tristeza", "Miedo", "Ira", "Sorpresa", "Asco", "Amor"]},
    {"name": "Formas geométricas", "members": ["Círculo", "Cuadrado", "Triángulo", "Rectángulo", "Rombo", "Óvalo", "Pentágono"]},
    {"name": "Transportes", "members": ["Coche", "Tren", "Avión", "Barco", "Bicicleta", "Autobús", "Moto"]},
    {"name": "Ropa", "members": ["Camisa", "Pantalón", "Falda", "Vestido", "Abrigo", "Jersey", "Sombrero"]},
    {"name": "Herramientas", "members": ["Martillo", "Destornillador", "Sierra", "Taladro", "Llave", "Alicates"]},
    {"name": "Cuerpo humano", "members": ["Cabeza", "Brazo", "Pierna", "Mano", "Pie", "Ojo", "Nariz", "Boca"]},
]


def _generate_puzzle(seed: int) -> Payload:
    rng = mulberry32(seed)
    category = PINPOINT_CATEGORIES[rand_int(rng, len(PINPOINT_CATEGORIES))]

    clues = shuffle_in_place(list(category["members"]), rng)[:CLUE_COUNT]
    distractors = shuffle_in_place(
        [c["name"] for c in PINPOINT_CATEGORIES if c is not category], rng
    )[: OPTION_COUNT - 1]
    options = shuffle_in_place([category["name"], *distractors], rng)

    return {"clues": clues, "answer": category["name"], "options": options}


def validate(payload: Payload, solution: object) -> bool:
    """Whether the submitted category name matches the answer."""
    return isinstance(solution, str) and solution == payload["answer"]


def solve(payload: Payload) -> str:
    """Return the correct category name."""
    return payload["answer"]


def generate(seed: int) -> GeneratedPuzzle:
    """Deterministically generate a Pinpoint puzzle for ``seed``."""
    payload = _generate_puzzle(seed)
    return GeneratedPuzzle(payload=payload, solution=payload["answer"])
