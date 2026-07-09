"""Curated pool of common Spanish words for Wend (medium-high everyday usage).

Only a handful of words are hidden per puzzle, so a smaller hand-picked pool of
familiar words works better than the huge scrabble-style list: entries are
accent-free and ``ñ``-free (so they sit cleanly on the grid and among the random
filler letters) and reliably resolve to a RAE definition for the clue hint.
Lengths span 3-9 on purpose — puzzle length variety is a feature, not a bug.
"""

from __future__ import annotations

COMMON_WORDS_BY_LENGTH: dict[int, tuple[str, ...]] = {
    3: (
        "sol", "mar", "pan", "luz", "paz", "rey", "ley", "voz", "pie", "ojo",
        "red", "fin", "ala", "oso", "uva", "ave", "gas", "pez", "col", "ola",
        "oro", "sal", "mes", "tos", "sed",
    ),
    4: (
        "casa", "mesa", "gato", "pato", "rana", "sopa", "ropa", "rosa", "vino",
        "pera", "mano", "dedo", "boca", "cara", "pelo", "hoja", "nube", "luna",
        "lobo", "lago", "faro", "nido", "cama", "mono", "foca", "taza", "vaso",
        "jugo", "miel", "rama", "tren", "moto", "bota",
    ),
    5: (
        "perro", "silla", "libro", "campo", "plato", "queso", "leche", "fruta",
        "arroz", "huevo", "pollo", "cerdo", "tigre", "playa", "nieve", "fuego",
        "cielo", "verde", "negro", "feliz", "jugar", "comer", "beber", "nariz",
        "plaza", "radio", "disco", "globo", "barco", "gorra", "mango", "reloj",
        "papel",
    ),
    6: (
        "camisa", "zapato", "conejo", "pelota", "camino", "ciudad", "bosque",
        "puerta", "cocina", "escoba", "cuadro", "espejo", "nevera", "tomate",
        "cereza", "pepino", "sombra", "madera", "piedra", "cabeza", "hombro",
        "guante", "pintor", "doctor", "comida", "bebida", "harina", "huerto",
        "granja", "correr", "saltar", "bailar", "cantar",
    ),
    7: (
        "caballo", "ventana", "naranja", "botella", "pescado", "cuchara",
        "tenedor", "girasol", "hormiga", "ballena", "gaviota", "palacio",
        "iglesia", "escuela", "bombero", "cartero", "pintura", "ardilla",
        "cepillo", "tortuga", "gallina", "cordero", "ternero", "mercado",
        "lechuga", "cebolla", "galleta",
    ),
    8: (
        "elefante", "mariposa", "cangrejo", "castillo", "hospital", "calabaza",
        "pimiento", "estrella", "guitarra", "trompeta", "caramelo", "bombilla",
        "cazadora", "pescador", "panadero", "zapatero", "refresco",
    ),
    9: (
        "cocodrilo", "zanahoria", "bicicleta", "serpiente", "chocolate",
        "mandarina", "bocadillo", "enfermera", "pastelero", "submarino",
        "furgoneta", "carretera", "ordenador",
    ),
}


def common_words() -> list[str]:
    """Flat list of every curated word, uppercased for the grid."""
    return [
        word.upper()
        for words in COMMON_WORDS_BY_LENGTH.values()
        for word in words
    ]
