# Film catalogue

Each film is one small settings file. The same file tells the **camera** how to behave (ISO,
white balance) and tells the **Film Lab** how to develop the photos.

- `index.json` lists the films that are available.
- `portra400.json` is the first recipe. More arrive in Milestone 5.

You can change a recipe in any text editor. No programming is needed — just keep the commas,
brackets and quote marks where they are.

## What each setting means

### About the film

| Setting | Meaning |
|---|---|
| `code` | Short name used on the camera and in roll manifests, e.g. `PORTRA400` |
| `name` | Full name shown in the Lab and on contact sheets |
| `short_name` | Upper-case name for the camera screen and film-edge printing |
| `type` | `colour-negative`, `slide` or `black-and-white` |
| `description` | One line describing the look |

### `camera` — how the camera behaves with this film loaded

| Setting | Meaning |
|---|---|
| `iso` | The camera's ISO is locked to this (the film's speed) |
| `white_balance` | `daylight` or `tungsten`. Locked, as real film can't adapt to the light |

### `lab` — how the photos are developed

Applied in this order:

| Setting | Meaning | Neutral value |
|---|---|---|
| `white_balance.warmth` | Positive = warmer (more red, less blue). Negative = cooler | `0` |
| `white_balance.tint` | Positive = greener. Negative = more magenta | `0` |
| `colour_mix` | How much of each colour feeds into each colour. Row 1 is red, row 2 green, row 3 blue. `[1.02, -0.01, -0.01]` in the red row means "red, slightly stronger, with a pinch less of green and blue". Rows should add up to about 1 | `[[1,0,0],[0,1,0],[0,0,1]]` |
| `tone.curve` | The main tone curve: a list of `[in, out]` points from 0 (black) to 1 (white), like the curves tool in a photo editor. `[0, 0.035]` lifts black to a soft, slightly faded black. `[1, 0.955]` stops white just short of pure white | `[[0,0],[1,1]]` |
| `tone.red`, `tone.green`, `tone.blue` | Optional extra curves for one colour layer. `[0.5, 0.51]` in `red` adds a touch of red to the mid-tones | `[[0,0],[1,1]]` |
| `shadows.hue`, `shadows.amount` | A colour cast in the dark areas. Hue is a position on the colour wheel: 0 red, 30 orange, 60 yellow, 120 green, 180 cyan, 240 blue, 300 magenta. Amount 0.02 is subtle; 0.06 is strong | `amount: 0` |
| `highlights.hue`, `highlights.amount` | The same, for the bright areas | `amount: 0` |
| `saturation` | Colour strength. Below 1 = softer, above 1 = more vivid | `1` |
| `grain.amount` | How strong the grain is. 0.2 = fine, 0.6 = obvious, 1.0 = heavy | `0` |
| `grain.size` | How large the grain clumps are. 1 = finest; 2 to 3 = coarse | `1` |

Black-and-white films (`"type": "black-and-white"`) ignore the colour settings after the colour
mix: the colour mix then decides how each colour turns into grey, like a filter on the lens.
