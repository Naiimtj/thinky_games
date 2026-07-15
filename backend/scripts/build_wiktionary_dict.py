#!/usr/bin/env python3
"""CLI to download Wiktionary dumps and build language-specific dictionaries.

Examples:
    uv run python scripts/build_wiktionary_dict.py fetch es casa
    uv run python scripts/build_wiktionary_dict.py download es
    uv run python scripts/build_wiktionary_dict.py build es --dump data/eswiktionary.xml.bz2 --out data/es_dict.json --max 10000
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.games.wiktionary import (  # noqa: E402
    WIKTIONARY_DUMPS,
    download_dump,
    fetch_definition,
    parse_dump,
)


def cmd_fetch(args: argparse.Namespace) -> int:
    definitions = fetch_definition(args.word, args.lang)
    if definitions is None:
        print(f"No definition found for '{args.word}' ({args.lang})")
        return 1
    print(f"{args.word} ({args.lang}):")
    for index, definition in enumerate(definitions[:5], 1):
        print(f"  {index}. {definition}")
    return 0


def cmd_download(args: argparse.Namespace) -> int:
    dest = Path(args.dest)
    print(f"Downloading {WIKTIONARY_DUMPS[args.lang]} ...")
    path = download_dump(args.lang, dest)
    print(f"Saved to {path}")
    return 0


def cmd_build(args: argparse.Namespace) -> int:
    dump_path = Path(args.dump)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Parsing {dump_path} ...")
    dictionary: dict[str, list[str]] = {}
    for word, definitions in parse_dump(dump_path, args.lang, max_entries=args.max):
        dictionary[word] = definitions
        if len(dictionary) % 1000 == 0:
            print(f"  {len(dictionary)} entries...", end="\r")

    print(f"\nWriting {len(dictionary)} entries to {out_path}")
    with out_path.open("w", encoding="utf-8") as handle:
        json.dump(dictionary, handle, ensure_ascii=False, indent=2)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Wiktionary dictionary builder")
    parser.add_argument("--lang", choices=list(WIKTIONARY_DUMPS), required=True)
    subparsers = parser.add_subparsers(dest="command", required=True)

    fetch_parser = subparsers.add_parser("fetch", help="Fetch one word online")
    fetch_parser.add_argument("word")
    fetch_parser.set_defaults(func=cmd_fetch)

    download_parser = subparsers.add_parser("download", help="Download a dump")
    download_parser.add_argument(
        "--dest",
        default="data/wiktionary_dump.xml.bz2",
        help="Destination file path",
    )
    download_parser.set_defaults(func=cmd_download)

    build_parser = subparsers.add_parser("build", help="Build JSON dict from dump")
    build_parser.add_argument("--dump", required=True, help="Path to XML/BZ2 dump")
    build_parser.add_argument("--out", required=True, help="Output JSON path")
    build_parser.add_argument(
        "--max", type=int, default=None, help="Stop after N entries"
    )
    build_parser.set_defaults(func=cmd_build)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
