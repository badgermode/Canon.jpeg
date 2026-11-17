# 1. Technical feasibility assessment

*Investigated 17 November 2026. No code has been written and nothing has been done to the camera.*

## The short answer

**Yes, this project is buildable** — but as two cooperating parts, not one:

1. **The camera** (CHDK + a Lua script) handles the *experience*: loading a film, locking it in,
   counting exposures, hiding your photos until the roll is done, and recording what you shot.
2. **The Film Lab** (a small program on your computer) handles the *look*: it "develops" a finished
   roll by applying the film recipe, grain, half-frame layout and double exposures, and produces the
   named roll folder and contact sheet.

The split is forced by the hardware. A CHDK script cannot reach into the camera's JPEG engine or
edit a finished JPEG, and the camera's processor and memory are far too small to do film
simulation in a script. Happily, the split matches how film actually works: you shoot the roll,
you can't see anything, you take it to the lab, and you get back photographs and a contact sheet.

## How I investigated, and how far to trust it

| Source | What it told me |
|---|---|
| **CHDK 1.6.1 source code** (a mirror of the official repository) — I read the A590 port and the Lua engine directly | Exactly which firmware versions are supported, which buttons CHDK can see, and the complete list of Lua functions that exist |
| Canon specifications and published reviews | The camera's hardware |
| Web search summaries of the CHDK wiki and FAQ | Installation method, safety statements |

Two honest limits:

- **I could not open the CHDK wiki or forum pages directly** (this session's network settings block
  them; I only saw search-result summaries). The A590 wiki page or forum thread may list quirks I
  have not read. We should read that page together before installing anything.
- **I have no camera.** Reading source code proves a function *exists*; it does not prove it
  *behaves well on your A590*. That is what the testing milestone is for.

Throughout these documents I use three labels:

- ✅ **Confirmed** — read directly in the CHDK source for the A590, or in Canon's specifications.
- 🧪 **Needs testing** — the function exists, but only your camera can tell us whether it works
  the way we need.
- ❌ **Not possible** — ruled out by the hardware or by how CHDK works.

## The camera: confirmed facts

| Item | Value | Why it matters to us |
|---|---|---|
| Sensor | 8.0 MP 1/2.5" CCD; JPEGs are 3264 × 2448 (4:3 shape) | 35mm film is 3:2, so "full frame" means a small crop |
| Lens | 35–140mm equivalent, f/2.6–5.5, 8 zoom steps, real aperture blades | — |
| Shutter / ISO | 15s to 1/2000s; ISO 80, 100, 200, 400, 800, 1600 | Film speeds map neatly to ISO. There is no ISO 50 (Velvia) — 80 is the closest |
| Viewfinder | **Optical viewfinder** plus 2.5" LCD | You can shoot with the screen off, like a real point-and-shoot |
| Record/Playback | A **physical slide switch**, not a button | A script cannot "swallow" it — see *No review* below |
| Shooting modes | Top dial: Auto, Easy, P, Tv, Av, M, scenes, movie | The dial is physical too; the script can only detect it |
| Processor / OS | DIGIC III, DryOS | Old, slow, little free memory |
| Image formats | JPEG only (CHDK can add RAW) | JPEG-first suits your preference |
| Colour controls | "My Colors": Off, Vivid, Neutral, Sepia, B&W, Custom | A small amount of in-camera look is possible |
| Storage | SD / SDHC / MMC | See card notes in the requirements document |
| Power | 2 × AA | Rechargeable NiMH strongly recommended |

## CHDK on the A590: confirmed facts

- ✅ **The A590 IS is a supported, non-beta camera** in the current stable CHDK (1.6.1).
- ✅ **Only firmware versions 1.00E and 1.01B are supported.** A 1.00C version of the camera
  apparently exists and has no CHDK build. *Checking your firmware version is the first thing to do.*
- ✅ CHDK is **loaded from the SD card into the camera's temporary memory** each time it powers on.
  It does not overwrite Canon's firmware. Remove the card and the camera is stock again.
- ✅ The camera can only *start up* CHDK from a **FAT16**-formatted card partition (true of all
  Canon cameras from before 2011). In practice: use a card of 2 GB or less to keep things simple.
- ✅ Buttons a script can read: up, down, left, right, FUNC/SET, shutter half-press and full-press,
  zoom in/out, MENU, DISP, Print, and the erase button.
- ✅ CHDK's own "ALT" button on this camera is **Print** (can be changed to DISP).
- ✅ Scripts are written in **Lua 5.1**, with one important difference: **whole numbers only**
  (no decimals — `7 / 2` gives `3`).

## What a Lua script can do

All ✅ confirmed to exist in CHDK 1.6.1. Whether each behaves on the A590 is 🧪.

| Capability | Used for |
|---|---|
| Read and write text files; create folders; **move/rename files**; list folders | Roll state, roll folders, the roll manifest, hiding photos |
| Read every button; block buttons from reaching Canon's firmware; "press" buttons itself | Minimal interface, locking out menus |
| Take a photo; read the shot counter; know when the camera is busy | Counting exposures |
| Read and set camera properties: ISO, white balance, My Colors, flash, quality, exposure compensation | Locking the film's speed and colour balance |
| Draw text, lines and boxes on the LCD | Exposure counter, film name, framing guides, menus |
| Turn the LCD or its backlight off | "Viewfinder-only" shooting; hiding playback |
| Detect record vs playback mode; request a mode change | Enforcing no-review |
| **Start automatically at power-on** | The camera *becomes* the film camera when switched on |
| Play sounds, blink LEDs, read the clock and battery | Feedback, timestamps |
| Keep running in the background while Canon's firmware handles the buttons normally | An alternative, more responsive control style |
| Enable CHDK RAW saving, merge RAW files (sum/average), "develop" a RAW into a JPEG, apply tone curves to the sensor data | Experimental in-camera looks and double exposures (stretch goals) |

## What a Lua script cannot do

- ❌ **Edit a JPEG.** There is no access to the JPEG's pixels, and no way to re-save one.
- ❌ **Do heavy maths.** Whole numbers only, a 2008-era processor, and very little free memory
  (amount to be measured 🧪). Touching 8 million pixels one at a time in Lua would take far too
  long to be usable.
- ❌ **Block physical controls**: the record/playback switch, the mode dial, the power button, the
  battery door, the card slot.
- ❌ **Draw permanently.** Canon's firmware repaints the screen whenever it likes; a script has to
  keep redrawing its overlay.
- ❌ **Change what the optical viewfinder shows.**

## Feature-by-feature verdict

| Your feature | Verdict | How |
|---|---|---|
| Virtual film loading | ✅ Feasible | Script menu at start-up when no roll is loaded |
| Selectable film stocks / recipes | ✅ Feasible | Chosen on camera, recorded in the roll's manifest, rendered by the Lab |
| Roll lengths (24, 36, …) | ✅ Feasible | Stored in the roll state file |
| Film locked until roll is finished | ✅ Feasible | State file survives power-off; script refuses to load another film mid-roll |
| Film changes camera behaviour | ✅ Feasible 🧪 | Lock ISO to the film's speed; lock white balance (daylight, or tungsten for CineStill 800T) |
| Visible exposure counter | ✅ Feasible 🧪 | Drawn on the LCD. May flicker; not visible when the LCD is off |
| Recipe name visible on screen | ✅ Feasible 🧪 | Same overlay |
| No review while shooting | ✅ Very likely 🧪 | Three layers — see below |
| No deleting individual photos | ✅ Follows from no-review | Hidden photos can't be selected; erase key blocked |
| Minimal shooting interface | ✅ Feasible 🧪 | Script blocks every button it doesn't need; CHDK's own on-screen clutter switched off |
| Full-frame format | ✅ Feasible | Lab crops 4:3 to 3:2; framing lines on the LCD 🧪 |
| Half-frame format | ✅ Feasible | Counter runs to double length (48/72); portrait framing guide on LCD 🧪; Lab crops and pairs frames side-by-side |
| Double / multiple exposures | ✅ Feasible **in the Lab** | Camera records "these captures are one frame" and doesn't advance the counter; Lab blends them like light adding up on film |
| …blended inside the camera | 🧪 Uncertain, slow | Possible in theory via CHDK RAW merge + RAW develop. Stretch goal only |
| Finished roll in its own named folder | ✅ Feasible | Short folder name on the card (e.g. `R0007`); descriptive name on the computer |
| Contact sheet | ✅ Feasible **in the Lab** | ❌ not on the camera |
| Ten distinct film looks | ✅ Feasible **in the Lab** | Full control of colour, contrast, saturation, grain, halation |
| Film look applied inside the camera | ❌ / 🧪 Very limited | Only Canon's My Colors, white balance, and experimental CHDK curves |
| RAW files | Not needed | JPEG-only is the plan. RAW stays an optional experiment |

### "No review" in more detail

Because playback is a physical switch, a script can't simply ignore it. Instead, three layers:

1. **Canon's own "Review" setting is switched off** (a one-time menu setting), so the photo doesn't
   flash up after each shot.
2. **Each photo is moved out of the folder Canon's playback looks in**, into the roll's own folder.
   Playback then finds nothing to show. 🧪 *This is the most important thing to test:* Canon's
   firmware keeps its own bookkeeping about files, and we need to see how it reacts.
3. **If the switch is moved to playback mid-roll**, the script notices and covers or blanks the
   screen. 🧪

If layer 2 misbehaves, layers 1 and 3 still deliver the experience. None of this is tamper-proof —
you can always pull the card and put it in a computer. The aim is that *the camera* never shows you
the photo, not that it is impossible to cheat.

## Three ways to get a film look, compared

| Approach | Quality | Effort | Verdict |
|---|---|---|---|
| **A. Film Lab on the computer** — process the JPEG after the roll is finished | High. Full control over tone curves, colour, saturation, grain, halation | Moderate; can be built and tested without the camera | **Recommended. The plan is built on this.** |
| **B. Canon settings in-camera** — lock white balance, optionally My Colors contrast/saturation | Low. A handful of coarse steps; cannot tell Portra from Pro 400H | Small | Use **white balance lock only**, because it is authentic: daylight film under indoor bulbs *should* go orange |
| **C. CHDK curves in-camera** — tone curves applied to the sensor data before Canon makes the JPEG | Unknown. Works on raw sensor colours, so hard to design for | High; needs lots of on-camera trial | Stretch experiment, after everything else works |

One known weakness of approach A: a JPEG has less highlight detail to work with than real negative
film, which is famous for forgiving overexposure. The Lab can imitate the *look* of film highlights
but cannot recover detail the JPEG has already thrown away. A small built-in underexposure, or
optional RAW capture later, can soften this.

## What must be tested on your camera

Each of these becomes a tiny, single-purpose test script in Milestone 2. You run it, it writes
PASS/FAIL details to a text file, and you send me the file.

| # | Question | If it fails |
|---|---|---|
| T1 | Is the firmware 1.00E or 1.01B? | Stop and reassess — CHDK may not be usable |
| T2 | Does CHDK start, both manually and automatically from a locked card? | Troubleshoot card preparation |
| T3 | How much free memory is there for scripts? | Keep the script small; split into parts |
| T4 | Does a script start by itself at power-on? | User starts it with two button presses |
| T5 | Script-controlled shooting: does half-press focus and full-press shoot feel responsive? | Use background style (T6) |
| T6 | Background style: can the script supervise while Canon handles the buttons? | Use script-controlled style (T5) |
| T7 | Do ISO and white-balance locks actually take effect in the saved photo, and stay put? | Re-apply before every shot; or instruct the user to set them |
| T8 | Can a photo be moved out of Canon's folder straight after a shot without upsetting the camera? Does file numbering continue correctly? | Move files only when the roll ends; rely on layers 1 and 3 for no-review |
| T9 | Can the script detect playback mode and cover/blank the screen? | Rely on hidden files alone |
| T10 | Does the on-screen counter stay visible without bad flicker? | Show it briefly after each shot instead of continuously |
| T11 | Power off mid-roll, power on: does the roll resume with the right count? | Fix state-saving logic (this one must work) |
| T12 | How long between shots with the script running? | Simplify the per-shot work |
| T13 | *(stretch)* Do CHDK curves visibly change the JPEG? | Drop approach C |
| T14 | *(stretch)* Does RAW merge + develop produce a usable in-camera double exposure, and how slow is it? | Keep double exposures in the Lab only |

## Related work

A CHDK fork called *CHDK Rewired* performs true in-camera multiple exposures with a live "ghost"
preview. It does this with custom compiled code, not Lua, and supports the A430/A460/A470/A480/
A540/A640 — **not the A590**. It shows the idea is achievable on this family of cameras, but I am
not assuming any of it carries over; porting it would be a separate, much riskier project.

## Bottom line

- Everything on your list is achievable **except** applying the full film look, the contact sheet,
  and exposure blending *inside the camera* — those move to the Film Lab.
- The biggest unknowns are behavioural, not conceptual: hiding files from Canon's playback (T8),
  how shooting feels under script control (T5/T6), and overlay flicker (T10). Each has a fallback.
- Nothing in the plan requires modifying Canon's firmware, custom-compiled code, or CHDK's
  "native call" features.
