# 2. Proposed software architecture

This is the design I propose we build towards. It will be adjusted after the on-camera tests in
Milestone 2 — the places most likely to change are marked 🧪.

## The big picture

```
        ON THE CAMERA                                      ON YOUR COMPUTER
┌───────────────────────────────┐                  ┌───────────────────────────────┐
│  Canon firmware (untouched)   │                  │         FILM LAB              │
│  CHDK (loaded from SD card)   │                  │   (Python program)            │
│                               │                  │                               │
│  FILMCAM script (Lua)         │    SD card       │  1. Finds finished rolls      │
│   • load a film               │  ─────────────►  │  2. Reads each roll's         │
│   • lock it in                │  roll folders +  │     manifest                  │
│   • count exposures           │  manifest files  │  3. Applies the film recipe   │
│   • hide photos               │                  │  4. Half-frame / double exp.  │
│   • write the roll manifest   │                  │  5. Writes named roll folder  │
│                               │                  │     + contact sheet           │
└───────────────────────────────┘                  └───────────────────────────────┘
        "the camera body"                                    "the lab"
```

The two halves never talk directly. They agree on one thing: **the roll manifest**, a small text
file the camera writes and the Lab reads. Because of that, each half can be built and tested
separately — the Lab can be developed with any JPEGs before the camera script exists.

## Design principles

1. **Never lose a photograph.** The camera script only ever moves or renames image files; it never
   deletes them. The Lab never modifies the card; it reads from it and writes elsewhere.
2. **Everything is a plain text file.** Roll state and manifests can be opened in Notepad and
   understood. If something goes wrong, a human can fix it by hand.
3. **Survive power loss at any moment.** AA batteries die without warning. State is saved after
   every frame, and at start-up the script cross-checks its state against the files actually on
   the card.
4. **Stock CHDK only.** No custom-compiled CHDK, no "native calls", no memory poking.
5. **Dedicated card.** The FILMCAM card is used for nothing else.

## Camera side

### Files on the SD card

```
CHDK/                       CHDK itself (downloaded, not written by us)
CHDK/SCRIPTS/FILMCAM.LUA    the main script, started automatically at power-on
CHDK/LUALIB/FC_*.LUA        its parts (state, screen, film list) — kept small
FILMCAM/STATE.TXT           what is loaded right now, and how many frames are used
FILMCAM/FILMS.LUA           the film list (generated from the project's film catalogue)
FILMCAM/R0007/              one folder per roll: the photos + ROLL.TXT (the manifest)
FILMCAM/LOG.TXT             a diary of what the script did, for debugging
DCIM/                       Canon's normal photo folder — kept empty by the script 🧪
```

File and folder names are short, upper-case "8.3" names (`R0007`, `ROLL.TXT`). The camera's
operating system is old and long names are unreliable. Friendly names
(`2026-11-17 Roll 7 - Portra 400`) are created by the Lab on the computer.

### States

The script is always in exactly one of these states:

```
              load film                 last frame shot
 ┌─────────┐ ──────────►  ┌──────────┐ ───────────────►  ┌───────────────┐
 │ NO FILM │              │ SHOOTING │                   │ ROLL FINISHED │
 └─────────┘ ◄──────────  └──────────┘ ──────────────►   └───────────────┘
      ▲        (never      frame n of N   rewind early           │
      │      directly)                    (with confirmation)    │
      └──────────────────────────────────────────────────────────┘
                     acknowledge → ready for next roll
```

- **NO FILM** — the shutter does nothing. The only thing you can do is load a film: choose the
  stock, the length (24/36), and the format (full/half frame). Then it is locked.
- **SHOOTING** — the screen shows the film name and the counter (e.g. `PORTRA 400   17/36`).
  Shutter and zoom work; most other buttons do nothing. After each shot the photo is filed into
  the roll's folder and the state is saved.
- **ROLL FINISHED** — the shutter is blocked; the screen says the roll is finished and should be
  developed. Acknowledging returns to NO FILM. The finished roll stays untouched on the card.

Whether "rewind early" exists at all is your decision (see open questions in the README).

### Parts of the script

| Part | Job |
|---|---|
| **State** | Reads/writes `STATE.TXT`; on start-up checks it against the files on the card and repairs disagreements |
| **Films** | The list of stocks with their camera-side settings (ISO, white balance) |
| **Screen** | Draws the counter, film name, framing guides, and menus; redraws when Canon wipes them |
| **Controls** 🧪 | Decides what each button does in each state. Isolated on purpose, because the control style (below) is chosen after testing |
| **Shoot** | Applies the film's locked settings, takes/observes the shot, waits for the file, moves it into the roll folder, updates the manifest |
| **Log** | Appends plain-English lines to `LOG.TXT` |

### Control style — to be decided by testing 🧪

| | **Style A: script owns the buttons** | **Style B: script supervises in the background** |
|---|---|---|
| How | CHDK blocks all buttons; the script reads them and "presses" the shutter itself | Canon's firmware handles buttons normally; the script watches the shot counter |
| Lock strength | Strong — Canon's menus are unreachable | Weaker — menus reachable; script re-applies locked settings |
| Shutter feel | Possibly a touch slower | Exactly like the stock camera |
| Risk | Shutter/zoom forwarding must feel right | The Canon menu's *Format* option could erase the card |

I expect **Style A** to be the better fit because locking is the heart of the concept, but the
choice should be made with the camera in hand (tests T5 and T6).

### What a film controls on the camera

| Film | Type | Camera ISO | White balance |
|---|---|---|---|
| Kodak Gold 200 | Colour negative | 200 | Daylight |
| Kodak ColorPlus 200 | Colour negative | 200 | Daylight |
| Kodak Portra 400 | Colour negative | 400 | Daylight |
| Fujifilm Superia X-TRA 400 | Colour negative | 400 | Daylight |
| Fujifilm Pro 400H | Colour negative | 400 | Daylight |
| Kodak Ektar 100 | Colour negative | 100 | Daylight |
| Fujifilm Velvia 50 | Slide | 80 (camera's lowest) | Daylight |
| Kodak Ektachrome E100 | Slide | 100 | Daylight |
| Kodak Tri-X 400 | Black & white | 400 | Daylight |
| CineStill 800T | Colour negative (tungsten) | 800 | Tungsten |

Locking white balance is deliberate: real film can't adapt to the light, so daylight film shot
indoors goes warm, and CineStill 800T shot outdoors goes blue. The camera bakes that in for free.

Whether ISO should follow the film's real speed (authentic, but this small sensor is noisy at
400–800) or stay low with grain added by the Lab is an open question — test shots will inform it.

### The roll manifest (`ROLL.TXT`)

Illustrative — the exact format is fixed in Milestone 5:

```
filmcam=1
roll=7
film=PORTRA400
format=FULL
length=36
iso=400
wb=DAYLIGHT
started=2026-11-17 14:02
finished=2026-11-20 09:41
frame=1,IMG_0412.JPG
frame=2,IMG_0413.JPG
frame=3,IMG_0414.JPG+IMG_0415.JPG      <- a double exposure: two captures, one frame
```

## Lab side

A Python program run from the command line, roughly:

```
filmlab develop  E:\   --out  "C:\Users\you\Pictures\Film"
```

It finds every finished roll on the card, develops each one, and writes:

```
Film/
  2026-11-20 Roll 007 - Portra 400/
     01.jpg  02.jpg  …  36.jpg
     contact-sheet.jpg
     roll-info.txt
```

### Stages

```
 read manifest ─► load frames ─► combine exposures ─► crop to format ─► film recipe ─► save
                                 (double exposure)    (3:2 / half-frame)  (the look)     │
                                                                                         ▼
                                                                                   contact sheet
```

| Stage | What it does |
|---|---|
| **Ingest** | Finds roll folders, reads `ROLL.TXT`, checks every listed photo exists |
| **Combine** | For double/multiple exposures, adds the captures together the way light adds on film |
| **Format** | Full frame: crop 4:3 → 3:2. Half frame: crop each to an upright frame and pair two side by side |
| **Recipe** | The film look: tone curve, colour response, saturation, black-and-white conversion, halation glow, grain |
| **Output** | Saves numbered JPEGs into the named roll folder |
| **Contact sheet** | Lays out small versions of every frame, numbered, with the film name and roll details |

### Film recipes

Each film is one small, human-readable settings file — no programming needed to tweak a look.
Illustrative sketch only:

```toml
name = "Kodak Portra 400"
type = "colour-negative"

[tone]
contrast = 0.85          # below 1 = softer
highlight_rolloff = 0.7  # how gently bright areas fade to white
shadow_lift = 0.03       # slightly open shadows

[colour]
saturation = 0.9
warmth = 0.04            # slight warm bias
shadow_tint = "green-cyan"
highlight_tint = "warm"

[grain]
amount = 0.35
size = 1.2
```

The recipes will be *inspired by* each stock's well-known character, tuned by eye — not laboratory
measurements. Starting characters:

| Film | Character to aim for |
|---|---|
| Kodak Gold 200 | Warm, golden yellows, medium contrast, visible grain |
| Kodak ColorPlus 200 | Warm, slightly muted and vintage, noticeable grain |
| Kodak Portra 400 | Soft contrast, gentle pastel colour, natural skin, fine grain |
| Fujifilm Superia X-TRA 400 | Cooler, green-leaning, punchy, more grain |
| Fujifilm Pro 400H | Soft and airy, cool minty greens, pastel highlights |
| Kodak Ektar 100 | Vivid saturation, strong contrast, very fine grain |
| Fujifilm Velvia 50 | Extreme saturation and contrast, deep blacks, almost no grain |
| Kodak Ektachrome E100 | Clean, cool-neutral, crisp contrast, very fine grain |
| Kodak Tri-X 400 | Black and white, punchy contrast, bold grain |
| CineStill 800T | Cool tungsten balance, red glow (halation) around bright lights, heavy grain |

### One film catalogue, two consumers

The list of films lives in **one** place in this repository. A small "make card" step generates
the camera's `FILMS.LUA` from it and assembles everything that needs copying to the SD card into
one folder. This prevents the camera and the Lab disagreeing about what `PORTRA400` means.

## Testing without the camera: the simulator

Swapping an SD card for every small change is slow, and bugs on a camera are hard to see. So the
camera script will also run on a computer inside a **simulator**: a stand-in that pretends to be
CHDK ("a shot was taken", "the user pressed SET", "the battery just died").

- I confirmed this is practical: a desktop Lua 5.1 engine is available and runs here.
- It lets me test the roll logic — counting, locking, resuming after power loss — before you ever
  put a script on the card.
- It cannot test camera *behaviour* (shutter feel, screen flicker, how Canon reacts to moved
  files). Those still need your camera.
- One trap to guard against: desktop Lua has decimals, the camera's doesn't. The simulator must
  imitate that.

## Repository layout (proposed)

```
docs/            these planning documents
camera/          Lua scripts for the SD card
camera/tests/    the small on-camera test scripts (Milestone 2)
films/           the film catalogue and recipe files
lab/             the Film Lab (Python)
sim/             the camera simulator and automated tests
tools/           the "make card" helper
```
