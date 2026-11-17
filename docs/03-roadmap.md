# 3. Development roadmap

Small milestones, each ending in something you can see working. We finish and check one before
starting the next. Nothing here has been started.

The roadmap is in two phases because the camera hasn't arrived yet:

- **Phase 1 — before the camera arrives.** Everything that can be built and tested virtually or on
  your phone. This is more than half the project.
- **Phase 2 — with the camera.** Install CHDK, find out how the real camera behaves, and connect
  the two halves.

| # | Milestone | Needs | Result |
|---|---|---|---|
| **Phase 1** | | | |
| 1 | Film Lab v0.1 on your phone ✅ built, awaiting your test | Phone | One film look + contact sheet from photos you pick |
| 2 | Phone file handling | Phone, card reader | We know how rolls get in and out on your phone |
| 3 | Camera simulator + roll logic | Nothing | The camera script's "brain" proven virtually |
| 4 | Virtual end-to-end | Phone | A simulated roll developed on your phone |
| 5 | Ten film recipes | Phone | Ten distinct looks with grain |
| 6 | Formats and multiple exposures in the Lab | Phone | 3:2, half-frame and blended frames |
| **Phase 2** | | | |
| 7 | Camera check and CHDK install | Camera — **needs your approval** | CHDK running on your A590 |
| 8 | On-camera test bench | Camera | We know what the camera really does |
| 9 | Camera v0.1: "one roll" | Camera | A real counter that runs 1→36 and stops |
| 10 | **Real end-to-end — the working prototype** | Camera, phone | Load → shoot → develop → contact sheet |
| 11 | Lock-down | Camera | No review, locked settings, starts by itself |
| 12 | Camera-side formats and double exposures | Camera | Framing guides; double-exposure control |
| 13 | Tuning and polish | Camera, phone | Recipes tuned on real A590 photos; user guide |
| — | Stretch experiments | Camera | Optional extras |

If the camera arrives part-way through Phase 1, we do Milestones 7 and 8 straight away — they
answer the questions that shape everything else — and then return to where we were.

---

# Phase 1 — before the camera arrives

## Milestone 1 — Film Lab v0.1 on your phone

The smallest useful Lab: open it on your phone, pick a few photos, and get them back developed
with **one** recipe (Portra 400), cropped to 3:2, with a plain contact sheet.

- **Me:** build it and test it here in an emulated phone browser.
- **You:** switch on GitHub Pages for the repository (I'll explain the setting), open the link on
  your phone, add it to your home screen, and develop a handful of ordinary phone photos.
- **Done when:** you have developed photos and a contact sheet on your own phone.

**Status:** built and passing its automated tests in an emulated phone. Setup steps are in
[guide-film-lab.md](guide-film-lab.md). Beyond the plan, v0.1 already has light grain (scaled to
the photo's size), "hold to see original", and works offline; Milestone 5 refines grain and adds
halation.

## Milestone 2 — Phone file handling

Small checks of how your particular phone deals with files, because this varies between Android
versions (tests P1–P5 in the feasibility assessment).

- Does the phone read a small SD card through a USB-C reader?
- Can the Lab take a whole folder in one go, or do we select files?
- Can it save a named folder, or do we save a ZIP?
- How long does a 36-photo roll really take? Does the app keep working offline?

- **Done when:** the Lab's import and save steps are settled for your phone.

## Milestone 3 — Camera simulator and roll logic

The camera script's "brain", running virtually. No screen design or button feel yet — those wait
for the real camera.

- The roll state machine: no film → shooting → finished; rewind early.
- Film loading, the lock, frame counting, the roll manifest, roll folders.
- Recovery when power is lost at the worst moments (mid-shot, mid-save).
- Automated tests that "shoot" hundreds of simulated rolls and check the bookkeeping.

- **Me:** build the simulator and the logic, and show you the test results in plain language.
- **Done when:** the simulated camera survives every power-loss scenario with the count and
  manifest correct.

## Milestone 4 — Virtual end-to-end

The simulator "shoots" a roll using stand-in photos and produces exactly the folder layout a real
card will have. You copy that folder to your phone and develop it.

- The Lab reads the manifest and picks the film automatically.
- The developed roll gets its proper name (`2026-11-20 Roll 007 - Portra 400`).

- **Done when:** you develop a simulated roll on your phone and the contact sheet shows the right
  film, frame numbers and roll details.

## Milestone 5 — Ten film recipes

- Add grain and halation to the Lab.
- Write all ten recipes.
- A "test strip": one photo developed with every film, on one sheet, for comparing.

Final tuning waits for real A590 photos (Milestone 13), because the look depends on what the
sensor produces. If you can find a few full-size sample photos taken with an A590, we can start
closer to the mark.

- **Done when:** you can tell the films apart on the test strip.

## Milestone 6 — Formats and multiple exposures in the Lab

- Half frame: crop to upright frames and pair them side by side.
- Double and multiple exposures: blend the captures the manifest says belong to one frame.
- Tested with simulated rolls that include these.

- **Done when:** a simulated half-frame roll and a simulated roll containing a double exposure
  both develop correctly.

---

# Phase 2 — with the camera

## Milestone 7 — Camera check and CHDK install

No project code. This is the step that first touches the camera, so **I will explain each action
and its risk and wait for your go-ahead before you do it.**

1. Check the firmware version (a harmless built-in Canon feature: an empty file on the card plus a
   button combination shows the version). **If it is not 1.00E or 1.01B, we stop and reassess.**
   This is worth doing the day the camera arrives.
2. Read the CHDK wiki page for the A590 together for any camera-specific warnings.
3. Set aside a dedicated SD card (2 GB or smaller) with nothing you want to keep on it.
4. Download the matching CHDK 1.6.1 build and prepare the card on your Windows PC.
5. Start CHDK; learn ALT mode; run one of the example scripts that ships with CHDK.
6. Set Canon's own menu options we depend on (Review: Off, and others noted during setup).

- **Done when:** the CHDK start-up message appears at power-on, and you have run a bundled script
  and stopped it again.

## Milestone 8 — On-camera test bench

A handful of tiny scripts, each answering one question from the feasibility assessment (T3–T12).
Each writes its findings to a text file on the card.

- **Me:** write the test scripts, with instructions for each.
- **You:** run them one at a time, send me the result file and tell me what you saw.
- **Done when:** results are recorded in this repository and we have decided:
  - the control style (script owns buttons vs. background supervisor),
  - how photos are hidden (moved after each shot vs. at roll end),
  - how the counter is displayed.

## Milestone 9 — Camera v0.1: "one roll"

The simulated logic from Milestone 3, connected to the real camera. One hard-coded film, 36
exposures, no menus.

- **Done when:** you shoot 36 frames, the camera refuses the 37th, and a power-cycle mid-roll
  keeps the count.

## Milestone 10 — Real end-to-end (the working prototype)

- Film-loading menu on the camera: choose film, length, format.
- Shoot a real roll; put the card in the phone; develop it.

- **Done when:** you load a film, shoot the whole roll, develop it, and open the contact sheet —
  without me.

## Milestone 11 — Lock-down

- The script starts by itself at power-on.
- Photos are hidden from playback, during the roll and after it is finished.
- Buttons that aren't part of the shooting interface do nothing.
- ISO and white balance are locked to the film.
- Rewind-early flow with confirmation.

- **Done when:** you try to review, delete, or change film mid-roll using only the camera's
  controls, and can't.

## Milestone 12 — Camera-side formats and double exposures

- 3:2 framing lines and the half-frame guide on the LCD; counter runs to 48/72 for half frame.
- A button gesture that marks "the next shot lands on the same frame".

- **Done when:** a real half-frame roll and a real double exposure develop correctly.

## Milestone 13 — Tuning and polish

- Recipes tuned against real A590 photos, including how grain sits on the sensor's own noise.
- Contact sheet design (film-edge markings, frame numbers, roll details).
- Screen design, wind-on sound, roll-finished feedback.
- Awkward situations: full card, wrong mode-dial position, low battery.
- A plain-language user guide.

## Stretch experiments (optional, each needs its own go-ahead)

- In-camera tone curves via CHDK (test T13).
- In-camera double exposure via RAW merge and develop (test T14).
- RAW capture for more highlight latitude.
- Date imprint, film borders and sprocket holes in the Lab.
- Half-frame masking burned in on the camera.
