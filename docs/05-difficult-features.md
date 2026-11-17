# 5. Difficult or impossible features, and risks

Three lists: what cannot be done, what is hard or uncertain, and what carries risk and therefore
needs your approval first.

## A. Not possible on this camera

| Feature | Why not | What we do instead |
|---|---|---|
| Applying the full film look inside the camera | A script cannot reach Canon's JPEG processing or edit a saved JPEG, and the camera lacks the speed and memory to do it in a script | The Film Lab on your computer |
| Contact sheet made on the camera | Same reason — it would mean decoding and shrinking 36 JPEGs | The Film Lab |
| Seeing the film look on the LCD while composing | The live view comes straight from Canon's firmware | Accept it — a film camera's viewfinder doesn't show the film's look either |
| A live "ghost" of the first exposure when lining up a double exposure | Needs custom compiled code; exists in a CHDK fork for other models, not the A590 | Compose from memory, as on a film camera |
| Blocking the playback switch, mode dial or power button | They are physical controls outside CHDK's button handling | Detect them and respond (hide photos, blank the screen, show a warning) |
| A lock that can't be defeated | The card can always be taken out and read on a computer | Aim for "the camera never shows you", not "cheating is impossible" |
| Framing lines in the optical viewfinder | It is glass, not a screen | Framing guides on the LCD; or a DIY mask on the viewfinder window |
| True ISO 50 for Velvia | The sensor's lowest setting is ISO 80 | Shoot at 80 |
| Real film's forgiveness of overexposure | A JPEG clips bright areas for good; negative film keeps detail there | Imitate the look of film highlights; possibly a slight built-in underexposure; RAW as a later experiment |

## B. Difficult or uncertain

Ordered roughly by how much they could affect the design.

| Feature | The difficulty | Fallback |
|---|---|---|
| **Hiding photos from playback** | Moving files out of Canon's folder behind the firmware's back may confuse its file counting or numbering | Move them only when the roll ends; rely on Review-off and screen-blanking meanwhile |
| **Shutter feel under script control** | When the script owns the buttons it must pass on half-press and full-press itself; there may be a small lag | Background-supervisor style, where Canon handles the shutter natively |
| **A steady on-screen counter** | Canon's firmware redraws the screen and erases overlays; the script must keep redrawing, which can flicker | Show the counter briefly after each shot; or accept light flicker |
| **Locking ISO and white balance** | Settings can be set by a script, but the firmware may not always honour them or may revert | Re-apply before every shot; verify from the photo's own data in the Lab and warn |
| **Counter visibility with the LCD off** | Viewfinder-only shooting leaves nowhere to show the counter | Flash the counter on the LCD for a second after each shot; LED blinks near the end of the roll |
| **Power loss mid-shot** | Batteries can die while a photo or the state file is being written | Save state in a way that is never half-written; cross-check against real files at start-up |
| **Memory limits** | Free memory for scripts on the A590 is small (exact amount to be measured) | Keep the script lean; load parts only when needed |
| **Making ten films look genuinely different** | Film character is subjective, and I'm tuning by eye from each stock's reputation, not from measurements | Side-by-side test strips on your own photos; iterate with your feedback |
| **Convincing grain** | Real grain varies with brightness and colour layer; plain digital noise looks wrong. The sensor's own high-ISO noise and Canon's smoothing also interfere | Brightness-dependent synthetic grain; decide the ISO policy after test shots |
| **CineStill 800T halation** | The red glow should appear only around genuinely bright light sources | Detect clipped highlights and bloom them; needs tuning |
| **Half-frame framing** | The LCD guide is easy; the optical viewfinder shows the full frame | Shoot half-frame with the LCD, or learn the framing |
| **In-camera double exposure** | Theoretically possible by saving two RAW files, merging and "developing" them — slow, battery-hungry and unproven on the A590 | Blend in the Lab (the plan) |
| **Larger SD cards** | Need a two-partition layout | Use a 2 GB card |
| **Mode dial in the wrong position** | In Auto or scene modes the camera ignores ISO/white-balance settings | Detect and show "set dial to P" |
| **Wrong clock** | If the camera's small internal clock battery is dead, dates reset | Rolls are identified by number, not only by date |

## C. Risks, and what needs your approval

You asked me not to do anything risky without explaining it and getting your agreement. These are
the points where I will stop and ask.

### Things in the plan

| Action | Risk | Mitigation |
|---|---|---|
| **Installing CHDK** (Milestone 1) | **Low.** CHDK runs from the SD card in temporary memory and does not overwrite Canon's firmware; removing the card restores the stock camera. The CHDK project reports no verified cases of damage, but it comes with no warranty and is not endorsed by Canon | Use the official build for your exact firmware version. If the camera ever freezes: remove the batteries |
| **Preparing the SD card** | The card is **completely erased**. On a computer, choosing the wrong drive in a card tool could erase a different disk | Use a dedicated card. I'll give explicit "check the drive letter" steps |
| **Scripts that move and rename photo files** | A bug could misplace photos on the card | Dedicated card with nothing precious on it; the script never deletes; tested in the simulator first |
| **Scripts that operate the lens** (zoom) | CHDK's FAQ notes that damage, while unlikely, is theoretically possible through scripts or overrides that drive the camera beyond Canon's normal limits | We only pass on your own zoom presses, within Canon's normal range. No exposure or focus overrides beyond normal settings |
| **Running with the card's lock tab on** | None to the camera. It is simply how CHDK auto-starts; CHDK makes the camera ignore the lock so it can still save photos | — |

A note on wording: CHDK can be started from a Canon menu entry called **"Firm Update"**. Despite
the name, this does *not* update or replace the firmware — it loads CHDK temporarily. I'll point
this out again when we get there.

### Things deliberately *not* in the plan

I will not use any of these without a separate explanation and your explicit approval:

- **Custom-compiled CHDK builds or modules** (e.g. porting the multiple-exposure fork).
- **CHDK "native calls"** — scripts calling Canon's internal firmware functions directly. Off by
  default in CHDK, and the main way a script could do real harm.
- **Writing directly to camera memory** (`poke`).
- **Anything that writes to the camera's internal flash storage.**
- **Canon firmware updates** of any kind.

## What this means for expectations

- The **experience** (loading, locking, counting, waiting) lives on the camera and is very likely
  achievable in full.
- The **look** arrives when you develop the roll on your computer — never on the camera's screen.
- A few details (how photos are hidden, how the counter is displayed, how the shutter is driven)
  will be settled by testing on your camera, and each already has a fallback.
