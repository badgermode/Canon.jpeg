# Digital Film Camera

Turning a Canon PowerShot A590 IS into the digital equivalent of a 35mm point-and-shoot: you load
a virtual roll of film, the film is locked in until the roll is finished, and you don't see a
single photograph until the roll has been developed.

The limitations are the point.

## Status

**Planning complete; nothing built yet.** The camera has been bought but has not arrived, so the
first phase of work is everything that can be built and tested without it.

## How it will work

- **On the camera** — [CHDK](https://chdk.fandom.com/wiki/CHDK) plus a Lua script provide the
  experience: load a film, lock it, count exposures, hide the photos, record the roll.
- **On your Android phone** — a "Film Lab" web app develops each finished roll: it applies the
  film's look, handles half-frame and double exposures, and produces a named roll folder with a
  contact sheet. The SD card goes from the camera into a USB-C reader on the phone.

## Planning documents

1. [Technical feasibility assessment](docs/01-feasibility.md) — what the A590 and CHDK can and
   cannot do; what is confirmed, what needs testing, and what can be tested without the camera.
2. [Proposed software architecture](docs/02-architecture.md) — the two halves and how they fit.
3. [Development roadmap](docs/03-roadmap.md) — small milestones in two phases: before the camera
   arrives, and with the camera. The working prototype is Milestone 10.
4. [Software and hardware requirements](docs/04-requirements.md)
5. [Difficult or impossible features, and risks](docs/05-difficult-features.md)

## Decisions made

| Question | Decision |
|---|---|
| Where does developing happen? | On an Android phone. Windows PC is used for setup only |
| When a roll is finished, are the photos viewable on the camera? | No — they stay hidden until developed |
| Can a roll be rewound early? | Yes, with a confirmation step; unused frames are lost |
| Camera ISO | Locked to the film's ISO |
| Shape of a full-frame photo | Cropped to 35mm's 3:2 |

## Next step

Milestone 1: Film Lab v0.1 on your phone — one film look and a contact sheet from photos you pick.
