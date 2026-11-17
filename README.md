# Digital Film Camera

Turning a Canon PowerShot A590 IS into the digital equivalent of a 35mm point-and-shoot: you load
a virtual roll of film, the film is locked in until the roll is finished, and you don't see a
single photograph until the roll has been developed.

The limitations are the point.

## Status

**Milestone 1 built — waiting for you to try it on your phone.** The camera has been bought but
has not arrived, so the first phase of work is everything that can be built and tested without it.

- **Film Lab v0.1** (in `lab/`): one film (Kodak Portra 400), 3:2 framing, grain, contact sheet,
  save as ZIP, works offline. Set it up with the [phone guide](docs/guide-film-lab.md).

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

## In this repository

| Folder | Contents |
|---|---|
| `docs/` | Planning documents and guides |
| `lab/` | The Film Lab web app (plain HTML and JavaScript) |
| `films/` | The film catalogue and recipes — [what each setting means](films/README.md) |
| `tests/` | Automated tests |

## Next step

Follow the [phone guide](docs/guide-film-lab.md) to switch on GitHub Pages, install the Lab, and
develop a test roll. Then Milestone 2: settling how rolls get in and out on your phone.
