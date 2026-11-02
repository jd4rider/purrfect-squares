# Game design

## The loop

A board of wooden tiles holds a handful of numbered cats. Each cat's number is
the area of the rectangle that must surround it. The player drags a rectangle
over the cells; if the rectangle holds exactly one cat and its area matches, it
locks in as a pastel inlay. When all playable cells are covered exactly once,
the board is solved.

There is no clock, no failure state, no score to lose. Pressure comes from the
deduction, not from the interface. Undo is unlimited and resets cost only a
little star credit.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Draw a rectangle | Drag from one cell to another | Arrows to move, Enter twice |
| Two-tap drawing | Tap one corner, then the other | same |
| Lift a rectangle | Tap it | Enter on a covered cell |
| Undo / redo | HUD buttons | `Z` / `Y` |
| Hint | HUD button | `H` |
| Reset board | HUD button | `R` |
| Leave | Back arrow | `Esc` |

Dragging works in any direction: `normalizeRect` sorts the corners, so
bottom-right to top-left is identical to the reverse. Invalid placements fade
with a short message; they are never punished.

## Modes

- **Journey** — 200 validated boards, 8 chapters of 25. The next board unlocks
  on completion; stars are per board.
- **Daily Catnap** — a deterministic board from the UTC date, identical for
  every player, with a streak counter.
- **Zen** — small generated boards, unlimited hints and undo, no pressure.
- **Expert** — the hardest Journey boards, replayed for badges.
- **Unlimited** — fresh validated boards from an incrementing seed.

## Stars

Stars reward care, because there is no time to reward:

- 3 — solved with no hints and no reset
- 2 — up to two hints and one reset
- 1 — anything else

## Themes

Five themes change the tray, tiles, backdrop and UI while leaving the puzzle
logic untouched: Sunny Garden (from the start), Cozy Cottage (8 puzzles),
Moonlight Cats (20), Candy Cats (40), Royal Cat Palace (75).

## Badges

First Purr, Ten Happy Cats, Rectangle Rookie, Garden Genius, No Hints Needed,
Daily Catnap, Seven Cozy Days, Master of Shapes, 100 Puzzles Solved, Purrfect
Master. All are derived from the save, never from a client event.

## Feel

The board is a raised wooden tray with a fake extrusion, tiles have a top-left
highlight and a bottom-right shade, and cats are drawn from primitives with a
number badge. Cats blink and sway; a completed rectangle pops with a sparkle and
a short purr. Reduced-motion turns off idle movement, particles and shake while
keeping all feedback readable.
