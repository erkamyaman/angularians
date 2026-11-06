"""Builds the Angularians mark from its construction, with real boolean operations.

  pip install shapely
  python3 app/scripts/logo/build.py     # JSON: the path data of each part, in a 24 x 24 view box

The mark: the Angular shield cut in two along the right leg of the capital A of Norse Bold. The left piece holds
the A, which cuts through the shield from its tip out through its bottom. The right piece is a contribution graph:
a grid of squares tilted to the shield's top edge, cut by its outline, in three shades of the brand colour and the grey of empty days.
The parts: `solid` (the left piece), `empty`, `l1`, `l2`, `l3` (the squares, darkest to brightest).
"""
import json, math, random
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from shapely import affinity

STRIPE, GAP = 1.4, 1.1                 # the strip between the A's right leg and the cut; the gap between the pieces
PITCH, SIZE = 1.9, 1.6               # the grid: the step between squares, and their side
KEEP, EDGE = .03, .45                  # a square is kept when this much of it is inside; an empty day below EDGE
SEED, EXTRA_EMPTY = 4, 5               # the pattern, and a few more empty days among the whole squares

SHIELD = Polygon([(12, .8), (22.6, 4.6), (21, 18.4), (12, 23.4), (3, 18.4), (1.4, 4.6)]).buffer(.5, join_style='round', quad_segs=8)

# The cut: parallel to the outer edge of the Norse A's right leg, through the shield's apex.
K = (379 - 306) / (495 - 147)
s = math.hypot(1, K); n = (1 / s, -K / s)
STEP = 1.8                             # the left piece sits this much lower than the right one
cx = lambda y: 12 + (y - .8) * K
left_side = Polygon([(-10, -10), (cx(-10), -10), (cx(40), 40), (-10, 40)])
right_side = Polygon([(cx(-10), -10), (40, -10), (40, 40), (cx(40), 40)])
extra = GAP - K * STEP / s
dl = (-n[0] * extra / 2, -n[1] * extra / 2 + STEP / 2)
dr = (n[0] * extra / 2, n[1] * extra / 2 - STEP / 2)
outline = unary_union([affinity.translate(SHIELD.intersection(left_side), *dl), affinity.translate(SHIELD.intersection(right_side), *dr)])
minx, miny, maxx, maxy = outline.bounds
sc = 22 / (maxy - miny)
fit = lambda g: affinity.translate(affinity.scale(g, sc, sc, origin=(0, 0)), 12 - sc * (minx + maxx) / 2, 1 - sc * miny)

# The capital A of Norse Bold by Joel Carrouche (app/public/fonts; THIRD_PARTY_NOTICES.md),
# its outline in font units, y up. Under its crossbar the feet are cut off and the legs go on straight.
A_RINGS = [[(279, 205), (287, 172), (296, 166), (288, 156), (292, 128), (305, 2), (322, -7), (335, -7), (409, 17), (398, 60), (383, 76), (389, 84), (379, 147), (354, 240), (354, 254), (306, 495), (294, 504), (301, 522), (269, 675), (265, 685), (262, 693), (263, 728), (246, 736), (164, 732), (154, 669), (145, 627), (138, 587), (149, 572), (131, 551), (101, 417), (101, 399), (95, 378), (92, 359), (72, 236), (73, 216), (62, 205), (52, 142), (25, 20), (60, -2), (122, -8), (133, 59), (126, 87), (135, 98), (146, 169), (166, 177), (175, 181), (242, 197), (262, 211), (263, 211), (277, 213), (279, 205)], [(187, 434), (182, 450), (192, 455), (212, 577), (227, 471), (231, 453), (235, 401), (255, 293), (227, 286), (162, 266), (163, 273), (175, 338), (174, 337), (187, 434)]]
CLIP, LONG = 130, -900
glyph = Polygon(A_RINGS[0], holes=A_RINGS[1:]).intersection(box(-100, CLIP, 600, 900))
legs = [Polygon([(50, CLIP), (141, CLIP), (141 + .163 * (LONG - CLIP), LONG), (50 + .178 * (LONG - CLIP), LONG)]),
        Polygon([(290, CLIP), (383, CLIP), (383 - K * (LONG - CLIP), LONG), (290 - K * (LONG - CLIP), LONG)])]
A = affinity.scale(unary_union([glyph, *legs]), 1, -1, origin=(0, 0))
TOP, BAR = -.4, 15                     # design y of the A's top (above the tip: it cuts through) and of its crossbar
sa = (BAR - TOP) / (736 - 230)
A = affinity.scale(A, sa, sa, origin=(0, 0))
A = affinity.translate(A, 0, TOP - A.bounds[1])
reach = max(n[0] * x + n[1] * y for x, y in A.exterior.coords if y < 18)
A = affinity.translate(A, (n[0] * 12 + n[1] * .8 - STRIPE - reach) / n[0], 0)

piece = affinity.translate(SHIELD.difference(A).intersection(left_side), *dl)
wing = affinity.translate(SHIELD.intersection(right_side), *dr)

# The contribution graph, tilted to the shield's top right edge.
rng = random.Random(SEED)
cells = {'empty': [], 'l1': [], 'l2': [], 'l3': []}
pick = lambda: rng.choices(['empty', 'l1', 'l1', 'l2', 'l3'], weights=[.4, 1.5, 2.5, 3, 3.5])[0]
angle = math.degrees(math.atan2(4.6 - .8, 22.6 - 12))
w = affinity.rotate(wing, -angle, origin=(12, 12))
wx, wy, wX, wY = w.bounds
for i in range(int((wX - wx) / PITCH) + 3):
    for j in range(int((wY - wy) / PITCH) + 3):
        sq = box(wx - PITCH + i * PITCH, wy - PITCH + j * PITCH, wx - PITCH + i * PITCH + SIZE, wy - PITCH + j * PITCH + SIZE)
        sq = sq.buffer(-.12).buffer(.12, quad_segs=3)
        part = w.intersection(sq)
        if part.area >= KEEP * SIZE * SIZE:
            kind = pick() if part.area >= EDGE * SIZE * SIZE else 'empty'
            cells[kind].append(affinity.rotate(part, angle, origin=(12, 12)))
whole = [(k, c) for k in ('l1', 'l2', 'l3') for c in cells[k] if c.area > .9 * SIZE * SIZE * .95]
for k, c in random.Random(SEED + 1).sample(whole, min(EXTRA_EMPTY, len(whole))):
    cells[k].remove(c); cells['empty'].append(c)

def ring(coords):
    pts = list(coords)[:-1]
    fmt = lambda v: (f'{v:.2f}'.rstrip('0').rstrip('.')) or '0'
    return 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in pts) + 'Z'
def path(g):
    polys = list(g.geoms) if hasattr(g, 'geoms') else ([g] if not g.is_empty else [])
    return ''.join(ring(p.exterior.coords) + ''.join(ring(h.coords) for h in p.interiors) for p in polys)

print(json.dumps({'solid': path(fit(piece)), **{k: path(fit(unary_union(v))) for k, v in cells.items()}}))
