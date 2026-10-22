#!/usr/bin/env python3
"""Render the catalog's Unicode characters as bundled PNG tiles."""

import json
import shutil
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src" / "catalog.ts"
ASSETS = ROOT / "assets" / "glyphs"


def glyph_filename(symbol: str) -> str:
    codepoints = "-".join(f"{ord(char):x}" for char in symbol)
    return f"{codepoints}.png"


def main() -> None:
    renderer = shutil.which("rsvg-convert")
    if not renderer:
        raise SystemExit("Missing rsvg-convert. Install librsvg to regenerate glyph assets.")

    source = CATALOG.read_text(encoding="utf-8")
    array = source.split("export const symbols: SymbolEntry[] = ", 1)[1].rsplit(";", 1)[0]
    entries = json.loads(array)
    unique_symbols = sorted({entry["symbol"] for entry in entries})
    ASSETS.mkdir(parents=True, exist_ok=True)

    for symbol in unique_symbols:
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <text x="64" y="91" text-anchor="middle" font-family="STIX Two Math, Cambria Math, Times New Roman, serif" font-size="68" fill="#3978ee">{escape(symbol)}</text>
</svg>
'''
        svg_path = ASSETS / "glyph.svg"
        png_path = ASSETS / glyph_filename(symbol)
        svg_path.write_text(svg, encoding="utf-8")
        subprocess.run([renderer, "-w", "128", "-h", "128", str(svg_path), "-o", str(png_path)], check=True)

    (ASSETS / "glyph.svg").unlink(missing_ok=True)
    print(f"Generated {len(unique_symbols)} glyph images from {len(entries)} catalog entries")


if __name__ == "__main__":
    main()
