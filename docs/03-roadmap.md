# 3. Development roadmap

Small milestones, each ending in something you can see working. We finish and check one before
starting the next. Nothing here has been started.

**The working prototype is Milestone 5**: load a film on the camera, shoot the roll, develop it on
the computer, get a contact sheet. Everything after that is refinement.

| # | Milestone | Needs the camera? | Result |
|---|---|---|---|
| 0 | Decisions | No | Open questions answered |
| 1 | Camera check and CHDK install | Yes — **needs your approval** | CHDK running on your A590 |
| 2 | On-camera test bench | Yes | We know what the camera really does |
| 3 | Film Lab v0.1 | No | One film look + basic contact sheet from a folder of JPEGs |
| 4 | Camera v0.1: "one roll" | Yes | A counter that runs 1→36 and stops |
| 5 | **End to end — the prototype** | Yes | Load → shoot → develop → contact sheet |
| 6 | Lock-down | Yes | No review, locked settings, starts by itself |
| 7 | All ten film recipes | No | Ten distinct looks with grain |
| 8 | Full-frame and half-frame | Yes | Both formats working |
| 9 | Double and multiple exposures | Yes | Blended frames |
| 10 | Polish | Yes | Pleasant to use; written user guide |
| — | Stretch experiments | Yes | Optional extras |

Milestone 3 does not need the camera, so it can run alongside Milestones 1 and 2.

---

## Milestone 0 — Decisions

- **You:** answer the open questions in the README; tell me which computer you use
  (Windows / Mac / Linux).
- **Me:** read the CHDK wiki page and forum thread for the A590 with you (I could not open them
  from here) and note any camera-specific warnings.
- **Done when:** the questions are answered and there are no surprises on the A590 wiki page.

## Milestone 1 — Camera check and CHDK install

No project code. This is the step that first touches the camera, so **I will explain each action
and its risk and wait for your go-ahead before you do it.**

1. Check the firmware version (a harmless built-in Canon feature: an empty file on the card plus a
   button combination shows the version). **If it is not 1.00E or 1.01B, we stop and reassess.**
2. Set aside a dedicated SD card (2 GB or smaller) with nothing you want to keep on it.
3. Download the matching CHDK 1.6.1 build and prepare the card.
4. Start CHDK; learn ALT mode; run one of the example scripts that ships with CHDK.
5. Set Canon's own menu options we depend on (Review: Off, and others noted during setup).

- **Done when:** the CHDK start-up message appears at power-on, and you have run a bundled script
  and stopped it again.

## Milestone 2 — On-camera test bench

A handful of tiny scripts, each answering one question from the feasibility assessment (T3–T12).
Each writes its findings to a text file on the card.

- **Me:** write the test scripts, with instructions for each.
- **You:** run them one at a time, send me the result file and tell me what you saw.
- **Done when:** results are recorded in this repository and we have decided:
  - the control style (script owns buttons vs. background supervisor),
  - how photos are hidden (moved after each shot vs. at roll end),
  - how the counter is displayed.

The architecture document is updated with the decisions.

## Milestone 3 — Film Lab v0.1

- **Me:** build the smallest useful Lab: point it at a folder of JPEGs, get back a new folder of
  developed photos using **one** recipe (Portra 400), plus a plain contact sheet.
- **You:** install Python (I'll walk you through it), run the Lab on a few of your own A590
  photos, and tell me what you think of the look.
- **Done when:** you have run it yourself and have a developed folder and contact sheet.

## Milestone 4 — Camera v0.1: "one roll"

One hard-coded film, 36 exposures. No menus, no locking.

- The counter shows on screen and goes up with each shot.
- After frame 36 the shutter stops and the screen says the roll is finished.
- Switch off mid-roll, switch on, and the count is still right.

Built and tested in the simulator first, then on the camera.

- **Done when:** you shoot 36 frames, the camera refuses the 37th, and a power-cycle mid-roll
  keeps the count.

## Milestone 5 — End to end (the working prototype)

- Film-loading menu on the camera: choose film (three to start), length, format.
- Each roll gets its own folder and manifest on the card.
- The Lab reads the manifest and picks the matching recipe automatically.
- The Lab writes the named roll folder and contact sheet.

- **Done when:** you load a film, shoot the whole roll, develop it, and open the contact sheet —
  without me.

## Milestone 6 — Lock-down

- The script starts by itself at power-on.
- Photos are hidden from playback; moving the switch to playback mid-roll shows nothing.
- Buttons that aren't part of the shooting interface do nothing.
- ISO and white balance are locked to the film.
- Roll-finished flow, and "rewind early" if you want it.

- **Done when:** you try to review, delete, or change film mid-roll using only the camera's
  controls, and can't.

## Milestone 7 — All ten film recipes

- Add grain and halation to the Lab.
- Write the remaining nine recipes; tune all ten against your real photos, side by side.
- A "test strip" command: one photo developed with every film, on one sheet, for comparing.

- **Done when:** you can tell the films apart on the test strip and are happy with each.

## Milestone 8 — Formats

- Full frame: 3:2 crop in the Lab; framing lines on the LCD.
- Half frame: counter runs to 48/72; upright framing guide on the LCD; Lab crops and pairs frames.

- **Done when:** one roll of each format develops correctly.

## Milestone 9 — Double and multiple exposures

- A button gesture on the camera marks "the next shot lands on the same frame"; the counter does
  not advance.
- The Lab blends the captures into one frame.

- **Done when:** a roll containing a double exposure develops with the blended frame in the right
  place on the contact sheet.

## Milestone 10 — Polish

- Contact sheet design (film-edge markings, frame numbers, roll details).
- Screen design, wind-on sound, roll-finished feedback.
- A one-step "make card" tool and a plain-language user guide.
- Handling of awkward situations: full card, wrong mode-dial position, low battery.

## Stretch experiments (optional, each needs its own go-ahead)

- In-camera tone curves via CHDK (test T13).
- In-camera double exposure via RAW merge and develop (test T14).
- RAW capture for more highlight latitude.
- Date imprint, film borders and sprocket holes in the Lab.
- Half-frame masking burned in on the camera.
