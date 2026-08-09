# Desk Pet

A small coral starburst creature that hops along the bottom of your actual screen,
above your editor and terminal. It lives in a transparent, always-on-top window that
clicks fall straight through — so it can't get in the way of your work.

## Run it

```bash
cd desk-pet
npm install      # ~200 MB, mostly the Electron runtime
npm start
```

The pet appears at the bottom of your primary display, and a starburst icon appears
in your menu bar (macOS) or system tray (Windows/Linux). There is no Dock icon and no
app window — quit from the tray menu.

## What it does

| Action | What happens |
| --- | --- |
| Move your cursor near it | Its eyes follow you, and it wanders toward you |
| Click it | It bounces, hearts float up |
| Drag it | Pick it up, fling it, watch it land and squash |
| Leave it alone ~40s | It curls its rays in and naps, with drifting `z z` |
| Tray → Give a treat | A berry drops on the floor and it hops over to eat it |
| Tray → Send for a nap | Immediate nap, for when you need to concentrate |
| Tray → Bring to this screen | Moves it back to your primary display |

Clicks only register in the ~50px around the creature. Everywhere else on screen,
your clicks go to whatever app is underneath, as if the overlay weren't there.

## Ship it as a real .app / .exe

```bash
npm run build:mac     # or build:win / build:linux
```

Output lands in `dist/`. On macOS the build is unsigned, so the first launch needs
right-click → Open. To have it start with your machine, add the built app to
System Settings → General → Login Items.

## Troubleshooting

**Clicks on the pet don't register (macOS).** Some macOS versions won't deliver mouse
events to a non-focusable window. In `main.js`, change `focusable: false` to
`focusable: true`. The trade-off is that clicking the pet briefly takes focus from
your editor.

**It hides behind full-screen apps.** A macOS full-screen Space owns the whole screen
and nothing floats over it. Use a maximized window instead of true full screen, or let
the pet nap while you're in full screen.

**It's on the wrong monitor.** Tray → Bring to this screen. It follows the display
macOS/Windows reports as primary.

**It's distracting.** Tray → Send for a nap. A sleeping pet does almost nothing:
no hops, no cursor tracking, one drifting `z z` every couple of seconds.

## Tuning

Everything behavioural lives in `renderer/index.html`:

- `GRAV` — hop arc. Lower is floatier.
- `P.nextHop = 150 + Math.random() * 320` — seconds between hops, in frames at 60fps.
  Raise both numbers for a calmer pet.
- `idleTicks > 60 * 40` — how long before it naps, in frames (currently 40 seconds).
- `HIT` — the click radius around the creature.

Colours are the CSS variables at the top of the same file.
