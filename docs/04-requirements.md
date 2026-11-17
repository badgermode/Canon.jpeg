# 4. Software and hardware requirements

## Hardware

| Item | Needed? | Notes |
|---|---|---|
| Canon PowerShot A590 IS | Required | **Firmware must be 1.00E or 1.01B.** Checked in Milestone 1 before anything else |
| SD card, **2 GB or smaller** | Required | Must be plain "SD", not SDHC, to keep setup simple. Its write-protect **lock tab must work** — CHDK's auto-start depends on it. Dedicated to this project; it will be erased |
| SD card reader | Required | Built into the computer or USB |
| 2 × AA **NiMH rechargeable** batteries + charger | Strongly recommended | Alkalines drain fast in this camera. A spare charged pair is worth having |
| Computer | Required | Windows, macOS or Linux — tell me which, as setup steps differ |
| The camera's USB cable | Optional | Allows loading and running test scripts over USB without swapping the card. Extra setup; only worth it if card-swapping becomes tedious |
| Grey card or colour chart | Optional | Helps when tuning film recipes; not essential |

### About the SD card

- The A590 can only *start* CHDK from a FAT16-formatted partition, and FAT16 comfortably covers
  cards up to 2 GB. A 2 GB card holds roughly 500 full-quality photos — about fourteen 36-exposure
  rolls.
- Larger SDHC cards can be made to work (a small start-up partition plus a large photo partition —
  the A590's CHDK port supports this), but it is fiddlier to set up and some computers only show
  one of the partitions. Not recommended to begin with.
- Small old SD cards are inexpensive second-hand. Check the lock tab isn't loose or missing.

## Software

### For the camera

| Item | Purpose | Notes |
|---|---|---|
| **CHDK 1.6.1 (stable)** for the A590, matching your firmware version | Runs our script on the camera | Free. Downloaded from the official CHDK build server linked from the CHDK wiki. Use the "complete" package. I will give you the exact link once we know your firmware version |
| A card-preparation tool | Makes the SD card able to start CHDK | Which tool depends on your computer. On Windows, the CHDK wiki currently recommends *CHIMP* (the older *STICK* reportedly fails on Windows 11). To be confirmed in Milestone 1 |

### For your computer

| Item | Purpose | Notes |
|---|---|---|
| **Python 3** (3.10 or newer) | Runs the Film Lab | Free. I'll walk you through installing it |
| Python libraries: **Pillow** and **NumPy** | Image handling and fast pixel maths | Installed with one command |
| A plain text editor (e.g. VS Code, Notepad++) | Viewing/editing scripts and recipe files | Free |
| GitHub access to this repository | Getting the project files | You already have this |
| *chdkptp* | Optional USB control of CHDK | Only if you choose to use the USB cable route |

### What I use on my side (nothing for you to install)

- The same Python and libraries, to build and test the Film Lab.
- A desktop Lua 5.1 engine, to run the camera script in the simulator.
- The CHDK source code, as the reference for what the camera can do.

## One-time camera settings

Set once in Canon's own menus during Milestone 1 (the exact list will be confirmed then):

- **Review: Off** — so photos don't flash up after each shot.
- **File numbering: Continuous** — so photo numbers don't restart when the folder is emptied.
- **Mode dial on P** — gives the script control over ISO and white balance.
- Image size **Large**, quality **Superfine**.
- Date and time set correctly (roll folders are timestamped).

## Things you do *not* need

- No soldering, no opening the camera, no extra electronics.
- No Canon firmware update.
- No paid software.
- No RAW converter.
