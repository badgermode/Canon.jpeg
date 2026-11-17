# Film Lab tests

An automated end-to-end test that runs the Lab in an emulated Android phone (Pixel 7, Chrome).
You don't need to run these yourself — they're how I check the Lab before each change.

```
python3 tests/lab/make_fixtures.py OUT/photos     # awkward test photos (needs Pillow)
node tests/lab/e2e.mjs OUT/photos OUT/results       # needs Node.js + Playwright
```

What it checks: the front page opens the Lab; a roll develops; unreadable files are skipped and
noted; every frame is cropped to 3:2 and no larger than the A590's 3264 pixels; sideways-stored
photos come out upright; "hold to see original" works; the saved ZIP is valid and complete; the
Lab reopens with the phone offline; and nothing is logged as an error.
