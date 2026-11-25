"""Render the PWA icons from the master logo (docs/brand/logo.svg).

Usage: python3 scripts/make-icons.py public
Needs `rsvg-convert` (Debian/Ubuntu: librsvg2-bin; macOS: brew install librsvg).
"""
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
MASTER = (ROOT / "docs/brand/logo.svg").read_text()
# Maskable and Apple icons must be opaque squares: the phone applies its own corner shape.
SQUARE = MASTER.replace('rx="14"', 'rx="0"')
out = pathlib.Path(sys.argv[1])


def render(svg: str, size: int, path: pathlib.Path) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".svg") as f:
        f.write(svg)
        f.flush()
        subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), f.name, "-o", str(path)], check=True)


render(MASTER, 192, out / "pwa-192x192.png")
render(MASTER, 512, out / "pwa-512x512.png")
render(SQUARE, 512, out / "pwa-maskable-512x512.png")
render(SQUARE, 180, out / "apple-touch-icon.png")
render(MASTER, 512, ROOT / "docs/brand/logo-512.png")
