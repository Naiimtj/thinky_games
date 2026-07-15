"""Wiktionary client and dump parser for Spanish, English and German.

Supports two modes:

* Online lookups through the MediaWiki parse API. Results are cached in-process.
* Bulk extraction from a downloaded Wiktionary XML dump (pages-articles).

All network calls are best-effort and return ``None``/empty collections on any
failure so puzzle generation can always fall back to curated word lists.
"""

from __future__ import annotations

import bz2
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Iterator

WIKTIONARY_DUMPS: dict[str, str] = {
    "es": "https://dumps.wikimedia.org/eswiktionary/latest/eswiktionary-latest-pages-articles.xml.bz2",
    "en": "https://dumps.wikimedia.org/enwiktionary/latest/enwiktionary-latest-pages-articles.xml.bz2",
    "de": "https://dumps.wikimedia.org/dewiktionary/latest/dewiktionary-latest-pages-articles.xml.bz2",
}

_API_TIMEOUT_SECONDS = 10
_CHUNK_BYTES = 256 * 1024
_definition_cache: dict[tuple[str, str], list[str] | None] = {}

# Map locales to the Wiktionary language-section header we need to locate.
_LANG_HEADER_PATTERNS: dict[str, re.Pattern] = {
    "es": re.compile(r"^\s*={2,3}\s*\{\{\s*lengua\s*\|\s*es\s*\}\}\s*={2,3}\s*$", re.MULTILINE),
    "en": re.compile(r"^\s*==\s*English\s*==\s*$", re.MULTILINE),
    "de": re.compile(r"^\s*==[^=]*\{\{\s*Sprache\s*\|\s*Deutsch\s*\}\}[^=]*==\s*$", re.MULTILINE),
}


def _header_level(header_match: re.Match) -> int:
    line = header_match.group(0).strip()
    return len(line) - len(line.lstrip("="))


def _language_section(wikitext: str, lang: str) -> str | None:
    """Return the wikitext of the requested language section, or None."""
    pattern = _LANG_HEADER_PATTERNS.get(lang)
    if pattern is None:
        return None
    match = pattern.search(wikitext)
    if not match:
        return None

    start = match.end()
    level = _header_level(match)
    # A header at the same or higher level (fewer/same equals) ends the section.
    next_pattern = re.compile(rf"^\={{1,{level}}}[^=]", re.MULTILINE)
    next_match = next_pattern.search(wikitext, start)
    end = next_match.start() if next_match else len(wikitext)
    return wikitext[start:end]


def _clean_definition(line: str) -> str | None:
    """Strip wikitext markup from a definition line."""
    text = re.sub(r"^[#;]\d*\s*|^:\[\d+\]\s*", "", line.strip())
    # Drop metadata/context templates.
    text = re.sub(
        r"\{\{\s*(?:csem|uso|ejemplo|nota|ref|etimología)[^}]*\}\}",
        "",
        text,
        flags=re.IGNORECASE,
    )
    # Keep the first argument of common inline content templates.
    text = re.sub(
        r"\{\{\s*(?:plm|l|link|wl|w)\s*\|([^|}]+)(?:\|[^}]*)?\}\}",
        r"\1",
        text,
    )
    # Remove any remaining templates and wiki links.
    text = re.sub(r"\{\{(?:[^{}]|\{\{[^{}]*\}\})*\}\}", "", text)
    text = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.strip(" :.")
    return text if text else None


# Language-specific definition markers in Wiktionary wikitext.
# Spanish uses ordered comments (;1, ;2 ...), English uses # lists,
# German uses colon-number lists (:[1]).
_DEFINITION_PATTERNS: dict[str, re.Pattern] = {
    "es": re.compile(r"^;\d*\s*"),
    "en": re.compile(r"^#\s+"),
    "de": re.compile(r"^:\[\d+\]\s*"),
}


def _definition_subsection(section: str, lang: str) -> str:
    """Narrow the language section to the actual definitions block.

    German Wiktionary keeps definitions under ``{{Bedeutungen}}`` and examples
    under ``{{Beispiele}}``; we only want the former.
    """
    if lang != "de":
        return section
    start_match = re.search(r"\{\{\s*Bedeutungen\s*\}\}", section)
    if not start_match:
        return section
    start = start_match.end()
    end_match = re.search(r"^\{\{", section[start:], re.MULTILINE)
    end = start + end_match.start() if end_match else len(section)
    return section[start:end]


def _extract_definitions(section: str, lang: str) -> list[str]:
    """Pull top-level definition lines for a language section."""
    marker = _DEFINITION_PATTERNS.get(lang)
    if marker is None:
        return []

    section = _definition_subsection(section, lang)
    definitions: list[str] = []
    for line in section.splitlines():
        stripped = line.strip()
        if not marker.match(stripped):
            continue
        # Ignore nested senses (##, ;;, ::).
        if re.match(r"^[#;:]{2,}", stripped):
            continue
        cleaned = _clean_definition(stripped)
        if cleaned:
            definitions.append(cleaned)
    return definitions


def _request_json(url: str) -> dict | None:
    request = urllib.request.Request(
        url, headers={"User-Agent": "ThinkyGames/1.0 (dictionary bot)"}
    )
    try:
        with urllib.request.urlopen(request, timeout=_API_TIMEOUT_SECONDS) as response:
            if response.status != 200:
                return None
            return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None


def fetch_definition(word: str, lang: str) -> list[str] | None:
    """Return a list of definitions for ``word`` in ``lang``, or None on failure.

    ``lang`` must be one of ``es``, ``en`` or ``de``. Online results are cached.
    """
    if lang not in _LANG_HEADER_PATTERNS:
        return None

    key = (word.lower(), lang)
    if key in _definition_cache:
        return _definition_cache[key]

    encoded = urllib.parse.quote(word.replace(" ", "_"))
    url = (
        f"https://{lang}.wiktionary.org/w/api.php"
        f"?action=parse&page={encoded}&prop=wikitext&format=json"
    )
    payload = _request_json(url)
    if payload is None:
        _definition_cache[key] = None
        return None

    try:
        wikitext = payload["parse"]["wikitext"]["*"]
    except (KeyError, TypeError):
        _definition_cache[key] = None
        return None

    section = _language_section(wikitext, lang)
    definitions = _extract_definitions(section, lang) if section else []
    result = definitions if definitions else None
    _definition_cache[key] = result
    return result


def download_dump(lang: str, dest_path: str | Path) -> Path:
    """Download the latest pages-articles dump for ``lang``.

    The destination is created if it does not exist. Returns the written path.
    """
    url = WIKTIONARY_DUMPS.get(lang)
    if url is None:
        raise ValueError(f"Unsupported Wiktionary language: {lang}")

    dest = Path(dest_path)
    dest.parent.mkdir(parents=True, exist_ok=True)

    request = urllib.request.Request(
        url, headers={"User-Agent": "ThinkyGames/1.0 (dictionary bot)"}
    )
    with urllib.request.urlopen(request, timeout=60) as response, dest.open("wb") as out:
        while True:
            chunk = response.read(_CHUNK_BYTES)
            if not chunk:
                break
            out.write(chunk)

    return dest


def _open_dump(path: str | Path):
    path = Path(path)
    if path.suffix == ".bz2":
        return bz2.open(path, "rt", encoding="utf-8", errors="replace")
    return path.open("r", encoding="utf-8", errors="replace")


def parse_dump(
    xml_path: str | Path, lang: str, *, max_entries: int | None = None
) -> Iterator[tuple[str, list[str]]]:
    """Yield (word, definitions) pairs from a Wiktionary XML dump.

    Skips non-article titles (those containing ':') and entries without usable
    definitions for the requested language.
    """
    if lang not in _LANG_HEADER_PATTERNS:
        raise ValueError(f"Unsupported Wiktionary language: {lang}")

    ns_pattern = re.compile(r"^\{[^}]+\}")
    emitted = 0
    with _open_dump(xml_path) as dump:
        # iterparse over the XML stream; clear elements to keep memory bounded.
        context = ET.iterparse(dump, events=("end",))
        context = iter(context)
        for event, elem in context:
            if elem.tag != "page" and not elem.tag.endswith("}page"):
                continue

            title = None
            text = None
            for child in elem:
                tag = ns_pattern.sub("", child.tag)
                if tag == "title":
                    title = (child.text or "").strip()
                elif tag == "revision":
                    for rev_child in child:
                        rev_tag = ns_pattern.sub("", rev_child.tag)
                        if rev_tag == "text":
                            text = rev_child.text or ""
                            break

            elem.clear()

            if not title or ":" in title or not text:
                continue

            section = _language_section(text, lang)
            if not section:
                continue

            definitions = _extract_definitions(section, lang)
            if not definitions:
                continue

            yield title.lower(), definitions
            emitted += 1
            if max_entries is not None and emitted >= max_entries:
                break
