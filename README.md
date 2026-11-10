# Snow Rider Controls

Version 0.7.3 adds named loadouts, hold-to-boost, live speed and height readouts, and double jump to the draggable control panel.

1. Reload **Snow Rider Controls** at `chrome://extensions`.
2. Refresh Snow Rider 3D on Hooda Math.
3. Use the **Snow Rider** panel in the top-left. Drag its header to move it; minimize it with the minus button or **Alt+S**. The panel scrolls on smaller game windows.

- **Invincibility:** initially ON. Switch it off for ordinary crash behavior.
- **Super jump:** initially ON at 4×. Choose jump strength from 1× to 20× in half steps. Use Up to jump.
- **Flight:** initially OFF. Hold Space to rise or Shift to descend, or hold the on-screen Rise/Descend buttons. Release to hover. Buttons also work with Enter/Space when focused. Turning flight OFF restores normal gravity and landing.
- **Forward speed:** 1× to 10,000×; use the slider, exact number or 1×/10×/100×/10,000× presets. It also works with flight OFF.
- **Hold-to-boost:** hold B or the Boost button to temporarily increase forward speed. Choose a boost speed up to 10,000×. Releasing restores your selected forward speed. Boost never slows you below that selected speed.
- **Double jump:** initially ON. With flight OFF, press Up or Space to jump, then press again in the air for one extra jump. Landing rearms it; the Jump again button also works.
- **Loadouts:** apply Cruise, Flight, Jump or Turbo presets, or save up to eight named custom loadouts. Saving an existing name updates it; custom loadouts can be deleted. Loadouts store protection, flight, jump, double jump and speeds.
- **Live readouts:** the current score appears at the top and in the minimized strip. It is read-only. Speed is measured in game units per second. Height is measured above your last grounded position and calibrates when grounded.
- **Rise / descend speed:** separately controls vertical movement, from 1 to 80, initially 16.
- **Normal ride:** disables flight, super jump, double jump, speed boosts, autopilot and invincibility.
- **Reset defaults:** restores the initial options. Ability toggles, strengths, speeds, panel position and collapsed state save across refreshes.

Shortcuts work when not typing into settings: **Alt+S** panel, **Alt+F** flight, **Alt+J** super jump, **Alt+I** invincibility, **Alt+A** experimental autopilot. Autopilot tuning and vision are in its collapsible advanced section; no reliable autonomous run has been demonstrated. Score-editing controls are absent.

Keep all seven extension files together: `manifest.json`, `content.js`, `panel.js`, `movement.js`, `loadouts.js`, `wasm-patch.js`, and `invincibility.js`.

Extreme forward speed keeps normal scoring. The game awards at most one point per Unity update, so moving faster cannot produce a million points in one minute.

## Compatibility and implementation

This targets [Hooda Math’s Snow Rider 3D](https://www.hoodamath.com/games/snowrider3d.html), build `SnowRider3D-gd-1`, revalidated on 2026-10-13. Before modifying anything, the extension checks the unpacked WebAssembly SHA-256:

`b6d05467e8594da11fcb844b51fe51db6d7765fd33b95b7568a1c778e2736efc`

A changed build loads normally and shows **Game version unsupported**. A patch failure also loads the original game and shows **Controls unavailable**. No game files are stored in the extension.

The patch adds one exported mutable global and a conditional guard inside `UnityEvent.Invoke` (wasm function 46030). It suppresses only `GameControl.OnEnd`, identified by the pointer chain at address 3362936, class static-fields offset 92, and event-field offset 60. Other events still run. Switching OFF restores the original behavior immediately. Both obstacle collisions and out-of-bounds movement invoke this same event; blocking only the sled’s `Die` method would miss the other death subscribers.

The early MAIN-world content script must run at `document_start`, before Unity compiles its WebAssembly. Import counts are parsed directly because Chrome restricts synchronous compilation of modules larger than 8 MB.

## Checks

Run the dependency-free tests with:

```sh
cd snow-rider-controls
node --test *.test.cjs
```

Tests execute actual WebAssembly fixtures, checking enabled/disabled behavior, preservation of other events, unsupported-build fallback, streaming loading, and Chrome’s synchronous compilation restriction.

Browser checks are in `qa/panel-check.cjs` (controlled heap and real UI) and `qa/game-check.cjs` (pass a local verified Unity fixture URL). They require Playwright; set `PLAYWRIGHT_MODULE` if it is outside normal Node resolution. Browser checks cover numeric options, presets, press-and-hold input, normal/default restoration, shortcuts, saved preferences and loadouts, boost release, double jump, telemetry, unsupported states and narrow layouts.

Movement tests use real typed-array heaps to check jump restoration, flight velocity, gravity and landing-mask restoration, run-state gating, and unsupported-build behavior. Runtime movement edits are allowed only after the same build hash passes. Flight overrides the current sled point's velocity, gravity, and raycast mask; turning it OFF restores its original physics settings.

## Share on a USB stick

Run `node build-usb.cjs` to make `Snow Rider Controls USB` in Downloads. If that folder already exists, supply a new output path, for example `node build-usb.cjs "/path/to/new USB package"`. Copy the entire generated folder onto the USB stick.

Your friend opens `Setup - Windows.cmd` on Windows or `Setup - Mac.command` on Mac. Each copies the extension into a fresh Downloads folder, opens that folder, and shows the offline setup guide. The helpers do not require Node or any downloads. Chromebook users copy the included `Extension` folder with the Files app. All three then load the local copy using Chrome's **Developer mode > Load unpacked**.

The USB does not execute anything automatically when connected. Helpers do not install browser extensions automatically. The macOS copying flow was tested locally; Windows commands were reviewed but were not run on Windows.


## Game rules

This is an unofficial gameplay modification for Snow Rider 3D. Use it only where permitted by the game and site rules.
