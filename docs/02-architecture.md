# 2. Proposed software architecture

This is the design I propose we build towards. It will be adjusted after the on-camera tests —
the places most likely to change are marked 🧪.

## The big picture

```
        ON THE CAMERA                                      ON YOUR PHONE
┌───────────────────────────────┐                  ┌───────────────────────────────┐
│  Canon firmware (untouched)   │                  │         FILM LAB              │
│  CHDK (loaded from SD card)   │                  │  (web app in Chrome, Android) │
│                               │                  │                               │
│  FILMCAM script (Lua)         │    SD card in    │  1. You pick a finished roll  │
│   • load a film               │  a USB-C reader  │  2. Reads the roll's manifest │
│   • lock it in                │  ─────────────►  │  3. Applies the film recipe   │
│   • count exposures           │  roll folders +  │  4. Half-frame / double exp.  │
│   • hide photos               │  manifest files  │  5. Shows + saves the roll    │
│   • write the roll manifest   │                  │     and its contact sheet     │
└───────────────────────────────┘                  └───────────────────────────────┘
        "the camera body"                                    "the lab"
```

The two halves never talk directly. They agree on one thing: **the roll manifest**, a small text
file the camera writes and the Lab reads. Because of that, each half can be built and tested
separately — the Lab can be developed with any JPEGs before the camera script exists.

Your Windows PC is still needed, but only for setup: preparing the SD card and copying CHDK and
our script onto it.

## Design principles

1. **Never lose a photograph.** The camera script only ever moves or renames image files; it never
   deletes them. The Lab only reads the card; it saves its results to the phone.
2. **Everything is a plain text file.** Roll state and manifests can be opened and understood by a
   person. If something goes wrong, it can be fixed by hand.
3. **Survive power loss at any moment.** AA batteries die without warning. State is saved after
   every frame, and at start-up the script cross-checks its state against the files actually on
   the card.
4. **Stock CHDK only.** No custom-compiled CHDK, no "native calls", no memory poking.
5. **Dedicated card.** The FILMCAM card is used for nothing else.
6. **Your photos stay on your devices.** The Lab does all its work on the phone itself. Nothing is
   uploaded anywhere.

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
(`2026-11-17 Roll 7 - Portra 400`) are created by the Lab.

### States

The script is always in exactly one of these states:

```
              load film                 last frame shot
 ┌─────────┐ ──────────►  ┌──────────┐ ───────────────►  ┌───────────────┐
 │ NO FILM │              │ SHOOTING │                   │ ROLL FINISHED │
 └─────────┘              └──────────┘ ───────────────►  └───────────────┘
      ▲                    frame n of N   rewind early           │
      │                                  (with confirmation)     │
      └──────────────────────────────────────────────────────────┘
                     acknowledge → ready for next roll
```

- **NO FILM** — the shutter does nothing. The only thing you can do is load a film: choose the
  stock, the length (24/36), and the format (full/half frame). Then it is locked.
- **SHOOTING** — the screen shows the film name and the counter (e.g. `PORTRA 400   17/36`).
  Shutter and zoom work; most other buttons do nothing. After each shot the photo is filed into
  the roll's folder and the state is saved.
- **Rewind early** — a deliberate, confirmed action that ends the roll before the last frame. The
  unused frames are lost, as with real film. The manifest records that the roll was cut short.
- **ROLL FINISHED** — the shutter is blocked; the screen says the roll is finished and should be
  developed. Acknowledging returns to NO FILM. The finished roll stays on the card, **still
  hidden** — it is never shown on the camera, only by the Lab.

### Parts of the script

| Part | Job |
|---|---|
| **State** | Reads/writes `STATE.TXT`; on start-up checks it against the files on the card and repairs disagreements |
| **Films** | The list of stocks with their camera-side settings (ISO, white balance) |
| **Screen** | Draws the counter, film name, framing guides, and menus; redraws when Canon wipes them |
| **Controls** 🧪 | Decides what each button does in each state. Isolated on purpose, because the control style (below) is chosen after testing |
| **Shoot** | Applies the film's locked settings, takes/observes the shot, waits for the file, moves it into the roll folder, updates the manifest |
| **Log** | Appends plain-English lines to `LOG.TXT` |

The parts are split this way so that the pieces we can prove now (State, Films, the manifest) are
separate from the pieces that depend on how the real camera behaves (Controls, Screen, the
file-moving step in Shoot).

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

**ISO is locked to the film's speed, and white balance to the film's colour balance.**

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

Locking ISO has a real consequence, just as with film: a roll of Ektar 100 will struggle indoors,
and a roll of 800T will be noisy. This small sensor is visibly noisy at 400 and above; the Lab's
grain is designed to sit on top of that rather than fight it.

### The roll manifest (`ROLL.TXT`)

Illustrative — the exact format is fixed when the simulator is built:

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
ended=COMPLETE                         <- or REWOUND if cut short
frame=1,IMG_0412.JPG
frame=2,IMG_0413.JPG
frame=3,IMG_0414.JPG+IMG_0415.JPG      <- a double exposure: two captures, one frame
```

## Lab side: a web app on your phone

### Why a web app rather than a "real" Android app

| Option | For | Against |
|---|---|---|
| **Web app in Chrome** (recommended) | Nothing to install or sideload — open a link, then "Add to Home screen" and it behaves like an app, including offline. I can build and test it here in an emulated phone browser. The same app also runs on your Windows PC | Access to files goes through the browser's pickers, which is slightly less smooth than a native app |
| Native Android app | Smoothest file access; feels most like an app | Needs Android Studio on your PC, building and sideloading app packages, and I cannot run or test Android apps in my environment — every change would need you to rebuild and try it. Far slower for both of us |
| Python on Android (Termux, Pydroid) | Reuses desktop code | Awkward to install and use; no proper interface |

The web app is plain HTML and JavaScript with no build tools, so it stays readable and you can
open the files and see exactly what they do.

### Using it

1. Take the SD card out of the camera and put it in a **USB-C card reader** plugged into the phone.
   (Leave the card's lock tab on — the phone can then only *read* it, which is what we want.)
2. Open Film Lab from the home screen.
3. Pick the roll's folder (or select all the files in it).
4. Watch it develop. The contact sheet appears first, then you can browse the frames.
5. Save the developed roll to the phone.

The result is a folder like:

```
2026-11-20 Roll 007 - Portra 400/
   01.jpg  02.jpg  …  36.jpg
   contact-sheet.jpg
   roll-info.txt
```

### Getting files in and out 🧪

How a web page may read and save files on Android has changed recently, so the Lab is designed
with a dependable baseline and optional upgrades, to be tested on your actual phone:

| | Baseline (works on any Android Chrome) | Upgrade if your phone supports it |
|---|---|---|
| **Reading the roll** | Select all files in the roll folder with the standard file picker | Pick the whole folder in one tap |
| **Saving the roll** | One ZIP file per roll, named for the roll, saved to Downloads | Write the named folder of JPEGs straight into a folder you choose; or share to your gallery app |

### Speed

I measured a film-recipe-sized workload on an 8-megapixel photo (the A590's size) in an emulated
phone browser, with the processor artificially slowed to imitate modest phones:

| Processor speed | Per photo | 36-exposure roll |
|---|---|---|
| No slowdown (faster than most phones) | 0.3 s | ~13 s |
| 4× slower (roughly a mid-range phone) | 1.1 s | ~40 s |
| 6× slower (roughly a budget phone) | 1.6 s | ~1 min |

The finished recipes will be heavier than this test (halation and better grain add work), so
expect perhaps a few minutes per roll on a slow phone. That is comfortably practical — and waiting
for a roll to develop is rather in the spirit of the thing. These are estimates from emulation;
the real figure comes from your phone 🧪.

### Stages

```
 read manifest ─► load frames ─► combine exposures ─► crop to format ─► film recipe ─► save
                                 (double exposure)    (3:2 / half-frame)  (the look)     │
                                                                                         ▼
                                                                                   contact sheet
```

| Stage | What it does |
|---|---|
| **Ingest** | Reads `ROLL.TXT`, checks every listed photo is present |
| **Combine** | For double/multiple exposures, adds the captures together the way light adds on film |
| **Format** | Full frame: crop 4:3 → **3:2**, the shape of a 35mm frame. Half frame: crop each to an upright frame and pair two side by side |
| **Recipe** | The film look: tone curve, colour response, saturation, black-and-white conversion, halation glow, grain |
| **Output** | Numbered JPEGs for the named roll folder |
| **Contact sheet** | Small versions of every frame, numbered, with the film name and roll details |

Photos are processed one at a time so the phone's memory is never holding more than one
full-size image.

### Film recipes

Each film is one small, human-readable settings file — no programming needed to tweak a look.
Illustrative sketch only:

```json
{
  "name": "Kodak Portra 400",
  "type": "colour-negative",
  "tone":   { "contrast": 0.85, "highlight_rolloff": 0.7, "shadow_lift": 0.03 },
  "colour": { "saturation": 0.9, "warmth": 0.04,
              "shadow_tint": "green-cyan", "highlight_tint": "warm" },
  "grain":  { "amount": 0.35, "size": 1.2 }
}
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

### How the app reaches your phone

This repository is public, so GitHub can host the Lab as a web page for free (a feature called
GitHub Pages). You would open the link once in Chrome and choose "Add to Home screen"; after that
it works without an internet connection. The page contains only the app — your photos are never
sent to it. Switching GitHub Pages on is a setting in your repository that I'll ask you about
when we get there.

### One film catalogue, two consumers

The list of films lives in **one** place in this repository. The camera's `FILMS.LUA` is
generated from it, and the Lab reads the same catalogue. This prevents the camera and the Lab
disagreeing about what `PORTRA400` means. A ready-to-copy "card folder" is kept in the repository
so that setting up the SD card is just copying files — no tools to run on your side.

## Testing without the camera

Three kinds of virtual test, covered in more detail in the feasibility assessment:

1. **The Lab** is tested here in an emulated phone browser, automatically, and by you on your real
   phone straight away — it never needs the camera.
2. **The camera script's logic** runs in a **simulator**: a stand-in that pretends to be CHDK
   ("a shot was taken", "the user pressed SET", "the battery just died"). CHDK's own source code
   includes a desktop build of the exact Lua engine the camera uses (whole numbers only, same
   file functions), intended for testing scripts off-camera. The simulator supplies the
   camera-specific functions around it.
3. **The whole chain**: the simulator "shoots" a roll using stand-in photos and produces the same
   folder layout a real card would have; the Lab then develops it.

What no virtual test can show is how the real camera *behaves* — shutter feel, screen flicker, and
how Canon's firmware reacts to files being moved. I found no emulator that can run the A590's
firmware. Those answers wait for the camera.

## Repository layout (proposed)

```
docs/            these planning documents
camera/          Lua scripts for the SD card
camera/tests/    the small on-camera test scripts
films/           the film catalogue and recipe files
lab/             the Film Lab web app (HTML + JavaScript)
sim/             the camera simulator and automated tests
card/            ready-to-copy SD card contents
```
