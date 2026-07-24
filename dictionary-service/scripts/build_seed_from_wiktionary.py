#!/usr/bin/env python3
"""Build dictionary-service seed JSON from a Spanish Wiktionary dump.

Workflow:
    1. Download the latest eswiktionary dump (run once):
       uv run python scripts/build_seed_from_wiktionary.py download

    2. Build seed batches from the dump:
       uv run python scripts/build_seed_from_wiktionary.py build

    3. Import one batch into the running dictionary service:
       uv run python scripts/build_seed_from_wiktionary.py import data/seed_es_batch_000.json

The script writes batches of 100 entries so you can review and import gradually.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from wiktionary_client import WIKTIONARY_DUMPS, download_dump, parse_dump

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "data"
BATCH_SIZE = 100
DEFAULT_LANGUAGE = "es"

_DUMP_PATHS: dict[str, Path] = {
    "es": DATA_DIR / "eswiktionary-latest-pages-articles.xml.bz2",
    "en": DATA_DIR / "enwiktionary-latest-pages-articles.xml.bz2",
    "de": DATA_DIR / "dewiktionary-latest-pages-articles.xml.bz2",
}

# Length limits aligned with the dictionary-service schema.
MIN_LENGTH = 3
MAX_LENGTH = 12

# Words that are never suitable for family games.
_BLACKLIST: set[str] = {
    "gilipollas", "cabron", "cabrona", "cabrón", "cabróna", "coño", "carajo",
    "mierda", "joder", "puta", "puto", "maricón", "maricon", "tonto", "tonta",
    "imbecil", "imbécil", "idiota", "estupido", "estúpido", "estupida", "estúpida",
    "mema", "memo", "abibollo", "patán", "patan", "maleducado", "maleducada", "malnacido", "malnacida", "malparido", "malparida",
    "zorra", "zorro", "perra", "perro", "puta", "puto", "polla", "pene", "vagina", "esclavo", "esclava", 
}

# Patterns that indicate the entry is a toponym, gentilic, or otherwise unsuitable.
_UNWANTED_DEFINITION_PREFIXES = (
    "ciudad de ",
    "pueblo de ",
    "comarca de ",
    "provincia de ",
    "región de ",
    "país de ",
    "nación de ",
    "isla de ",
    "río de ",
    "monte de ",
    "cordillera de ",
    "desierto de ",
    "persona originaria",
    "persona nacida",
    "originario de ",
    "originaria de ",
    "natural de ",
    "habitante de ",
    "gentilicio",
)

# Markers that the word is archaic, jargon or very rare.
_UNWANTED_MARKERS = (
    "arcaísmo", "arcaismo", "en desuso", "desusado", "poco usado", "poco frecuente",
    "jerga", "argot", "coloquial despectivo", "coloquialismo", "vulgar",
    "término médico", "término técnico", "término científico",
)

# Common first names, brands and acronyms to skip.
_NAME_LIKE_PREFIXES = (
    "jesús", "maría", "josé", "juan", "pedro", "pablo", "manuel", "antonio",
    "francisco", "luis", "carlos", "miguel", "rafael", "fernando", "alberto",
    "adidas", "nike", "coca", "pepsi", "sony", "apple", "google", "microsoft",
)

_CATEGORIES: dict[str, list[str]] = {
    "animales": [
        "animal", "mamífero", "ave", "pájaro", "pez", "peces", "reptil", "anfibio",
        "insecto", "arácnido", "gusano", "crustáceo", "molusco", "perro", "gato",
        "caballo", "vaca", "toro", "león", "tigre", "elefante", "oso", "lobo",
        "zorro", "conejo", "ratón", "rata", "tiburón", "ballena", "delfín", "mono",
        "jirafa", "cebra", "rinoceronte", "hipopótamo", "cocodrilo", "serpiente",
        "águila", "halcón", "cuervo", "paloma", "gallina", "pato", "ganso", "pavo",
        "loro", "canario", "abeja", "avispa", "mariposa", "mosca", "mosquito",
    ],
    "naturaleza": [
        "naturaleza", "montaña", "monte", "sierra", "valle", "río", "laguna", "lago",
        "mar", "océano", "playa", "costa", "orilla", "acantilado", "cueva", "bosque",
        "selva", "jungla", "árbol", "flor", "planta", "hierba", "semilla", "fruto",
        "roca", "piedra", "tierra", "suelo", "arena", "barro", "arcilla", "cielo",
        "nube", "lluvia", "nieve", "hielo", "viento", "tormenta", "rayo", "trueno",
        "arco iris", "estrella", "planeta", "luna", "sol", "fuego", "agua", "aire",
    ],
    "geografia": [
        "geografía", "país", "nación", "estado", "provincia", "región", "ciudad",
        "pueblo", "aldea", "capital", "continente", "mapa", "frontera", "cordillera",
        "volcán", "isla", "península", "golfo", "bahía", "estrecho", "canal", "desierto",
        "pradera", "llanura", "meseta", "glaciar", "polo", "trópico", "ecuador",
        "paralelo", "meridiano",
    ],
    "comida": [
        "comida", "alimento", "bebida", "plato", "fruta", "verdura", "hortaliza",
        "legumbre", "carne", "pescado", "marisco", "pan", "pastel", "tarta", "helado",
        "dulce", "postre", "azúcar", "sal", "pimienta", "aceite", "vinagre", "leche",
        "queso", "yogur", "mantequilla", "huevo", "arroz", "pasta", "sopa", "ensalada",
        "sándwich", "bocadillo", "tapa", "café", "té", "zumo", "vino", "cerveza",
        "miel", "frutos secos", "galleta", "chocolate", "caramelo", "nuez", "almendra",
    ],
    "objetos": [
        "objeto", "cosa", "artículo", "herramienta", "instrumento", "utensilio",
        "aparato", "dispositivo", "máquina", "mecanismo", "juguete", "pelota", "rueda",
        "cuerda", "cadena", "clavo", "tornillo", "alambre", "caja", "bolsa", "botella",
        "vaso", "plato", "cuchara", "tenedor", "cuchillo", "olla", "sartén", "lámpara",
        "vela", "espejo", "cuadro", "reloj", "moneda", "billete", "llave", "paraguas",
        "bolígrafo", "lápiz", "papel", "libro", "cuaderno", "mochila", "cesta", "jarra",
    ],
    "casa": [
        "casa", "hogar", "vivienda", "habitación", "sala", "salón", "cocina", "baño",
        "dormitorio", "despacho", "jardín", "patio", "balcón", "terraza", "techo",
        "pared", "suelo", "puerta", "ventana", "escalera", "chimenea", "garaje",
        "sótano", "ático", "mueble", "mesa", "silla", "sofá", "sillón", "cama",
        "armario", "estantería", "cortina", "alfombra", "nevera", "lavadora", "horno",
        "microondas", "fregadero", "bañera", "ducha", "inodoro", "cocina",
    ],
    "cuerpo": [
        "cuerpo", "cabeza", "cara", "ojo", "oído", "nariz", "boca", "labio", "diente",
        "cuello", "hombro", "brazo", "codo", "muñeca", "mano", "dedo", "uña",
        "pecho", "espalda", "cintura", "vientre", "barriga", "cadera", "pierna",
        "rodilla", "tobillo", "pie", "talón", "corazón", "pulmón", "hígado", "riñón",
        "estómago", "cerebro", "mente", "sangre", "hueso", "músculo", "piel", "pelo",
    ],
    "emociones": [
        "emoción", "sentimiento", "alegría", "felicidad", "tristeza", "miedo", "temor",
        "angustia", "ansiedad", "estrés", "calma", "paz", "tranquilidad", "serenidad",
        "euforia", "entusiasmo", "motivación", "aburrimiento", "cansancio", "sorpresa",
        "asombro", "admiración", "amor", "cariño", "afecto", "ternura", "compasión",
        "empatía", "gratitud", "orgullo", "vergüenza", "culpa", "envidia", "celos",
        "rabia", "ira", "furia", "enfado", "frustración", "decepción",
    ],
    "profesiones": [
        "profesión", "oficio", "trabajo", "empleo", "cargo", "puesto", "médico",
        "doctor", "enfermero", "cirujano", "dentista", "veterinario", "farmacéutico",
        "abogado", "juez", "policía", "detective", "bombero", "militar", "soldado",
        "profesor", "maestro", "ingeniero", "arquitecto", "obrero", "albañil",
        "carpintero", "electricista", "fontanero", "mecánico", "cocinero", "chef",
        "camarero", "panadero", "carnicero", "pescadero", "agricultor", "ganadero",
        "jardinero", "peluquero", "estilista", "diseñador", "artista", "pintor",
        "escultor", "músico", "cantante", "actor", "escritor", "periodista",
        "fotógrafo", "científico", "investigador", "programador", "administrativo",
        "comerciante", "vendedor", "dependiente", "taxista", "conductor", "piloto",
        "azafata", "político", "persona que",
    ],
    "transporte": [
        "transporte", "vehículo", "coche", "automóvil", "moto", "motocicleta",
        "bicicleta", "bici", "camión", "autobús", "autocar", "tren", "tranvía",
        "metro", "avión", "helicóptero", "barco", "buque", "barca", "lancha", "velero",
        "yate", "submarino", "nave", "cohete", "tractor", "carreta", "carro",
        "carretilla", "rueda", "neumático", "motor", "gasolina", "diésel",
    ],
    "ciencia": [
        "ciencia", "física", "química", "biología", "geología", "astronomía",
        "botánica", "zoología", "ecología", "genética", "anatomía", "fisiología",
        "medicina", "matemáticas", "aritmética", "álgebra", "geometría", "cálculo",
        "estadística", "informática", "programación", "ingeniería", "electricidad",
        "electrónica", "mecánica", "termodinámica", "óptica", "acústica", "átomo",
        "molécula", "célula", "organismo", "energía", "materia", "fuerza", "gravedad",
        "velocidad", "aceleración", "masa", "volumen", "densidad", "temperatura",
        "presión", "experimento", "laboratorio", "microscopio", "telescopio",
    ],
    "arte": [
        "arte", "pintura", "dibujo", "escultura", "cerámica", "fotografía", "cine",
        "teatro", "danza", "ballet", "ópera", "literatura", "poesía", "novela",
        "cuento", "drama", "comedia", "tragedia", "pintor", "escultor", "artista",
        "museo", "galería", "exposición", "obra", "lienzo", "óleo", "acuarela",
        "pastel", "tiza", "carboncillo", "pincel", "paleta", "caballete", "taller",
        "escenario", "vestuario", "decorado",
    ],
    "musica": [
        "música", "canción", "melodía", "ritmo", "armonía", "compás", "nota",
        "acorde", "escala", "sinfonía", "concierto", "ópera", "zarzuela", "ballet",
        "instrumento", "guitarra", "piano", "violín", "viola", "violonchelo",
        "contrabajo", "arpa", "flauta", "clarinete", "oboe", "fagot", "saxofón",
        "trompeta", "trombón", "tuba", "corno", "batería", "percusión", "xilófono",
        "triángulo", "platillos", "director", "orquesta", "banda", "coro", "cantante",
        "voz",
    ],
    "deporte": [
        "deporte", "juego", "ejercicio", "competición", "competencia", "partido",
        "encuentro", "carrera", "marcha", "salto", "lanzamiento", "natación",
        "atletismo", "fútbol", "baloncesto", "balonmano", "voleibol", "tenis",
        "pádel", "squash", "golf", "rugby", "hockey", "cricket", "béisbol",
        "ciclismo", "boxeo", "judo", "karate", "taekwondo", "lucha", "gimnasia",
        "esquí", "snowboard", "surf", "windsurf", "vela", "remo", "piragüismo",
        "equitación", "montañismo", "escalada", "medalla", "trofeo", "campeonato",
        "liga", "copa", "entrenador", "jugador", "árbitro", "portero", "portería",
        "red", "raqueta", "pelota", "balón", "disco", "jabalina", "pesas", "piscina",
        "pista", "campo", "estadio", "gimnasio",
    ],
    "tiempo": [
        "tiempo", "momento", "instante", "segundo", "minuto", "hora", "día", "noche",
        "mañana", "tarde", "mediodía", "medianoche", "amanecer", "atardecer",
        "anochecer", "crepúsculo", "alba", "ocaso", "semana", "mes", "año", "década",
        "siglo", "milenio", "época", "era", "edad", "período", "temporada", "estación",
        "primavera", "verano", "otoño", "invierno", "pasado", "presente", "futuro",
        "ayer", "hoy", "antaño", "cronología", "calendario", "reloj", "horario",
        "fecha", "plazo", "duración", "eternidad", "brevedad", "lentitud", "rapidez",
        "prisa", "demora", "retraso", "puntualidad",
    ],
    "escuela": [
        "escuela", "colegio", "instituto", "universidad", "academia", "aula", "clase",
        "curso", "asignatura", "materia", "lección", "tarea", "deberes", "examen",
        "prueba", "evaluación", "calificación", "nota", "matrícula", "alumno",
        "estudiante", "profesor", "maestro", "director", "rector", "bedel", "conserje",
        "biblioteca", "laboratorio", "gimnasio", "patio", "recreo", "mochila", "libro",
        "cuaderno", "lápiz", "bolígrafo", "goma", "sacapuntas", "regla", "compás",
        "transportador", "pizarra", "tiza", "rotulador", "ordenador", "proyector",
        "pantalla",
    ],
    "tecnologia": [
        "tecnología", "informática", "ordenador", "computadora", "portátil", "tablet",
        "teléfono", "móvil", "smartphone", "pantalla", "monitor", "teclado", "ratón",
        "impresora", "escáner", "cámara", "altavoz", "auriculares", "micrófono",
        "router", "módem", "red", "internet", "wifi", "bluetooth", "cable", "enchufe",
        "batería", "cargador", "software", "hardware", "programa", "aplicación", "app",
        "sistema operativo", "navegador", "página web", "sitio web", "correo electrónico",
        "mensaje", "chat", "red social", "base de datos", "servidor", "nube",
        "inteligencia artificial", "algoritmo", "código", "programación", "robot",
        "dron", "electrónica", "circuito", "chip", "procesador", "memoria", "disco duro",
        "ssd", "usb", "pantalla táctil", "realidad virtual", "realidad aumentada",
    ],
    "sociedad": [
        "sociedad", "comunidad", "pueblo", "ciudadanía", "población", "gente",
        "personas", "ser humano", "individuo", "persona", "hombre", "mujer", "niño",
        "niña", "bebé", "familia", "padre", "madre", "hijo", "hija", "hermano",
        "hermana", "abuelo", "abuela", "nieto", "nieta", "tío", "tía", "primo",
        "prima", "sobrino", "sobrina", "amigo", "amiga", "vecino", "vecina",
        "compañero", "compañera", "novio", "novia", "esposo", "esposa", "matrimonio",
        "boda", "nacimiento", "muerte", "vida", "salud", "enfermedad", "educación",
        "cultura", "religión", "fe", "iglesia", "templo", "mezquita", "sinagoga",
        "gobierno", "estado", "ley", "derecho", "justicia", "policía", "ejército",
        "economía", "dinero", "trabajo", "desempleo", "pobreza", "riqueza", "política",
        "partido", "elección", "voto", "democracia", "guerra", "paz", "conflicto",
        "acuerdo", "tratado", "frontera", "inmigración", "emigración", "idioma",
        "lengua", "costumbre", "tradición", "fiesta", "celebración", "ceremonia",
        "ritual", "ocio", "entretenimiento", "comunicación", "prensa", "radio",
        "televisión", "periodismo", "acto", "hecho", "suceso", "acontecimiento",
    ],
    "colores": [
        "color", "rojo", "verde", "azul", "amarillo", "naranja", "morado", "violeta",
        "rosa", "fucsia", "magenta", "cian", "turquesa", "marrón", "café", "beige",
        "crema", "blanco", "negro", "gris", "plateado", "dorado", "brillante",
        "oscuro", "claro", "pastel", "mate", "metalizado", "transparente", "opaco",
        "pigmento", "tinta", "pintura", "colorante", "matiz", "tonalidad", "sombra",
    ],
    "plantas": [
        "planta", "árbol", "arbusto", "hierba", "matorral", "flor", "tallo", "hoja",
        "raíz", "semilla", "fruto", "esqueje", "bulbo", "tubérculo", "corteza", "savia",
        "clorofila", "fotosíntesis", "jardín", "huerto", "invernadero", "sembrado",
        "cosecha", "trigo", "arroz", "maíz", "cebada", "avena", "centeno", "judía",
        "guisante", "lenteja", "garbanzo", "patata", "papa", "tomate", "lechuga",
        "zanahoria", "cebolla", "ajo", "pimiento", "berenjena", "calabacín", "pepino",
        "calabaza", "espinaca", "acelga", "brócoli", "coliflor", "col", "repollo",
        "alcachofa", "espárrago", "apio", "perejil", "cilantro", "albahaca", "menta",
        "romero", "tomillo", "laurel", "salvia", "eneldo", "hinojo", "cebollino",
        "rosa", "clavel", "tulipán", "margarita", "girasol", "amapola", "lavanda",
        "jazmín", "lirio", "orquídea", "helecho", "cactus", "palmera", "pino", "roble",
        "olivo", "naranjo", "limonero", "manzano", "peral", "cerezo", "higuera",
    ],
}

_TAGS_BY_CATEGORY: dict[str, list[str]] = {
    "animales": ["animal", "naturaleza"],
    "naturaleza": ["naturaleza", "tierra"],
    "geografia": ["lugar", "tierra"],
    "comida": ["cocina", "alimento"],
    "objetos": ["objeto", "cosas"],
    "casa": ["hogar", "casa"],
    "cuerpo": ["cuerpo", "salud"],
    "emociones": ["sentimiento", "psicología"],
    "profesiones": ["trabajo", "oficio"],
    "transporte": ["vehículo", "viaje"],
    "ciencia": ["ciencia", "conocimiento"],
    "arte": ["arte", "cultura"],
    "musica": ["música", "arte"],
    "deporte": ["deporte", "juego"],
    "tiempo": ["tiempo", "medida"],
    "escuela": ["educación", "aprendizaje"],
    "tecnologia": ["tecnología", "máquina"],
    "sociedad": ["gente", "comunidad"],
    "colores": ["color", "visión"],
    "plantas": ["naturaleza", "vegetal"],
}

# Hard overrides for very common words that regex classification tends to miss.
_TITLE_OVERRIDES: dict[str, str] = {
    "casa": "casa",
    "mesa": "casa",
    "silla": "casa",
    "cama": "casa",
    "sofa": "casa",
    "sillon": "casa",
    "armario": "casa",
    "cortina": "casa",
    "perro": "animales",
    "gato": "animales",
    "pez": "animales",
    "pajaro": "animales",
    "casa": "casa",
    "sol": "naturaleza",
    "luna": "naturaleza",
    "estrella": "naturaleza",
    "rio": "geografia",
    "mar": "geografia",
    "oceano": "geografia",
    "montana": "geografia",
    "manzana": "comida",
    "naranja": "comida",
    "uva": "comida",
    "agua": "naturaleza",
    "fuego": "naturaleza",
    "libro": "escuela",
    "escuela": "escuela",
    "profesor": "profesiones",
    "medico": "profesiones",
    "coche": "transporte",
    "tren": "transporte",
    "avion": "transporte",
    "rojo": "colores",
    "azul": "colores",
    "verde": "colores",
    "amarillo": "colores",
    "negro": "colores",
    "blanco": "colores",
    "lengua": "cuerpo",
    "diente": "cuerpo",
    "corazon": "cuerpo",
    "cerebro": "cuerpo",
    "savia": "plantas",
    "raiz": "plantas",
    "tallo": "plantas",
    "hoja": "plantas",
    "flor": "plantas",
    "arbol": "plantas",
    "semilla": "plantas",
    "fruto": "plantas",
    "deliberativo": "sociedad",
    "empatar": "deporte",
    "voto": "sociedad",
}

# Language-specific category keywords.
_CATEGORIES: dict[str, dict[str, list[str]]] = {
    "es": {
        "animales": ["animal", "mamífero", "ave", "pájaro", "pez", "peces", "reptil", "anfibio", "insecto", "arácnido", "gusano", "crustáceo", "molusco", "perro", "gato", "caballo", "vaca", "toro", "león", "tigre", "elefante", "oso", "lobo", "zorro", "conejo", "ratón", "rata", "tiburón", "ballena", "delfín", "mono", "jirafa", "cebra", "rinoceronte", "hipopótamo", "cocodrilo", "serpiente", "águila", "halcón", "cuervo", "paloma", "gallina", "pato", "ganso", "pavo", "loro", "canario", "abeja", "avispa", "mariposa", "mosca", "mosquito"],
        "naturaleza": ["naturaleza", "montaña", "monte", "sierra", "valle", "río", "laguna", "lago", "mar", "océano", "playa", "costa", "orilla", "acantilado", "cueva", "bosque", "selva", "jungla", "árbol", "flor", "planta", "hierba", "semilla", "fruto", "roca", "piedra", "tierra", "suelo", "arena", "barro", "arcilla", "cielo", "nube", "lluvia", "nieve", "hielo", "viento", "tormenta", "rayo", "trueno", "arco iris", "estrella", "planeta", "luna", "sol", "fuego", "agua", "aire"],
        "geografia": ["geografía", "país", "nación", "estado", "provincia", "región", "ciudad", "pueblo", "aldea", "capital", "continente", "mapa", "frontera", "cordillera", "volcán", "isla", "península", "golfo", "bahía", "estrecho", "canal", "desierto", "pradera", "llanura", "meseta", "glaciar", "polo", "trópico", "ecuador", "paralelo", "meridiano"],
        "comida": ["comida", "alimento", "bebida", "plato", "fruta", "verdura", "hortaliza", "legumbre", "carne", "pescado", "marisco", "pan", "pastel", "tarta", "helado", "dulce", "postre", "azúcar", "sal", "pimienta", "aceite", "vinagre", "leche", "queso", "yogur", "mantequilla", "huevo", "arroz", "pasta", "sopa", "ensalada", "sándwich", "bocadillo", "tapa", "café", "té", "zumo", "vino", "cerveza", "miel", "frutos secos", "galleta", "chocolate", "caramelo", "nuez", "almendra"],
        "objetos": ["objeto", "cosa", "artículo", "herramienta", "instrumento", "utensilio", "aparato", "dispositivo", "máquina", "mecanismo", "juguete", "pelota", "rueda", "cuerda", "cadena", "clavo", "tornillo", "alambre", "caja", "bolsa", "botella", "vaso", "plato", "cuchara", "tenedor", "cuchillo", "olla", "sartén", "lámpara", "vela", "espejo", "cuadro", "reloj", "moneda", "billete", "llave", "paraguas", "bolígrafo", "lápiz", "papel", "libro", "cuaderno", "mochila", "cesta", "jarra"],
        "casa": ["casa", "hogar", "vivienda", "habitación", "sala", "salón", "cocina", "baño", "dormitorio", "despacho", "jardín", "patio", "balcón", "terraza", "techo", "pared", "suelo", "puerta", "ventana", "escalera", "chimenea", "garaje", "sótano", "ático", "mueble", "mesa", "silla", "sofá", "sillón", "cama", "armario", "estantería", "cortina", "alfombra", "nevera", "lavadora", "horno", "microondas", "fregadero", "bañera", "ducha", "inodoro", "cocina"],
        "cuerpo": ["cuerpo", "cabeza", "cara", "ojo", "oído", "nariz", "boca", "labio", "diente", "cuello", "hombro", "brazo", "codo", "muñeca", "mano", "dedo", "uña", "pecho", "espalda", "cintura", "vientre", "barriga", "cadera", "pierna", "rodilla", "tobillo", "pie", "talón", "corazón", "pulmón", "hígado", "riñón", "estómago", "cerebro", "mente", "sangre", "hueso", "músculo", "piel", "pelo"],
        "emociones": ["emoción", "sentimiento", "alegría", "felicidad", "tristeza", "miedo", "temor", "angustia", "ansiedad", "estrés", "calma", "paz", "tranquilidad", "serenidad", "euforia", "entusiasmo", "motivación", "aburrimiento", "cansancio", "sorpresa", "asombro", "admiración", "amor", "cariño", "afecto", "ternura", "compasión", "empatía", "gratitud", "orgullo", "vergüenza", "culpa", "envidia", "celos", "rabia", "ira", "furia", "enfado", "frustración", "decepción"],
        "profesiones": ["profesión", "oficio", "trabajo", "empleo", "cargo", "puesto", "médico", "doctor", "enfermero", "cirujano", "dentista", "veterinario", "farmacéutico", "abogado", "juez", "policía", "detective", "bombero", "militar", "soldado", "profesor", "maestro", "ingeniero", "arquitecto", "obrero", "albañil", "carpintero", "electricista", "fontanero", "mecánico", "cocinero", "chef", "camarero", "panadero", "carnicero", "pescadero", "agricultor", "ganadero", "jardinero", "peluquero", "estilista", "diseñador", "artista", "pintor", "escultor", "músico", "cantante", "actor", "escritor", "periodista", "fotógrafo", "científico", "investigador", "programador", "administrativo", "comerciante", "vendedor", "dependiente", "taxista", "conductor", "piloto", "azafata", "político", "persona que"],
        "transporte": ["transporte", "vehículo", "coche", "automóvil", "moto", "motocicleta", "bicicleta", "bici", "camión", "autobús", "autocar", "tren", "tranvía", "metro", "avión", "helicóptero", "barco", "buque", "barca", "lancha", "velero", "yate", "submarino", "nave", "cohete", "tractor", "carreta", "carro", "carretilla", "rueda", "neumático", "motor", "gasolina", "diésel"],
        "ciencia": ["ciencia", "física", "química", "biología", "geología", "astronomía", "botánica", "zoología", "ecología", "genética", "anatomía", "fisiología", "medicina", "matemáticas", "aritmética", "álgebra", "geometría", "cálculo", "estadística", "informática", "programación", "ingeniería", "electricidad", "electrónica", "mecánica", "termodinámica", "óptica", "acústica", "átomo", "molécula", "célula", "organismo", "energía", "materia", "fuerza", "gravedad", "velocidad", "aceleración", "masa", "volumen", "densidad", "temperatura", "presión", "experimento", "laboratorio", "microscopio", "telescopio"],
        "arte": ["arte", "pintura", "dibujo", "escultura", "cerámica", "fotografía", "cine", "teatro", "danza", "ballet", "ópera", "literatura", "poesía", "novela", "cuento", "drama", "comedia", "tragedia", "pintor", "escultor", "artista", "museo", "galería", "exposición", "obra", "lienzo", "óleo", "acuarela", "pastel", "tiza", "carboncillo", "pincel", "paleta", "caballete", "taller", "escenario", "vestuario", "decorado"],
        "musica": ["música", "canción", "melodía", "ritmo", "armonía", "compás", "nota", "acorde", "escala", "sinfonía", "concierto", "ópera", "zarzuela", "ballet", "instrumento", "guitarra", "piano", "violín", "viola", "violonchelo", "contrabajo", "arpa", "flauta", "clarinete", "oboe", "fagot", "saxofón", "trompeta", "trombón", "tuba", "corno", "batería", "percusión", "xilófono", "triángulo", "platillos", "director", "orquesta", "banda", "coro", "cantante", "voz"],
        "deporte": ["deporte", "juego", "ejercicio", "competición", "competencia", "partido", "encuentro", "carrera", "marcha", "salto", "lanzamiento", "natación", "atletismo", "fútbol", "baloncesto", "balonmano", "voleibol", "tenis", "pádel", "squash", "golf", "rugby", "hockey", "cricket", "béisbol", "ciclismo", "boxeo", "judo", "karate", "taekwondo", "lucha", "gimnasia", "esquí", "snowboard", "surf", "windsurf", "vela", "remo", "piragüismo", "equitación", "montañismo", "escalada", "medalla", "trofeo", "campeonato", "liga", "copa", "entrenador", "jugador", "árbitro", "portero", "portería", "red", "raqueta", "pelota", "balón", "disco", "jabalina", "pesas", "piscina", "pista", "campo", "estadio", "gimnasio"],
        "tiempo": ["tiempo", "momento", "instante", "segundo", "minuto", "hora", "día", "noche", "mañana", "tarde", "mediodía", "medianoche", "amanecer", "atardecer", "anochecer", "crepúsculo", "alba", "ocaso", "semana", "mes", "año", "década", "siglo", "milenio", "época", "era", "edad", "período", "temporada", "estación", "primavera", "verano", "otoño", "invierno", "pasado", "presente", "futuro", "ayer", "hoy", "antaño", "cronología", "calendario", "reloj", "horario", "fecha", "plazo", "duración", "eternidad", "brevedad", "lentitud", "rapidez", "prisa", "demora", "retraso", "puntualidad"],
        "escuela": ["escuela", "colegio", "instituto", "universidad", "academia", "aula", "clase", "curso", "asignatura", "materia", "lección", "tarea", "deberes", "examen", "prueba", "evaluación", "calificación", "nota", "matrícula", "alumno", "estudiante", "profesor", "maestro", "director", "rector", "bedel", "conserje", "biblioteca", "laboratorio", "gimnasio", "patio", "recreo", "mochila", "libro", "cuaderno", "lápiz", "bolígrafo", "goma", "sacapuntas", "regla", "compás", "transportador", "pizarra", "tiza", "rotulador", "ordenador", "proyector", "pantalla"],
        "tecnologia": ["tecnología", "informática", "ordenador", "computadora", "portátil", "tablet", "teléfono", "móvil", "smartphone", "pantalla", "monitor", "teclado", "ratón", "impresora", "escáner", "cámara", "altavoz", "auriculares", "micrófono", "router", "módem", "red", "internet", "wifi", "bluetooth", "cable", "enchufe", "batería", "cargador", "software", "hardware", "programa", "aplicación", "app", "sistema operativo", "navegador", "página web", "sitio web", "correo electrónico", "mensaje", "chat", "red social", "base de datos", "servidor", "nube", "inteligencia artificial", "algoritmo", "código", "programación", "robot", "dron", "electrónica", "circuito", "chip", "procesador", "memoria", "disco duro", "ssd", "usb", "pantalla táctil", "realidad virtual", "realidad aumentada"],
        "sociedad": ["sociedad", "comunidad", "pueblo", "ciudadanía", "población", "gente", "personas", "ser humano", "individuo", "persona", "hombre", "mujer", "niño", "niña", "bebé", "familia", "padre", "madre", "hijo", "hija", "hermano", "hermana", "abuelo", "abuela", "nieto", "nieta", "tío", "tía", "primo", "prima", "sobrino", "sobrina", "amigo", "amiga", "vecino", "vecina", "compañero", "compañera", "novio", "novia", "esposo", "esposa", "matrimonio", "boda", "nacimiento", "muerte", "vida", "salud", "enfermedad", "educación", "cultura", "religión", "fe", "iglesia", "templo", "mezquita", "sinagoga", "gobierno", "estado", "ley", "derecho", "justicia", "policía", "ejército", "economía", "dinero", "trabajo", "desempleo", "pobreza", "riqueza", "política", "partido", "elección", "voto", "democracia", "guerra", "paz", "conflicto", "acuerdo", "tratado", "frontera", "inmigración", "emigración", "idioma", "lengua", "costumbre", "tradición", "fiesta", "celebración", "ceremonia", "ritual", "ocio", "entretenimiento", "comunicación", "prensa", "radio", "televisión", "periodismo", "acto", "hecho", "suceso", "acontecimiento"],
        "colores": ["color", "rojo", "verde", "azul", "amarillo", "naranja", "morado", "violeta", "rosa", "fucsia", "magenta", "cian", "turquesa", "marrón", "café", "beige", "crema", "blanco", "negro", "gris", "plateado", "dorado", "brillante", "oscuro", "claro", "pastel", "mate", "metalizado", "transparente", "opaco", "pigmento", "tinta", "pintura", "colorante", "matiz", "tonalidad", "sombra"],
        "plantas": ["planta", "árbol", "arbusto", "hierba", "matorral", "flor", "tallo", "hoja", "raíz", "semilla", "fruto", "esqueje", "bulbo", "tubérculo", "corteza", "savia", "clorofila", "fotosíntesis", "jardín", "huerto", "invernadero", "sembrado", "cosecha", "trigo", "arroz", "maíz", "cebada", "avena", "centeno", "judía", "guisante", "lenteja", "garbanzo", "patata", "papa", "tomate", "lechuga", "zanahoria", "cebolla", "ajo", "pimiento", "berenjena", "calabacín", "pepino", "calabaza", "espinaca", "acelga", "brócoli", "coliflor", "col", "repollo", "alcachofa", "espárrago", "apio", "perejil", "cilantro", "albahaca", "menta", "romero", "tomillo", "laurel", "salvia", "eneldo", "hinojo", "cebollino", "rosa", "clavel", "tulipán", "margarita", "girasol", "amapola", "lavanda", "jazmín", "lirio", "orquídea", "helecho", "cactus", "palmera", "pino", "roble", "olivo", "naranjo", "limonero", "manzano", "peral", "cerezo", "higuera"],
    },
    "en": {
        "animales": ["animal", "mammal", "bird", "fish", "reptile", "amphibian", "insect", "spider", "worm", "crustacean", "mollusk", "dog", "cat", "horse", "cow", "bull", "lion", "tiger", "elephant", "bear", "wolf", "fox", "rabbit", "mouse", "rat", "shark", "whale", "dolphin", "monkey", "giraffe", "zebra", "rhino", "hippo", "crocodile", "snake", "eagle", "hawk", "crow", "pigeon", "hen", "duck", "goose", "turkey", "parrot", "canary", "bee", "wasp", "butterfly", "fly", "mosquito"],
        "naturaleza": ["nature", "mountain", "mount", "valley", "river", "lagoon", "lake", "sea", "ocean", "beach", "coast", "shore", "cliff", "cave", "forest", "jungle", "tree", "flower", "plant", "grass", "seed", "fruit", "rock", "stone", "earth", "soil", "sand", "mud", "clay", "sky", "cloud", "rain", "snow", "ice", "wind", "storm", "lightning", "thunder", "rainbow", "star", "planet", "moon", "sun", "fire", "water", "air"],
        "geografia": ["geography", "country", "nation", "state", "province", "region", "city", "town", "village", "capital", "continent", "map", "border", "mountain range", "volcano", "island", "peninsula", "gulf", "bay", "strait", "canal", "desert", "prairie", "plain", "plateau", "glacier", "pole", "tropic", "equator"],
        "comida": ["food", "drink", "dish", "fruit", "vegetable", "legume", "meat", "fish", "seafood", "bread", "cake", "pie", "ice cream", "sweet", "dessert", "sugar", "salt", "pepper", "oil", "vinegar", "milk", "cheese", "yogurt", "butter", "egg", "rice", "pasta", "soup", "salad", "sandwich", "coffee", "tea", "juice", "wine", "beer", "honey", "nuts", "cookie", "biscuit", "chocolate", "candy"],
        "objetos": ["object", "thing", "article", "tool", "instrument", "utensil", "device", "machine", "mechanism", "toy", "ball", "wheel", "rope", "chain", "nail", "screw", "wire", "box", "bag", "bottle", "glass", "plate", "spoon", "fork", "knife", "pot", "pan", "lamp", "candle", "mirror", "picture", "clock", "coin", "bill", "key", "umbrella", "pen", "pencil", "paper", "book", "notebook", "backpack", "basket", "jug"],
        "casa": ["house", "home", "dwelling", "room", "living room", "kitchen", "bathroom", "bedroom", "study", "garden", "yard", "balcony", "terrace", "roof", "wall", "floor", "door", "window", "stairs", "chimney", "garage", "basement", "attic", "furniture", "table", "chair", "sofa", "armchair", "bed", "wardrobe", "shelf", "curtain", "carpet", "fridge", "refrigerator", "washing machine", "oven", "microwave", "sink", "bathtub", "shower", "toilet"],
        "cuerpo": ["body", "head", "face", "eye", "ear", "nose", "mouth", "lip", "tooth", "neck", "shoulder", "arm", "elbow", "wrist", "hand", "finger", "nail", "chest", "back", "waist", "belly", "hip", "leg", "knee", "ankle", "foot", "heel", "heart", "lung", "liver", "kidney", "stomach", "brain", "mind", "blood", "bone", "muscle", "skin", "hair"],
        "emociones": ["emotion", "feeling", "joy", "happiness", "sadness", "fear", "anguish", "anxiety", "stress", "calm", "peace", "tranquility", "serenity", "euphoria", "enthusiasm", "motivation", "boredom", "tiredness", "surprise", "wonder", "admiration", "love", "affection", "tenderness", "compassion", "empathy", "gratitude", "pride", "shame", "guilt", "envy", "jealousy", "anger", "rage", "fury", "frustration", "disappointment"],
        "profesiones": ["profession", "occupation", "job", "employment", "position", "doctor", "physician", "nurse", "surgeon", "dentist", "veterinarian", "pharmacist", "lawyer", "judge", "police", "detective", "firefighter", "soldier", "teacher", "professor", "engineer", "architect", "worker", "bricklayer", "carpenter", "electrician", "plumber", "mechanic", "cook", "chef", "waiter", "baker", "butcher", "fishmonger", "farmer", "gardener", "hairdresser", "stylist", "designer", "artist", "painter", "sculptor", "musician", "singer", "actor", "writer", "journalist", "photographer", "scientist", "researcher", "programmer", "clerk", "merchant", "seller", "salesperson", "taxi driver", "driver", "pilot", "flight attendant", "politician"],
        "transporte": ["transport", "vehicle", "car", "automobile", "motorcycle", "bike", "bicycle", "truck", "bus", "coach", "train", "tram", "subway", "metro", "airplane", "aeroplane", "plane", "helicopter", "ship", "boat", "raft", "sailboat", "yacht", "submarine", "rocket", "tractor", "cart", "wheel", "tire", "tyre", "motor", "gasoline", "petrol", "diesel"],
        "ciencia": ["science", "physics", "chemistry", "biology", "geology", "astronomy", "botany", "zoology", "ecology", "genetics", "anatomy", "physiology", "medicine", "mathematics", "arithmetic", "algebra", "geometry", "calculus", "statistics", "informatics", "programming", "engineering", "electricity", "electronics", "mechanics", "thermodynamics", "optics", "acoustics", "atom", "molecule", "cell", "organism", "energy", "matter", "force", "gravity", "speed", "velocity", "acceleration", "mass", "volume", "density", "temperature", "pressure", "experiment", "laboratory", "microscope", "telescope"],
        "arte": ["art", "painting", "drawing", "sculpture", "ceramics", "photography", "cinema", "film", "theater", "theatre", "dance", "ballet", "opera", "literature", "poetry", "novel", "story", "drama", "comedy", "tragedy", "painter", "sculptor", "artist", "museum", "gallery", "exhibition", "work", "canvas", "oil", "watercolor", "pastel", "chalk", "charcoal", "brush", "palette", "easel", "studio", "stage", "costume", "set"],
        "musica": ["music", "song", "melody", "rhythm", "harmony", "beat", "note", "chord", "scale", "symphony", "concert", "opera", "instrument", "guitar", "piano", "violin", "viola", "cello", "contrabass", "harp", "flute", "clarinet", "oboe", "bassoon", "saxophone", "trumpet", "trombone", "tuba", "horn", "drums", "percussion", "xylophone", "triangle", "cymbals", "conductor", "orchestra", "band", "choir", "singer", "voice"],
        "deporte": ["sport", "game", "exercise", "competition", "match", "race", "walk", "jump", "throw", "swimming", "athletics", "soccer", "football", "basketball", "handball", "volleyball", "tennis", "padel", "squash", "golf", "rugby", "hockey", "cricket", "baseball", "cycling", "boxing", "judo", "karate", "taekwondo", "wrestling", "gymnastics", "skiing", "snowboard", "surf", "windsurfing", "sailing", "rowing", "canoeing", "horse riding", "climbing", "medal", "trophy", "championship", "league", "cup", "coach", "player", "referee", "goalkeeper", "goal", "net", "racket", "racquet", "ball", "disc", "javelin", "weights", "pool", "track", "field", "stadium", "gym"],
        "tiempo": ["time", "moment", "instant", "second", "minute", "hour", "day", "night", "morning", "afternoon", "noon", "midnight", "dawn", "sunrise", "sunset", "dusk", "twilight", "week", "month", "year", "decade", "century", "millennium", "epoch", "era", "age", "period", "season", "spring", "summer", "autumn", "fall", "winter", "past", "present", "future", "yesterday", "today", "chronology", "calendar", "clock", "schedule", "date", "deadline", "duration", "eternity", "brevity", "slowness", "speed", "haste", "delay", "punctuality"],
        "escuela": ["school", "college", "institute", "university", "academy", "classroom", "class", "course", "subject", "lesson", "task", "homework", "exam", "test", "evaluation", "grade", "mark", "enrollment", "pupil", "student", "teacher", "headmaster", "principal", "library", "laboratory", "gym", "playground", "recess", "backpack", "book", "notebook", "pencil", "pen", "eraser", "sharpener", "ruler", "compass", "protractor", "blackboard", "chalk", "marker", "computer", "projector", "screen"],
        "tecnologia": ["technology", "informatics", "computer", "laptop", "tablet", "telephone", "phone", "mobile", "smartphone", "screen", "monitor", "keyboard", "mouse", "printer", "scanner", "camera", "speaker", "headphones", "microphone", "router", "modem", "network", "internet", "wifi", "bluetooth", "cable", "plug", "battery", "charger", "software", "hardware", "program", "application", "app", "operating system", "browser", "web page", "website", "email", "message", "chat", "social network", "database", "server", "cloud", "artificial intelligence", "algorithm", "code", "programming", "robot", "drone", "electronics", "circuit", "chip", "processor", "memory", "hard drive", "ssd", "usb", "touchscreen", "virtual reality", "augmented reality"],
        "sociedad": ["society", "community", "people", "citizenship", "population", "persons", "human being", "individual", "person", "man", "woman", "boy", "girl", "baby", "family", "father", "mother", "son", "daughter", "brother", "sister", "grandfather", "grandmother", "grandson", "granddaughter", "uncle", "aunt", "cousin", "nephew", "niece", "friend", "neighbor", "companion", "boyfriend", "girlfriend", "husband", "wife", "marriage", "wedding", "birth", "life", "health", "education", "culture", "religion", "faith", "church", "temple", "mosque", "synagogue", "government", "law", "right", "justice", "army", "economy", "money", "work", "unemployment", "poverty", "wealth", "politics", "party", "election", "vote", "democracy", "war", "peace", "conflict", "agreement", "treaty", "border", "immigration", "emigration", "language", "custom", "tradition", "party", "celebration", "ceremony", "ritual", "leisure", "entertainment", "communication", "press", "radio", "television", "journalism", "act", "fact", "event"],
        "colores": ["color", "red", "green", "blue", "yellow", "orange", "purple", "violet", "pink", "magenta", "cyan", "turquoise", "brown", "beige", "cream", "white", "black", "gray", "grey", "silver", "gold", "bright", "dark", "light", "pastel", "matte", "metallic", "transparent", "opaque", "pigment", "ink", "paint", "dye", "hue", "shade"],
        "plantas": ["plant", "tree", "shrub", "grass", "bush", "flower", "stem", "leaf", "root", "seed", "fruit", "cutting", "bulb", "tuber", "bark", "sap", "chlorophyll", "photosynthesis", "garden", "orchard", "greenhouse", "sowing", "harvest", "wheat", "rice", "corn", "barley", "oats", "rye", "bean", "pea", "lentil", "chickpea", "potato", "tomato", "lettuce", "carrot", "onion", "garlic", "pepper", "eggplant", "zucchini", "cucumber", "pumpkin", "spinach", "chard", "broccoli", "cauliflower", "cabbage", "artichoke", "asparagus", "celery", "parsley", "cilantro", "basil", "mint", "rosemary", "thyme", "laurel", "sage", "dill", "fennel", "chives", "rose", "carnation", "tulip", "daisy", "sunflower", "poppy", "lavender", "jasmine", "lily", "orchid", "fern", "cactus", "palm", "pine", "oak", "olive", "orange tree", "lemon tree", "apple tree", "pear tree", "cherry tree", "fig tree"],
    },
    "de": {
        "animales": ["Tier", "Säugetier", "Vogel", "Fisch", "Reptil", "Amphibie", "Insekt", "Spinne", "Wurm", "Krebs", "Weichtier", "Hund", "Katze", "Pferd", "Kuh", "Stier", "Löwe", "Tiger", "Elefant", "Bär", "Wolf", "Fuchs", "Hase", "Kaninchen", "Maus", "Ratte", "Hai", "Wal", "Delfin", "Affe", "Giraffe", "Zebra", "Nashorn", "Nilpferd", "Krokodil", "Schlange", "Adler", "Falke", "Krähe", "Taube", "Henne", "Ente", "Gans", "Truthahn", "Papagei", "Kanarienvogel", "Biene", "Wespe", "Schmetterling", "Fliege", "Mücke"],
        "naturaleza": ["Natur", "Berg", "Tal", "Fluss", "Lagune", "See", "Meer", "Ozean", "Strand", "Küste", "Ufer", "Klippe", "Höhle", "Wald", "Dschungel", "Baum", "Blume", "Pflanze", "Gras", "Saat", "Frucht", "Obst", "Fels", "Stein", "Erde", "Boden", "Sand", "Schlamm", "Lehm", "Himmel", "Wolke", "Regen", "Schnee", "Eis", "Wind", "Sturm", "Blitz", "Donner", "Regenbogen", "Stern", "Planet", "Mond", "Sonne", "Feuer", "Wasser", "Luft"],
        "geografia": ["Geografie", "Land", "Nation", "Staat", "Provinz", "Region", "Stadt", "Dorf", "Hauptstadt", "Kontinent", "Karte", "Grenze", "Gebirge", "Vulkan", "Insel", "Halbinsel", "Golf", "Bucht", "Meerenge", "Kanal", "Wüste", "Prärie", "Ebene", "Hochebene", "Gletscher", "Pol", "Tropen", "Äquator"],
        "comida": ["Essen", "Lebensmittel", "Getränk", "Gericht", "Obst", "Gemüse", "Hülsenfrucht", "Fleisch", "Fisch", "Meeresfrucht", "Brot", "Kuchen", "Torte", "Eis", "Süßigkeit", "Nachtisch", "Dessert", "Zucker", "Salz", "Pfeffer", "Öl", "Essig", "Milch", "Käse", "Joghurt", "Butter", "Ei", "Reis", "Nudel", "Pasta", "Suppe", "Salat", "Sandwich", "Kaffee", "Tee", "Saft", "Wein", "Bier", "Honig", "Nuss", "Keks", "Plätzchen", "Schokolade", "Bonbon", "Süßigkeit"],
        "objetos": ["Objekt", "Ding", "Gegenstand", "Werkzeug", "Instrument", "Utensil", "Gerät", "Maschine", "Mechanismus", "Spielzeug", "Ball", "Rad", "Seil", "Kette", "Nagel", "Schraube", "Draht", "Kiste", "Kasten", "Box", "Tasche", "Beutel", "Flasche", "Glas", "Teller", "Löffel", "Gabel", "Messer", "Topf", "Pfanne", "Lampe", "Kerze", "Spiegel", "Bild", "Uhr", "Münze", "Schein", "Geldschein", "Schlüssel", "Regenschirm", "Kugelschreiber", "Bleistift", "Papier", "Buch", "Heft", "Rucksack", "Korb", "Krug"],
        "casa": ["Haus", "Wohnung", "Zimmer", "Wohnzimmer", "Küche", "Bad", "Badezimmer", "Schlafzimmer", "Arbeitszimmer", "Garten", "Hof", "Balkon", "Terrasse", "Dach", "Wand", "Boden", "Fußboden", "Tür", "Fenster", "Treppe", "Kamin", "Garage", "Keller", "Dachboden", "Möbel", "Tisch", "Stuhl", "Sofa", "Couch", "Sessel", "Bett", "Schrank", "Regal", "Vorhang", "Gardine", "Teppich", "Kühlschrank", "Waschmaschine", "Ofen", "Mikrowelle", "Spüle", "Badewanne", "Dusche", "Toilette", "WC"],
        "cuerpo": ["Körper", "Kopf", "Gesicht", "Auge", "Ohr", "Nase", "Mund", "Lippe", "Zahn", "Hals", "Schulter", "Arm", "Ellbogen", "Handgelenk", "Hand", "Finger", "Nagel", "Brust", "Rücken", "Taille", "Bauch", "Hüfte", "Bein", "Knie", "Knöchel", "Fuß", "Ferse", "Herz", "Lunge", "Leber", "Niere", "Magen", "Gehirn", "Verstand", "Blut", "Knochen", "Muskel", "Haut", "Haar"],
        "emociones": ["Emotion", "Gefühl", "Freude", "Glück", "Traurigkeit", "Angst", "Sorge", "Beklemmung", "Ängstlichkeit", "Stress", "Ruhe", "Frieden", "Gelassenheit", "Serenität", "Euphorie", "Enthusiasmus", "Motivation", "Langeweile", "Müdigkeit", "Überraschung", "Staunen", "Bewunderung", "Liebe", "Zuneigung", "Zärtlichkeit", "Mitgefühl", "Empathie", "Dankbarkeit", "Stolz", "Scham", "Schuld", "Neid", "Eifersucht", "Wut", "Zorn", "Raserei", "Frustration", "Enttäuschung"],
        "profesiones": ["Beruf", "Beschäftigung", "Arbeit", "Stelle", "Position", "Arzt", "Doktor", "Krankenpfleger", "Chirurg", "Zahnarzt", "Tierarzt", "Apotheker", "Rechtsanwalt", "Anwalt", "Richter", "Polizist", "Detektiv", "Feuerwehrmann", "Soldat", "Lehrer", "Professor", "Ingenieur", "Architekt", "Arbeiter", "Maurer", "Zimmermann", "Elektriker", "Klempner", "Installateur", "Mechaniker", "Koch", "Schauspieler", "Sänger", "Musiker", "Maler", "Bildhauer", "Künstler", "Fotograf", "Wissenschaftler", "Forscher", "Programmierer", "Angestellter", "Verkäufer", "Fahrer", "Pilot", "Stewardess", "Flugbegleiterin", "Politiker"],
        "transporte": ["Transport", "Verkehr", "Fahrzeug", "Auto", "Automobil", "Motorrad", "Fahrrad", "Rad", "Lastwagen", "LKW", "Bus", "Zug", "Straßenbahn", "U-Bahn", "Metro", "Flugzeug", "Hubschrauber", "Schiff", "Boot", "Segelboot", "Yacht", "U-Boot", "Rakete", "Traktor", "Wagen", "Karren", "Reifen", "Motor", "Benzin", "Diesel"],
        "ciencia": ["Wissenschaft", "Physik", "Chemie", "Biologie", "Geologie", "Astronomie", "Botanik", "Zoologie", "Ökologie", "Genetik", "Anatomie", "Physiologie", "Medizin", "Mathematik", "Arithmetik", "Algebra", "Geometrie", "Analysis", "Statistik", "Informatik", "Programmierung", "Ingenieurwesen", "Elektrizität", "Elektronik", "Mechanik", "Thermodynamik", "Optik", "Akustik", "Atom", "Molekül", "Zelle", "Organismus", "Energie", "Materie", "Kraft", "Gravitation", "Schwerkraft", "Geschwindigkeit", "Beschleunigung", "Masse", "Volumen", "Dichte", "Temperatur", "Druck", "Experiment", "Labor", "Mikroskop", "Teleskop"],
        "arte": ["Kunst", "Malerei", "Zeichnung", "Skulptur", "Keramik", "Fotografie", "Kino", "Film", "Theater", "Tanz", "Ballett", "Oper", "Literatur", "Poesie", "Gedicht", "Roman", "Erzählung", "Geschichte", "Drama", "Komödie", "Tragödie", "Maler", "Bildhauer", "Künstler", "Museum", "Galerie", "Ausstellung", "Werk", "Leinwand", "Öl", "Aquarell", "Pastell", "Kreide", "Pinsel", "Palette", "Staffelei", "Atelier", "Bühne", "Kostüm", "Kulisse"],
        "musica": ["Musik", "Lied", "Melodie", "Rhythmus", "Harmonie", "Takt", "Note", "Akkord", "Tonleiter", "Sinfonie", "Konzert", "Oper", "Instrument", "Gitarre", "Klavier", "Violine", "Geige", "Viola", "Cello", "Violoncello", "Kontrabass", "Harfe", "Flöte", "Klarinette", "Oboe", "Fagott", "Saxophon", "Trompete", "Posaune", "Tuba", "Horn", "Schlagzeug", "Trommel", "Xylophon", "Triangel", "Becken", "Dirigent", "Orchester", "Band", "Chor", "Sänger", "Stimme"],
        "deporte": ["Sport", "Spiel", "Übung", "Training", "Wettkampf", "Spiel", "Match", "Rennen", "Lauf", "Sprung", "Wurf", "Schwimmen", "Leichtathletik", "Fußball", "Basketball", "Handball", "Volleyball", "Tennis", "Golf", "Rugby", "Hockey", "Kricket", "Baseball", "Radfahren", "Radsport", "Boxen", "Judo", "Karate", "Taekwondo", "Ringen", "Turnen", "Gymnastik", "Ski", "Snowboard", "Surfen", "Windsurfen", "Segeln", "Rudern", "Kanu", "Reiten", "Klettern", "Medaille", "Pokal", "Meisterschaft", "Liga", "Trainer", "Spieler", "Schiedsrichter", "Torwart", "Tor", "Netz", "Schläger", "Ball", "Diskus", "Speer", "Gewicht", "Schwimmbad", "Bahn", "Stadion", "Halle"],
        "tiempo": ["Zeit", "Moment", "Augenblick", "Sekunde", "Minute", "Stunde", "Tag", "Nacht", "Morgen", "Vormittag", "Nachmittag", "Mittag", "Mitternacht", "Dämmerung", "Morgendämmerung", "Abenddämmerung", "Woche", "Monat", "Jahr", "Jahrzehnt", "Jahrhundert", "Jahrtausend", "Epoche", "Ära", "Zeitalter", "Periode", "Saison", "Jahreszeit", "Frühling", "Sommer", "Herbst", "Winter", "Vergangenheit", "Gegenwart", "Zukunft", "Gestern", "Heute", "Chronologie", "Kalender", "Uhr", "Zeitplan", "Datum", "Frist", "Dauer", "Ewigkeit", "Kürze", "Langsamkeit", "Schnelligkeit", "Eile", "Verzögerung", "Pünktlichkeit"],
        "escuela": ["Schule", "Schule", "Gymnasium", "Universität", "Akademie", "Klassenzimmer", "Klasse", "Kurs", "Fach", "Stunde", "Lektion", "Aufgabe", "Hausaufgabe", "Prüfung", "Klausur", "Note", "Zensur", "Einschreibung", "Schüler", "Student", "Lehrer", "Direktor", "Rektor", "Bibliothek", "Labor", "Sporthalle", "Turnhalle", "Pausenhof", "Pause", "Rucksack", "Schultasche", "Buch", "Heft", "Bleistift", "Kugelschreiber", "Radiergummi", "Spitzer", "Lineal", "Zirkel", "Geodreieck", "Tafel", "Kreide", "Filzstift", "Computer", "Rechner", "Beamer", "Bildschirm"],
        "tecnologia": ["Technologie", "Informatik", "Computer", "Rechner", "Laptop", "Notebook", "Tablet", "Telefon", "Mobiltelefon", "Handy", "Smartphone", "Bildschirm", "Monitor", "Tastatur", "Maus", "Drucker", "Scanner", "Kamera", "Lautsprecher", "Kopfhörer", "Mikrofon", "Router", "Modem", "Netzwerk", "Netz", "Internet", "WLAN", "Bluetooth", "Kabel", "Stecker", "Batterie", "Akku", "Ladegerät", "Software", "Hardware", "Programm", "Anwendung", "App", "Betriebssystem", "Browser", "Webseite", "Website", "E-Mail", "Nachricht", "Chat", "Soziales Netzwerk", "Datenbank", "Server", "Cloud", "Künstliche Intelligenz", "KI", "Algorithmus", "Code", "Programmierung", "Roboter", "Drohne", "Elektronik", "Schaltung", "Chip", "Prozessor", "Speicher", "Festplatte", "SSD", "USB", "Touchscreen", "Virtuelle Realität", "Erweiterte Realität"],
        "sociedad": ["Gesellschaft", "Gemeinschaft", "Menschen", "Bevölkerung", "Person", "Mensch", "Individuum", "Mann", "Frau", "Junge", "Mädchen", "Baby", "Familie", "Vater", "Mutter", "Sohn", "Tochter", "Bruder", "Schwester", "Großvater", "Großmutter", "Enkel", "Onkel", "Tante", "Cousin", "Cousine", "Neffe", "Nichte", "Freund", "Freundin", "Nachbar", "Nachbarin", "Partner", "Freund", "Freundin", "Ehemann", "Ehefrau", "Ehe", "Hochzeit", "Geburt", "Leben", "Gesundheit", "Krankheit", "Bildung", "Kultur", "Religion", "Glaube", "Kirche", "Tempel", "Moschee", "Synagoge", "Regierung", "Staat", "Gesetz", "Recht", "Gerechtigkeit", "Polizei", "Armee", "Heer", "Wirtschaft", "Geld", "Arbeit", "Arbeitslosigkeit", "Armut", "Reichtum", "Politik", "Partei", "Wahl", "Stimme", "Demokratie", "Krieg", "Frieden", "Konflikt", "Abkommen", "Vertrag", "Grenze", "Einwanderung", "Auswanderung", "Sprache", "Brauch", "Tradition", "Fest", "Feier", "Zeremonie", "Ritual", "Freizeit", "Unterhaltung", "Kommunikation", "Presse", "Rundfunk", "Fernsehen", "Journalismus", "Tat", "Ereignis"],
        "colores": ["Farbe", "Rot", "Grün", "Blau", "Gelb", "Orange", "Lila", "Violett", "Rosa", "Pink", "Magenta", "Cyan", "Türkis", "Braun", "Beige", "Creme", "Weiß", "Schwarz", "Grau", "Silber", "Gold", "Hell", "Dunkel", "Pastell", "Matt", "Metallic", "Transparent", "Undurchsichtig", "Pigment", "Tinte", "Farbe", "Farbstoff", "Farbton", "Schattierung"],
        "plantas": ["Pflanze", "Baum", "Strauch", "Gras", "Busch", "Blume", "Blüte", "Stängel", "Stamm", "Blatt", "Wurzel", "Saat", "Frucht", "Steckling", "Zwiebel", "Knolle", "Rinde", "Saft", "Chlorophyll", "Photosynthese", "Garten", "Obstgarten", "Gewächshaus", "Aussaat", "Ernte", "Weizen", "Reis", "Mais", "Gerste", "Hafer", "Roggen", "Bohne", "Erbse", "Linse", "Kichererbse", "Kartoffel", "Tomate", "Salat", "Karotte", "Möhre", "Zwiebel", "Knoblauch", "Pfeffer", "Aubergine", "Zucchini", "Gurke", "Kürbis", "Spinat", "Mangold", "Brokkoli", "Blumenkohl", "Kohl", "Artischocke", "Spargel", "Sellerie", "Petersilie", "Koriander", "Basilikum", "Minze", "Rosmarin", "Thymian", "Lorbeer", "Salbei", "Dill", "Fenchel", "Schnittlauch", "Rose", "Nelke", "Tulpe", "Gänseblümchen", "Sonnenblume", "Mohn", "Lavendel", "Jasmin", "Lilie", "Orchidee", "Farn", "Kaktus", "Palme", "Kiefer", "Eiche", "Olive", "Apfelbaum", "Birnbaum", "Kirschbaum", "Feigenbaum"],
    },
}

# Priority order used when a definition matches multiple categories.
_CATEGORY_PRIORITY = [
    "colores", "animales", "plantas", "musica", "deporte", "profesiones",
    "transporte", "comida", "casa", "cuerpo", "emociones", "escuela", "tecnologia",
    "ciencia", "arte", "geografia", "naturaleza", "tiempo", "sociedad", "objetos",
]


def _normalize(text: str) -> str:
    """Return lower-case ASCII-ish form for matching (keep ñ)."""
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text


def _is_valid_title(title: str, lang: str = DEFAULT_LANGUAGE) -> bool:
    """Reject titles that are not plain lemmas for the given language."""
    if not title:
        return False
    if ":" in title:
        return False
    if title.startswith("-") or title.endswith("-"):
        return False
    if any(c.isdigit() for c in title):
        return False
    if title[0].isupper():
        return False
    if " " in title or "-" in title:
        return False
    if len(title) < MIN_LENGTH or len(title) > MAX_LENGTH:
        return False
    norm = _normalize(title)
    if norm in _BLACKLIST:
        return False
    if title.lower().startswith(_NAME_LIKE_PREFIXES):
        return False
    # Reject very rare technical/medical coinages.
    if lang == "es" and norm.endswith(("fobia", "itis", "ectomia", "oscopia", "grama", "metria")):
        return False
    if lang == "en" and norm.endswith(("phobia", "itis", "ectomy", "oscopy", "graphy", "metry")):
        return False
    if lang == "de" and norm.endswith(("phobie", "itis", "ektomie", "oskopie", "grafie", "metrie")):
        return False
    return True


def _choose_category(definition: str, title: str = "", lang: str = DEFAULT_LANGUAGE) -> str:
    """Classify a definition into one of the allowed categories."""
    norm_def = _normalize(definition)
    norm_title = _normalize(title)
    scores: dict[str, int] = {}

    # Hard overrides for very common words that are easily misclassified.
    title_override = _TITLE_OVERRIDES.get(norm_title)
    if title_override:
        return title_override

    lang_categories = _CATEGORIES.get(lang, _CATEGORIES[DEFAULT_LANGUAGE])
    for category, keywords in lang_categories.items():
        score = 0
        for keyword in keywords:
            norm_kw = _normalize(keyword)
            # Whole-word matching avoids matching "sal" inside "salada".
            pattern = re.compile(rf"\b{re.escape(norm_kw)}\b")
            if pattern.search(norm_def):
                score += 1
        if score:
            scores[category] = score
    if not scores:
        return "objetos"
    # Highest score wins; ties broken by priority (earlier = better).
    best = max(scores, key=lambda c: (scores[c], -_CATEGORY_PRIORITY.index(c)))
    return best


def _difficulty_for(length: int, title: str) -> str:
    """Assign difficulty using length as a simple proxy."""
    if length <= 5:
        return "easy"
    if length <= 8:
        return "medium"
    return "hard"


def _make_clue(definition: str, max_len: int = 120) -> str:
    """Return a crossword-friendly clue shorter than the definition."""
    # Take the first sentence.
    clue = re.split(r"(?<=[.!?])\s+", definition.strip())[0]
    # Remove leading article-like fragments for brevity.
    clue = re.sub(r"^(Acción y efecto de|Persona que|Lugar donde|Cosa que|Parte de|Tiempo de|Estado de)\s+", "", clue, flags=re.IGNORECASE)
    clue = clue.strip(" :.,;")
    # Ensure it ends with a period if it is a statement.
    if clue and clue[-1].isalnum():
        clue += "."
    if len(clue) > max_len:
        clue = clue[: max_len - 1].rsplit(" ", 1)[0] + "."
    return clue


def _sanitize_definition(definition: str, lang: str = DEFAULT_LANGUAGE) -> str | None:
    """Return a clean, family-safe definition or None if unsuitable."""
    definition = definition.strip()
    if not definition:
        return None
    if len(definition) < 15 or len(definition) > 500:
        return None
    lower = definition.lower()
    # Drop definitions that mention offensive registers.
    if "vulgar" in lower or "ofensivo" in lower or "offensive" in lower or "coloquial despectivo" in lower:
        return None
    # Drop toponyms and gentilics.
    if any(lower.startswith(prefix) for prefix in _UNWANTED_DEFINITION_PREFIXES):
        return None
    # Drop archaic, jargon or very rare words.
    if any(marker in lower for marker in _UNWANTED_MARKERS):
        return None
    # Drop very rare technical/medical constructs.
    if lang == "es" and lower.startswith("término "):
        return None
    if lang == "en" and lower.startswith(("term ", "the ")):
        return None
    # Drop very rare grammatical-only entries.
    if definition.startswith("{{"):
        return None
    return definition


def _build_entry(title: str, definitions: list[str], lang: str = DEFAULT_LANGUAGE) -> dict | None:
    """Convert a Wiktionary lemma into a dictionary-service seed entry."""
    display = title.strip().lower()
    normalized = _normalize(display)

    if not _is_valid_title(display, lang):
        return None

    definition: str | None = None
    for d in definitions:
        definition = _sanitize_definition(d, lang)
        if definition:
            break
    if definition is None:
        return None

    length = len(normalized)
    if length < MIN_LENGTH or length > MAX_LENGTH:
        return None

    category = _choose_category(definition, display, lang)
    clue = _make_clue(definition)
    if len(clue) < 5:
        return None

    contains_accent = display != normalized

    return {
        "word": normalized,
        "displayWord": display,
        "normalizedWord": normalized,
        "definition": definition[0].upper() + definition[1:] if definition else definition,
        "clue": clue[0].upper() + clue[1:] if clue else clue,
        "category": category,
        "difficulty": _difficulty_for(length, normalized),
        "length": length,
        "language": lang,
        "isCommon": True,
        "suitableForChildren": True,
        "suitableForCrossword": True,
        "suitableForWordSearch": True,
        "containsAccent": contains_accent,
        "tags": _TAGS_BY_CATEGORY.get(category, ["general"]),
    }


def _write_batches(entries: list[dict], out_dir: Path, lang: str) -> list[Path]:
    """Write entries in JSON batches of BATCH_SIZE."""
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for index, start in enumerate(range(0, len(entries), BATCH_SIZE)):
        batch = entries[start : start + BATCH_SIZE]
        path = out_dir / f"seed_{lang}_batch_{index:03d}.json"
        path.write_text(json.dumps(batch, ensure_ascii=False, indent=2), encoding="utf-8")
        paths.append(path)
    return paths


def cmd_download(args: argparse.Namespace) -> int:
    """Download the Wiktionary dump for the requested language."""
    lang = args.language
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {WIKTIONARY_DUMPS[lang]} ...")
    path = download_dump(lang, _DUMP_PATHS[lang])
    print(f"Saved to {path}")
    return 0


def cmd_build(args: argparse.Namespace) -> int:
    """Parse the dump and write seed batches."""
    lang = args.language
    dump_path = _DUMP_PATHS[lang]
    if not dump_path.exists():
        print(f"Dump not found at {dump_path}. Run: {sys.argv[0]} download --language {lang}")
        return 1

    print(f"Parsing {dump_path} ...")
    entries: list[dict] = []
    seen: set[str] = set()

    for title, definitions in parse_dump(dump_path, lang, max_entries=args.max):
        entry = _build_entry(title, definitions, lang)
        if entry is None:
            continue
        if entry["normalizedWord"] in seen:
            continue
        seen.add(entry["normalizedWord"])
        entries.append(entry)

        if len(entries) % 500 == 0:
            print(f"  {len(entries)} valid entries...", end="\r")

    print(f"\nTotal valid entries: {len(entries)}")

    paths = _write_batches(entries, DATA_DIR, lang)
    print(f"Wrote {len(paths)} batch file(s) to {DATA_DIR}")
    for path in paths[:5]:
        print(f"  - {path.name}")
    if len(paths) > 5:
        print(f"  ... and {len(paths) - 5} more")
    return 0


def cmd_import(args: argparse.Namespace) -> int:
    """Import a seed batch into the running dictionary service."""
    from import_seed import ADMIN_PASSWORD, BASE_URL, camel_to_snake

    path = Path(args.file)
    if not path.exists():
        print(f"File not found: {path}")
        return 1

    raw = json.loads(path.read_text(encoding="utf-8"))
    payload = [camel_to_snake(entry) for entry in raw]

    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{BASE_URL}/words/es/import",
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-Admin-Password": ADMIN_PASSWORD,
        },
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        print(json.loads(response.read().decode("utf-8")))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build Spanish dictionary seed files from Wiktionary",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    download_parser = subparsers.add_parser("download", help="Download Wiktionary dump")
    download_parser.add_argument(
        "--language",
        choices=["es", "en", "de"],
        default=DEFAULT_LANGUAGE,
        help="Language dump to download",
    )
    download_parser.set_defaults(func=cmd_download)

    build_parser = subparsers.add_parser("build", help="Build seed batches from dump")
    build_parser.add_argument(
        "--language",
        choices=["es", "en", "de"],
        default=DEFAULT_LANGUAGE,
        help="Language dump to build",
    )
    build_parser.add_argument(
        "--max",
        type=int,
        default=None,
        help="Stop after parsing N entries",
    )
    build_parser.set_defaults(func=cmd_build)

    import_parser = subparsers.add_parser("import", help="Import a batch JSON file")
    import_parser.add_argument("file", help="Path to batch JSON")
    import_parser.set_defaults(func=cmd_import)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
