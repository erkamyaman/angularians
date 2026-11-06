"""Builds docs/assets/wordmark.svg, the README's header: the mark and "ANGULARIANS" in Norse Bold, as outlines.

GitHub cannot load our font, so the word is drawn from its glyphs (app/public/fonts). From the repository root:

  pip install fonttools
  python3 app/scripts/logo/wordmark.py
"""
import json, subprocess
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT, OUT = 'app/public/fonts/Norse-Bold.otf', 'docs/assets/wordmark.svg'
f = TTFont(FONT)
glyphs, cmap, hmtx = f.getGlyphSet(), f.getBestCmap(), f['hmtx']
CAP = 735                             # Norse's cap height, in font units
LOGO = 1.75 * CAP                     # the mark's box, as in the site's header
GAP, TRACK = 0.14 * CAP, 20           # between the mark and the word; between the letters
BASE = (LOGO + CAP) / 2 + LOGO * .035  # the capitals centred on the mark's bright A half (as on the site)

paths, x = [], LOGO + GAP
for ch in 'ANGULARIANS':
    name = cmap[ord(ch)]
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, BASE)))
    paths.append(pen.getCommands())
    x += hmtx[name][0] + TRACK
width = x - TRACK
parts = json.loads(subprocess.check_output(['python3', 'app/scripts/logo/build.py']))
cls = {'solid': 's', 'empty': 'e', 'l1': 'a', 'l2': 'b', 'l3': 'c'}
open(OUT, 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.0f} {LOGO:.0f}" role="img" aria-label="Angularians">'
    # Gold on GitHub's dark theme; the deeper #9A6700 and a lighter grey when the viewer's system is light.
    '<style>.s,.w{fill:#D29922}.e{fill:#4a525c}.a{fill:#5c4000}.b{fill:#9A6700}.c{fill:#E3B341}'
    '@media (prefers-color-scheme:light){.s,.w{fill:#9A6700}.e{fill:#d0d7de}}</style>'
    f'<g transform="scale({LOGO / 24:.4f})">' + ''.join(f'<path class="{cls[k]}" d="{d}"/>' for k, d in parts.items()) + '</g>'
    f'<path class="w" d="{" ".join(paths)}"/></svg>\n')
print(f'{OUT}: {width:.0f} x {LOGO:.0f}')
