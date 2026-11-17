# 4. Software and hardware requirements

## Hardware

| Item | Needed? | Notes |
|---|---|---|
| Canon PowerShot A590 IS | Required (on its way) | **Firmware must be 1.00E or 1.01B.** Checked the day it arrives, before anything else |
| SD card, **2 GB or smaller** | Required | Must be plain "SD", not SDHC, to keep setup simple. Its write-protect **lock tab must work** — CHDK's auto-start depends on it. Dedicated to this project; it will be erased |
| 2 × AA **NiMH rechargeable** batteries + charger | Strongly recommended | Alkalines drain fast in this camera. A spare charged pair is worth having |
| Android phone | Required | Runs the Film Lab. A reasonably recent version of Chrome is needed |
| **USB-C SD card reader** for the phone | Required | A small adapter that lets the phone read the camera's card. Check it takes full-size SD cards, and that your phone's port is USB-C |
| Windows PC with an SD card slot or reader | Required, for setup only | Preparing the SD card and copying CHDK and our script onto it. The USB-C reader may also work on the PC |
| The camera's USB cable | Optional | Allows loading and running test scripts over USB without swapping the card. Extra setup; only worth it if card-swapping becomes tedious |
| Grey card or colour chart | Optional | Helps when tuning film recipes; not essential |

Nothing needs buying before the camera arrives except, if you don't already have them, the small
SD card, the USB-C card reader and rechargeable batteries. The card reader is useful straight
away for Milestone 2.

### About the SD card

- The A590 can only *start* CHDK from a FAT16-formatted partition, and FAT16 comfortably covers
  cards up to 2 GB. A 2 GB card holds roughly 500 full-quality photos — about fourteen 36-exposure
  rolls.
- Larger SDHC cards can be made to work (a small start-up partition plus a large photo partition —
  the A590's CHDK port supports this), but it is fiddlier to set up and phones and PCs may only
  show one of the partitions. Not recommended to begin with.
- Small old SD cards are inexpensive second-hand. Check the lock tab isn't loose or missing.

## Software

### For the camera

| Item | Purpose | Notes |
|---|---|---|
| **CHDK 1.6.1 (stable)** for the A590, matching your firmware version | Runs our script on the camera | Free. Downloaded from the official CHDK build server linked from the CHDK wiki. Use the "complete" package. I will give you the exact link once we know your firmware version |
| A card-preparation tool for Windows | Makes the SD card able to start CHDK | The CHDK wiki currently recommends *CHIMP* (the older *STICK* reportedly fails on Windows 11). To be confirmed when we get there |

### For your phone

| Item | Purpose | Notes |
|---|---|---|
| **Chrome** | Runs the Film Lab | Already on most Android phones. Keep it updated — newer versions handle folders better |
| The Film Lab itself | Develops your rolls | Not an app-store install: you open a link once and choose "Add to Home screen". Works offline afterwards |

### For your Windows PC

| Item | Purpose | Notes |
|---|---|---|
| A web browser | Downloading CHDK and the ready-made card files from this repository | — |
| A plain text editor (e.g. Notepad++) | Optional — for looking at scripts and recipe files | Free |

You do **not** need to install Python, Android Studio or any programming tools.

### For the repository

| Item | Purpose | Notes |
|---|---|---|
| **GitHub Pages** switched on | Hosts the Film Lab so your phone can open it | Free for public repositories, which this one is. A setting you change once; I'll explain it when we reach Milestone 1 |

### What I use on my side (nothing for you to install)

- An emulated phone browser, to build and automatically test the Film Lab.
- A desktop build of CHDK's Lua engine, to run the camera script in the simulator.
- The CHDK source code, as the reference for what the camera can do.

## One-time camera settings

Set once in Canon's own menus when CHDK is installed (the exact list will be confirmed then):

- **Review: Off** — so photos don't flash up after each shot.
- **File numbering: Continuous** — so photo numbers don't restart when the folder is emptied.
- **Mode dial on P** — in Auto, the camera chooses ISO and white balance itself; in P they can be
  set, which is what lets the film lock them.
- Image size **Large**, quality **Superfine**.
- Date and time set correctly (roll folders are timestamped).

## Things you do *not* need

- No soldering, no opening the camera, no extra electronics.
- No Canon firmware update.
- No paid software.
- No RAW converter.
