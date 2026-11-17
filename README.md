# Digital Film Camera

Turning a Canon PowerShot A590 IS into the digital equivalent of a 35mm point-and-shoot: you load
a virtual roll of film, the film is locked in until the roll is finished, and you don't see a
single photograph until the roll has been developed.

The limitations are the point.

## Status

**Planning.** No code has been written and nothing has been done to the camera.

## How it will work

- **On the camera** — [CHDK](https://chdk.fandom.com/wiki/CHDK) plus a Lua script provide the
  experience: load a film, lock it, count exposures, hide the photos, record the roll.
- **On the computer** — a small "Film Lab" program develops each finished roll: it applies the
  film's look, handles half-frame and double exposures, and produces a named roll folder with a
  contact sheet.

## Planning documents

1. [Technical feasibility assessment](docs/01-feasibility.md) — what the A590 and CHDK can and
   cannot do; what is confirmed and what needs testing.
2. [Proposed software architecture](docs/02-architecture.md) — the two halves and how they fit.
3. [Development roadmap](docs/03-roadmap.md) — small milestones; the prototype is Milestone 5.
4. [Software and hardware requirements](docs/04-requirements.md)
5. [Difficult or impossible features, and risks](docs/05-difficult-features.md)

## Open questions

Each has a default I'll assume unless you say otherwise.

| # | Question | Default |
|---|---|---|
| 1 | Which computer do you use — Windows, Mac or Linux? | *(needed — no default)* |
| 2 | When a roll is finished, should the photos stay hidden until developed on the computer, or become viewable (unprocessed) on the camera? | Stay hidden until developed |
| 3 | Should you be able to "rewind early" and abandon the remaining frames? | Yes, with a confirmation step |
| 4 | Should the camera's ISO follow the film's real speed (authentic, but noisy at 400–800), or stay low with grain added in the Lab? | Follow the film's speed; revisit after test shots |
| 5 | Should "full frame" be cropped to 35mm's 3:2 shape, or keep the sensor's 4:3? | Crop to 3:2 |

## Next step

Milestone 0 (answer the questions above), then Milestone 1: checking the camera's firmware version
and installing CHDK — which starts only with your go-ahead.
