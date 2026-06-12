# IrTrace React Native App — Full Antigravity Build Prompt

Build a React Native app called **IrTrace** — a Bluetooth Low Energy (BLE) configurator for an ESP32-C5 IR blaster device. The app must replicate every feature of the original web interface exactly, but wrapped in a Gen Alpha / Y2K-meets-cyberpunk visual identity: dark background (#0A0A0F), electric neon accents (cyan #00F5FF, purple #BF00FF, hot pink #FF006E, acid green #39FF14), glassmorphism cards with blurred frosted borders, chunky bold monospace typography (JetBrains Mono), heavy use of animated gradients, glowing shadows, scanline overlays, blinking indicator dots, and satisfying micro-animations on every interaction (scale bounce, glow pulse, slide-in). Think Raycast + Linear + a rave. Every button must feel juicy. Every card must feel alive.

---

## TECH STACK

- React Native (Expo SDK 51+, managed workflow)
- `react-native-ble-plx` for Bluetooth Low Energy
- `react-native-reanimated` 3 for all animations
- `expo-blur` for glassmorphism card backgrounds
- `expo-linear-gradient` for gradient backgrounds and buttons
- `@expo-google-fonts/jetbrains-mono` + Inter for typography
- `react-native-gesture-handler`
- `zustand` for global state management
- All state must be organized into a single Zustand store

---

## BLE CONFIGURATION (exact values — do not change)

```
SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'  // Nordic UART Service
TX_UUID      = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // notifications FROM device
RX_UUID      = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'  // writes TO device
WEB_VERSION  = 'v@0.0.3'
```

- BLE scan filter: `services: [SERVICE_UUID]`
- All commands sent as UTF-8 strings via `writeCharacteristicWithResponseForDevice` to `RX_UUID`
- All incoming data received via `monitorCharacteristicForDevice` on `TX_UUID`

---

## APP STRUCTURE

Single scrollable screen with a sticky header. Cards stacked vertically below in this exact order:

1. Header (sticky)
2. Status Strip
3. IR Received Signal card
4. Wi-Fi Configuration card
5. Admin / Advanced card
6. Protocol Discovery card (hidden until connected)
7. Unsupported AC Setup / Learn Fallback card
8. Debug card
9. Message Log card
10. Save Configuration card
11. Footer

---

## DESIGN SYSTEM

**Background:** Solid #0A0A0F with a very subtle animated scanline overlay — repeating horizontal lines at 2px height, 4px gap, opacity 0.03, slowly scrolling downward on infinite loop.

**Cards:** Semi-transparent dark glass (#13131A at 85% opacity), 1.5px neon border whose color matches the card's accent, border-radius 20px, shadow `0 0 40px rgba(0,245,255,0.07)`. Card header is a slightly lighter glass strip (#1A1A24 at 80% opacity) with UPPERCASE monospace label and a status pill on the right.

**Pills:** Rounded capsule (border-radius 999), gradient background, glowing border, JetBrains Mono bold 10px.
- `idle`: gray glass, muted white text
- `live / ok`: acid green glow (`#39FF14`), dark background
- `warn`: orange glow (`#FF8C00`), dark background
- `err`: hot pink glow (`#FF006E`), dark background
- `proto`: cyan glow (`#00F5FF`), dark background

**Buttons:** Gradient fills, glowing borders, scale-bounce on press (scale 0.95 → 1.02 → 1.0, 150ms via Reanimated). Disabled state at 30% opacity with no glow. All button labels use JetBrains Mono bold uppercase.
- **Primary (Connect, Save All):** cyan-to-purple diagonal gradient, white text, heavy cyan glow
- **Danger (Disconnect, Delete):** hot pink `#FF006E` fill, white text, pink glow
- **Secondary:** glass fill, neon-colored text + matching border
- **Success state:** acid green `#39FF14` fill, dark text

**Inputs:** Dark glass background (#0D0D14), 1.5px border (muted at rest, animated neon cyan glow pulse when focused), JetBrains Mono text, white placeholder at 30% opacity.

**Dropdowns/Selects:** Rendered as custom modal bottom sheets with a dark glass background, neon-bordered option rows, animated checkmark on selected item. Never use native picker.

**Typography:**
- Card section labels: JetBrains Mono, 10px, 0.15em letter-spacing, UPPERCASE, rgba(0,245,255,0.4)
- Data values: JetBrains Mono, 20–24px, bold, white
- Body / field labels: JetBrains Mono, 12px, rgba(255,255,255,0.6)
- Brand name: JetBrains Mono, 16px, 700, white
- Muted text: rgba(255,255,255,0.35)

---

## FEATURE 1 — HEADER (sticky, top: 0)

**Left side:**
- Brand icon: 36×36 rounded square (border-radius 10), cyan-to-purple gradient background, wifi-signal/radio-waves SVG icon in white (stroke, not fill)
- Right of icon: "IrTrace" (JetBrains Mono bold 15px white) stacked above version line

Version line format: `ESP32-C5 · WEB v@0.0.3 / FW {firmwareVersion || '--'}`
- If `firmwareVersion` is received and does NOT match `'v@0.0.3'` → version line turns hot pink `#FF006E`
- firmwareVersion starts as empty string `''`; updated on BLE reply `FW:{val}`

**Right side (flex row, gap 8):**
- "Guide" button: glass fill, cyan text, opens `manual.html` via `Linking.openURL`
- Connect/Disconnect button (see state below)

**Connect button — disconnected state:**
Cyan gradient, white text, small 8px dot (white 40% opacity), label "Connect"

**Connect button — connected state:**
Glass fill, hot pink text, 8px dot in hot pink with animated radial pulse (glow ring expanding and fading), label "Disconnect"

**On press:** call `toggleConnect()` — if connected call `disconnect()`, else call `connect()`

---

## FEATURE 2 — STATUS STRIP

Full-width bar directly below header. Not sticky.

**Contents:** 6px dot (left) + status message text (JetBrains Mono 11px).

**States and messages:**
- `default` (cyan tint background, cyan text): `"Disconnected — tap Connect to scan"` — dot blinks slowly (2s cycle, opacity 1→0.3→1)
- `ok` (green tint background, green text): `"Connected to {device.name}"` — dot solid, no blink
- `err` (pink tint background, pink text): error message — dot solid
- `warn` (orange tint background, orange text): scanning/connecting message — dot fast blink (0.8s cycle)

All background and text color transitions animate over 300ms ease.

Dot for `ok` and `err` states: no animation, solid color.
Dot for `default` and `warn`: `@keyframes blink` looping opacity animation.

---

## FEATURE 3 — IR RECEIVED SIGNAL CARD

**Card header:** label `"IR Received Signal"`, right side: last timestamp string (hidden until first signal, format HH:MM:SS 24h) + status pill (`Waiting` idle gray / `Live` acid green).

**Body:** 2-column grid of data cells with 1px border between them.

Cell layout:
| Protocol (full width, spans both columns) |
|---|---|
| Power | Mode |
| Temperature (RX) | Fan Speed |

Each cell contains:
- Field label: 10px UPPERCASE JetBrains Mono, rgba(255,255,255,0.35)
- Value: JetBrains Mono bold 20px

**Value color states:**
- Empty / no data: `"—"` in rgba(255,255,255,0.2), font-size 16px
- Protocol value: cyan `#00F5FF`, font-size 16px
- Power ON: acid green `#39FF14`
- Power OFF: hot pink `#FF006E`
- `N/A`: dim rgba(255,255,255,0.2), font-size 14px
- All other values: white

**On new value received:** the entire cell animates — brief glow flash (background color pulses from `rgba(0,245,255,0.15)` to transparent over 500ms ease-out).

**Timestamp:** updated every time a PROTOCOL: BLE message arrives. Format: `Last: HH:MM:SS`.

---

## FEATURE 4 — WI-FI CONFIGURATION CARD

**Card header:** `"Wi-Fi Configuration"` + pill (`Scan Ready` idle / `Scanning...` warn / `Scan Done` live / `No Networks` idle).

**Body (flex column, gap 14):**

### Select Network
- Label: `"Select Network"` (wifi-lbl style)
- Custom dropdown bottom-sheet, disabled until connected
- Options format: `"{SSID} ({rssi}dBm) [{Open|Secured}]"`
- Last option always: `"➕ Manual Entry..."`
- When `"Manual Entry..."` selected: animate-slide-down a text input for hidden SSID below the dropdown

### Password
- Label: `"Password"`
- Password input (type=password), disabled until connected
- Eye icon button on the right inside the input: toggles input type between `password` and `text`
  - Eye SVG: open eye when hidden, crossed eye when visible

### Actions
- `"🔄 RE-SCAN"` button: glass fill, muted text → on press sends `'wscan'` and sets pill to `"Scanning..."`

---

### Wi-Fi Network Parsing Logic (exact, do not simplify)

Incoming BLE message format: `NET:{index}:{ssid}:{rssi}:{security}`

Parsing rules:
- Split the value (after `NET:`) by `':'`
- `parts[0]` = index (integer)
- `parts[parts.length - 1]` = security (`"Open"` or `"Secured"`)
- `parts[parts.length - 2]` = rssi (negative integer string)
- `parts.slice(1, parts.length - 2).join(':')` = ssid (handles SSIDs with colons)
- When `index === 0`: reset `wifiList = []` (new scan starting)
- Deduplicate by SSID: if `wifiList.find(n => n.ssid === ssid)` already exists, skip (first = strongest signal)
- Push `{ ssid, rssi, sec }` to wifiList

Special values:
- `NET:NONE` → `wifiList = []`, call `updateWifiDropdown()`, set pill `"No Networks"` idle
- `NET:DONE` → call `updateWifiDropdown()`, set pill `"Scan Done"` live

On connect: call `resetWifiUi('Waiting for device scan...')` which clears wifiList, clears dropdown, hides manual input, sets pill to provided text.

---

## FEATURE 5 — ADMIN / ADVANCED CARD

**Card header:** `"Admin / Advanced"` + pill (`Locked` idle gray / `Unlocked` acid green live).

### Locked State Body
1. Note text: `"Unlock to edit the production-only fields used by the main firmware: device ID and wake interval."`
2. `"Admin Password"` label + password input with eye toggle, **disabled until connected**
3. `"UNLOCK ADMIN"` button: dark/black fill (#111827), white text

### Unlock Flow
- On button press: read password input value, if empty show alert "Enter the admin password first", else send `ADMIN_AUTH:{password}`
- `ADMIN:AUTH_OK` → `setAdminUnlocked(true)`, then send `'ADMIN_GET'`
- `ADMIN:AUTH_FAIL` → `setAdminUnlocked(false)`, log err `"Admin password rejected"`
- `ADMIN:LOCKED` → `setAdminUnlocked(false)`, log err `"Admin section is locked"`
- `ADMIN:SAVED` → log sys `"✅ Admin settings saved on device"`

### setAdminUnlocked(on)
- `on = true`: animate-slide-down reveal admin fields, set pill to `Unlocked` (green)
- `on = false`: hide admin fields, set pill to `Locked` (gray), set `adminUnlocked = false`
- Update all admin input disabled states accordingly

### Unlocked Fields (slide-down animated reveal)
1. `"Device ID (001-999)"` label + numeric input, inputMode=numeric, maxLength=3, placeholder=`"001"`
   - Auto-pad on blur: strip non-digits, parse int, clamp 1–999, pad to 3 digits with leading zeros
2. `"Wake Interval (minutes)"` label + number input, min=1, max=600, placeholder=`"10"`
3. Note: `"The device stores wake interval in seconds. This screen edits it in minutes to match the old admin flow."`
4. `"SAVE ADMIN"` button: hot pink fill, white text

### Admin Save
- Read device ID input, apply padUid logic
- Read wake interval, parse int, clamp 1–600
- Write back validated values to inputs
- Log sys `"Saving admin settings..."`
- Send `ADMIN_SAVE:{paddedUid}\n{wakeMinutes * 60}`

### BLE Replies that Force Unlock
- `ADM_UID:{val}` → `setAdminUnlocked(true)`, fill device ID input with `padUid(val)`
- `ADM_WAKE:{seconds}` → `setAdminUnlocked(true)`, fill wake interval with `Math.max(1, Math.round(seconds / 60))`

### padUid(raw)
```
digits = String(raw).replace(/\D/g, '')
num = parseInt(digits || '1', 10)
if (num < 1) num = 1
if (num > 999) num = 999
return String(num).padStart(3, '0')
```

### Reset Admin UI (on disconnect)
Clear all admin inputs, call `setAdminUnlocked(false)`.

### syncAdminControls
- `inp-admin-pass` and `btn-admin-unlock`: disabled when `!connected`
- `inp-admin-uid`, `inp-admin-wake`, `btn-admin-save`: disabled when `!(connected && adminUnlocked)`

---

## FEATURE 6 — PROTOCOL DISCOVERY CARD

Hidden until BLE connected. On `onConnected()` → `display: 'flex'` (or equivalent).

**Card header:** `"Protocol Discovery"` + pill showing detected protocol name (or `"—"`), pill style `proto` (cyan glow).

---

### 6a. Temperature Control Row

Horizontal glass pill-shaped row (border-radius 12, glass background, neon border):
- `"Temp"` label (left, JetBrains Mono 11px muted)
- `"−"` button (44×44, glass fill, neon border, bounce on press)
- Large temperature display (flex:1, center): `"{testTemp}°C"` — number in JetBrains Mono bold 28px cyan, `"°C"` in 14px muted
- `"+"` button (44×44, same as minus)

Temperature range: 16–30°C. Default: 24.
`adjustTemp(delta)`: `testTemp = Math.max(16, Math.min(30, testTemp + delta))`

BLE `TEMP:{val}` → `syncTxTemp(val)`:
```
temp = parseInt(val)
if (!isFinite(temp)) return
testTemp = Math.max(16, Math.min(30, temp))
update display
```

Both `−` and `+` buttons: disabled when disconnected.

---

### 6b. Active Variant Tag

Appears only after a protocol test is confirmed (TX:OK received while pendingTestVariant is set).
Green glowing pill: `"Active variant: {activeVariantName}"`
- Hidden initially (height: 0, opacity: 0)
- Slides down with opacity fade-in when set
- Slides back up with opacity fade-out on `resetConfirmedProtocol()`

`setConfirmedVariant(id, name)`:
- `activeVariantId = id`
- `activeVariantName = name || variantNameById(id)`
- Show active tag with animation
- Call `updateSaveChecklist()`

`resetConfirmedProtocol()`:
- `activeVariantId = null`, `activeVariantName = ''`, `pendingTestVariant = null`
- Hide active tag

---

### 6c. Suggested Protocols Section

Section sub-header row: `"Suggested Protocols"` label (10px mono muted UPPERCASE) + badge `"{n} candidate(s)"` (cyan pill).

**No-candidate warning box** (orange glass, shown only when candidates = 0 or protocol not in table):
`"⚠️ No direct TX candidates for this protocol — use All Protocols below."`
or
`"⚠️ \"{proto}\" not in lookup table — use All Protocols below."`

**Lookup dropdown** (custom bottom-sheet, disabled until connected):
- Default option: `"— Press a remote button to populate —"` (value = -1)
- Populated by `populateLookupDropdown(proto)` when `PROTOCOL:{rawVal}` BLE message arrives

`onProtocolReceived(rawVal)`:
1. Strip repeat suffix: `proto = rawVal.replace(/\s*\(.*\)/, '').trim().toUpperCase()`
2. Call `updateIR('protocol', rawVal)` — updates the IR Received Signal card
3. Update `proto-pill` text to `proto`
4. Call `populateLookupDropdown(proto)`
5. Ensure discovery card is visible

`populateLookupDropdown(proto)`:
- Look up `PROTOCOL_LOOKUP[proto]`
- If not found in table: show no-candidate warning with "not in lookup table" text, set badge "0 candidates", set single option "— No candidates —" (value -1), if `activeTestSection === 'lookup'` call `updateTestButtons()`
- If found but empty array: show no-candidate warning with "No TX class" text, same handling
- If found with candidates: hide warning, set badge "{n} candidate(s)", populate options:
  - First candidate (index 0): `"⭐ {name}"` (value = id)
  - Subsequent (index 1+): `"{i+1}. {name}"` (value = id)
  - Set `activeTestSection = 'lookup'`, call `updateTestButtons()`

On dropdown change: `activeTestSection = 'lookup'`, call `updateTestButtons()`

---

### 6d. All Protocols Section

Section sub-header: `"All Protocols"` label + badge `"69 variants (0–68)"`.

**Universal dropdown** (custom bottom-sheet, disabled until connected):
- First option: value = -1, text = `"⚡ Local Setup — RAW Capture"`
- Then all 69 variants: value = id, text = `"{id} — {name}"`

Populate on init (before BLE connection) from ALL_VARIANTS array (see data section below).

On dropdown change: `activeTestSection = 'universal'`, call `updateTestButtons()`

BLE `VAR:{val}` → `syncFirmwareVariant(val)`:
- `id = parseInt(val)`
- If not finite, return
- Set universal dropdown selected value to `String(id)`

---

### 6e. Shared Test Buttons

Three buttons in one horizontal row:

| `TEST OFF` (pink) | `TEST ON` (green) | `SET TEMP` (cyan) |

**Enable logic** (`updateTestButtons()`):
```
if (!connected || learnCtrlMode === 'LEARNED'):
  all three disabled
else if activeTestSection === 'lookup':
  enabled only if parseInt(sel-lookup.value) >= 0
else (universal):
  always enabled when connected
```

Call `updateTestButtons()` whenever: connection state changes, `activeTestSection` changes, `learnCtrlMode` changes, lookup dropdown value changes.

**On press** (`testSection(action)`):
1. Get `selId = activeTestSection === 'lookup' ? selLookup : selUniversal`
2. Get `varId = parseInt(selectedValue)`
3. If `varId === -1`: log sys `"RAW capture — coming in next firmware update"`, return
4. Find display name:
   - If lookup: strip `"⭐ "` or `"{n}. "` prefix from selected option text
   - If universal: find in ALL_VARIANTS by id
5. Build command:
   - `action === 'off'` → cmd = `'off'`
   - `action === 'on'` → cmd = `'on {testTemp}'`
   - `action === 'temp'` → cmd = `'t {testTemp}'`
6. Send `'v {varId}'` → if fails, return
7. Set `pendingTestVariant = { id: varId, name }`
8. Send `cmd` → if fails, set `pendingTestVariant = null`, return
9. Log sys `"Testing: {name} — {cmd}"`

BLE `TX:OK` → `confirmPendingProtocolTest()`:
```
if (!pendingTestVariant) return
setConfirmedVariant(pendingTestVariant.id, pendingTestVariant.name)
log sys 'Protocol confirmed: {pendingTestVariant.name}'
pendingTestVariant = null
```

**Learned mode notice:** When `learnCtrlMode === 'LEARNED'`, show an orange-tinted glass box above the test buttons:
`"🔒 Protocol Discovery disabled — switch to Protocol mode to use these controls"`

---

### 6f. Find AC Receiver (Protocol Mode)

Full-width button, below a divider:
- Idle: `"📡 FIND AC RECEIVER"`, glass fill, muted text, muted border
- Active/scanning: `"⏹ STOP FIND RX"`, orange fill, orange text, animated repeating glow pulse:
  ```
  shadow: 0 0 0px → 0 0 7px rgba(217,119,6,0.35) → 0 0 0px
  duration: 1.5s, ease-in-out, infinite
  ```

Hint text (below button, hidden when inactive):
`"● Scanning — sweep blaster slowly across AC face"` in orange, opacity blinks when `FIND_RX:PULSE` received.

**toggleFindRx():**
```
if (!connected) return
if (findRxActive):
  sendCmd('FIND_RX:OFF')
else:
  get varId from active dropdown
  if varId >= 0: sendCmd('v {varId}')
  sendCmd('FIND_RX:ON')
```

**setFindRxState(on):**
- Update both find-rx buttons (protocol card + learn card) simultaneously
- `on = true`: add scanning class, change text to `"⏹ STOP FIND RX"`, show hint
- `on = false`: remove scanning class, restore text, hide hint

**flashFindPulse():**
For both hint elements (if findRxActive and element visible):
- Set opacity to 0.3, after 200ms set back to 1.0

**BLE FIND_RX handling:**
- `FIND_RX:ON` → `setFindRxState(true)`
- `FIND_RX:OFF` → `setFindRxState(false)`
- `FIND_RX:PULSE` → `flashFindPulse()`

Reset `findRxActive = false` and call `setFindRxState(false)` on every connect AND every disconnect.

---

## FEATURE 7 — UNSUPPORTED AC SETUP (LEARN FALLBACK) CARD

**Card header:** `"Unsupported AC Setup"` + pill (`"Protocol"` cyan-proto / `"Learned"` green-live).

---

### Constants
```js
LEARN_SLOT_NAMES = [
  'OFF',
  'COOL 16','COOL 17','COOL 18','COOL 19','COOL 20',
  'COOL 21','COOL 22','COOL 23','COOL 24','COOL 25',
  'COOL 26','COOL 27','COOL 28','COOL 29','COOL 30'
]
LEARN_NUM_SLOTS = 16
```

### State Variables
```js
learnSlotStates    = Array(16).fill('EMPTY')  // 'EMPTY' | 'CAPTURED' | 'SAVED'
learnCtrlMode      = 'PROTOCOL'               // 'PROTOCOL' | 'LEARNED'
learnActiveSlot    = -1                       // selected slot index, -1 = none
learnPendingCapture = false
```

---

### 7a. Info Note Box
Orange-tinted glass box with 1px orange border:
`"Use this section only when the protocol library cannot control your AC. Learn each command from your original remote, then switch to Learned mode. Replays always use 38 kHz — carrier is not measured by the receiver."`

---

### 7b. Control Mode Toggle Row
Glass row: `"Control"` label (left, muted) + two toggle buttons side by side:

- `"Protocol (default)"` button:
  - Active (PROTOCOL mode): cyan border + cyan glass background, cyan text (`active-protocol` style)
  - Inactive: plain glass
  - Always enabled when connected

- `"Learned Fallback"` button:
  - Active (LEARNED mode): green border + green glass background, green text (`active-learned` style)
  - Inactive: plain glass
  - **Disabled unless ALL 16 slots have state `'SAVED'`**

On press `"Protocol (default)"`: send `'LRN:MODE:PROTOCOL'`
On press `"Learned Fallback"`:
- Check `learnSlotStates.every(s => s === 'SAVED')`
- If false: log err `"Save all 16 learned slots before enabling Learned Fallback"`, return
- Else: send `'LRN:MODE:LEARNED'`

---

### 7c. Slot Grid

Legend row (above grid):
```
● Empty (gray dot)    ● Captured (orange dot)    ● Saved (green dot)
```

4-column grid, 16 cells total.

Each cell structure:
- slot name centered (JetBrains Mono bold 10px)
- small 7px dot below name

**Cell visual states:**
| State | Border | Background | Dot Color |
|---|---|---|---|
| EMPTY | gray | dark glass | gray |
| CAPTURED | orange | orange-tinted glass | orange |
| SAVED | green | green-tinted glass | green |
| selected | + bright cyan outline overlay | — | — |
| selected + SAVED | green dominates | — | green |
| selected + CAPTURED | orange dominates | — | orange |
| disconnected | 40% opacity, disabled touch | — | — |

`buildLearnSlotGrid()`: creates all 16 cells, each with `onPress: () => learnSelectSlot(i)`

`updateLearnSlotGrid()`: iterates all slots, resets classes, applies state + selected styles

`learnSelectSlot(i)`:
```
if (!connected) return
learnActiveSlot = i
updateLearnSlotGrid()
updateLearnButtons()
state = learnSlotStates[i]
if state === 'SAVED':   setLearnStatus('Slot {name} already saved — press DELETE to re-learn.', 'ok')
if state === 'CAPTURED': setLearnStatus('Slot {name} captured — press SAVE to store or DISCARD to retry.')
else:                    setLearnStatus('Slot {name} selected — press LEARN to capture.')
```

---

### 7d. Workflow Status Line

Full-width text box (JetBrains Mono 11px), min-height so it doesn't collapse.

**Visual states:**
- default: glass, rgba(255,255,255,0.4) text
- `capturing`: orange-tinted glass, orange border, orange text
- `ok`: green-tinted glass, green border, green text
- `err`: pink-tinted glass, pink border, pink text

`setLearnStatus(msg, type)`: update text and state class.

Initial text: `"Connect to device to manage learned slots."`

---

### 7e. Workflow Buttons

**Row 1:** `📥 LEARN` | `▶ TEST` | `💾 SAVE` | `✕ DISCARD`
**Row 2:** `🗑 DELETE` | `DELETE ALL`

Styles:
- LEARN: cyan glass fill, cyan border, cyan text
- TEST/REPLAY: orange glass fill, orange border, orange text
- SAVE: green glass fill, green border, green text
- DISCARD: plain glass fill, muted border, muted text
- DELETE / DELETE ALL: pink glass fill, pink border, pink text

**Enable logic (`updateLearnButtons()`):**
```js
state = learnActiveSlot >= 0 ? learnSlotStates[learnActiveSlot] : null
hasSlot    = learnActiveSlot >= 0 && connected
captured   = hasSlot && state === 'CAPTURED'
saved      = hasSlot && state === 'SAVED'
hasAnyData = learnSlotStates.some(s => s !== 'EMPTY')
allSaved   = learnSlotStates.every(s => s === 'SAVED')

btn-lrn-learn.disabled   = !hasSlot || saved
btn-lrn-replay.disabled  = !captured
btn-lrn-save.disabled    = !captured
btn-lrn-discard.disabled = !captured
btn-lrn-delete.disabled  = !saved
btn-lrn-delete-all.disabled = !connected || !hasAnyData

btn-mode-proto.disabled   = !connected
btn-mode-learned.disabled = !connected || !allSaved
```

**Commands:**
- LEARN → `LRN:BEGIN:{learnActiveSlot}`
  - Guard: if `learnActiveSlot < 0`, log err `"Select a slot first"`, return
- TEST → `LRN:REPLAY`
- SAVE → `LRN:SAVE`
- DISCARD → `LRN:DISCARD`
- DELETE → confirm dialog `'Delete saved slot "{LEARN_SLOT_NAMES[learnActiveSlot]}"?'` → if confirmed: `LRN:DELETE:{learnActiveSlot}`
  - Guard: if `learnActiveSlot < 0`, return without dialog
- DELETE ALL → confirm dialog `'Delete all learned IR slots from device storage? This cannot be undone.'` → if count > 0 and confirmed: `LRN:DELETE_ALL`

---

### 7f. BLE Learn Message Handler (`handleLearnMsg(val)`)

`val` is everything after `LRN:` in the raw BLE message. Split by `':'`, `sub = parts[0].toUpperCase()`.

```
switch sub:

  'MODE':
    applyLearnModeUi(parts[1] || 'PROTOCOL')

  'SLOT':
    idx = parseInt(parts[1])
    state = (parts[2] || 'EMPTY').toUpperCase()
    if idx >= 0 && idx < 16:
      learnSlotStates[idx] = state
      updateLearnSlotGrid()
      updateLearnButtons()
      updateSaveChecklist()

  'ACTIVE':
    idx = parseInt(parts[1])
    if idx >= 0 && idx < 16:
      learnActiveSlot = idx
    else if idx < 0:
      learnActiveSlot = -1
    updateLearnSlotGrid()
    updateLearnButtons()

  'WAIT':
    learnPendingCapture = true
    setLearnStatus('Point remote at sensor and press the button for {parts[1] || "?"}…', 'capturing')

  'CAPTURED':
    learnPendingCapture = false
    idx = parseInt(parts[1])
    setLearnStatus('Captured slot {LEARN_SLOT_NAMES[idx]} — press TEST to verify, then SAVE.', 'ok')

  'LEN':
    log sys '{parts[1]} mark/space pairs captured'

  'REPLAYED':
    setLearnStatus('Test replay sent — did the AC respond? If yes, press SAVE.', 'ok')

  'SAVED':
    idx = parseInt(parts[1])
    setLearnStatus('Slot {LEARN_SLOT_NAMES[idx]} saved to device storage.', 'ok')

  'DISCARDED':
    learnPendingCapture = false
    setLearnStatus('Capture discarded. Previously saved data (if any) is unchanged.', '')

  'DELETED_ALL':
    learnPendingCapture = false
    learnActiveSlot = -1
    learnSlotStates = Array(16).fill('EMPTY')
    updateLearnSlotGrid()
    updateLearnButtons()
    updateSaveChecklist()
    setLearnStatus('All learned slots deleted. Ready for fresh learning.', 'ok')

  default:
    log rx 'LRN:{val}'
```

---

### 7g. applyLearnModeUi(mode)

```
learnCtrlMode = mode
isLearned = mode === 'LEARNED'

Update pill: mode=LEARNED → green live 'Learned' | mode=PROTOCOL → cyan proto 'Protocol'
Update mode button active classes

Disable when isLearned or !connected:
  sel-lookup, sel-universal, btn-tminus, btn-tplus,
  btn-test-off, btn-test-on, btn-test-temp, btn-find-rx

Show/hide proto-mode-notice: visible when isLearned

btn-find-rx-lrn: disabled = !isLearned || !connected

if !isLearned: updateTestButtons()

updateLearnButtons()
updateSaveChecklist()
```

---

### 7h. Find AC Receiver (Learned Mode)

Identical appearance and behavior to Protocol mode Find RX button (6f), with two differences:
1. Only enabled when `learnCtrlMode === 'LEARNED'` AND connected
2. No variant sync before sending `FIND_RX:ON` (firmware uses COOL_24 slot directly)
3. Caption below button: `"Uses COOL 24 slot for scanning"` in muted text, centered

`toggleFindRxLrn()`:
```
if (!connected) return
if findRxActive: sendCmd('FIND_RX:OFF')
else: sendCmd('FIND_RX:ON')
```

Both find-rx buttons share `findRxActive` state and `setFindRxState()` — they update simultaneously.

---

### 7i. resetLearnUi() — called on disconnect

```
learnPendingCapture = false
learnActiveSlot = -1
learnSlotStates = Array(16).fill('EMPTY')
applyLearnModeUi('PROTOCOL')
updateLearnSlotGrid()
updateLearnButtons()
updateSaveChecklist()
setLearnStatus('Connect to device to manage learned slots.')
```

---

## FEATURE 8 — DEBUG CARD

**Card header:** `"Debug"`

**Body:** One control row:

Row layout: `"Raw Out"` label (72px wide, muted mono 11px) + two toggle buttons side by side

- `"ON"` button — sends `'RAW=ON'`
- `"OFF"` button — sends `'RAW=OFF'`

Button states:
- Default: glass fill, muted text
- `active-on` (when RAW=ON received): green border + green glass + green text
- `active-off` (when RAW=OFF received): pink border + pink glass + pink text

Both buttons disabled when disconnected.

BLE `RAW:{val}` handler:
```
btn-raw-on:  active-on  class → val === 'ON'
btn-raw-off: active-off class → val === 'OFF'
```

---

## FEATURE 9 — MESSAGE LOG CARD

**Card header:** `"Message Log"` + right-side `"Clear"` tappable text (muted, small, onPress calls `clearLog()`)

**Log area:** Scrollable view, fixed height ~180px (or `maxHeight`), auto-scrolls to bottom on new entry.

Each log line structure:
```
[HH:MM:SS]  {message}
```
- Timestamp: JetBrains Mono 11px, rgba(255,255,255,0.3)
- Message: JetBrains Mono 11px, color by type:
  - `rx` → cyan `#00F5FF`
  - `tx` → acid green `#39FF14`
  - `err` → hot pink `#FF006E`
  - `sys` → rgba(255,255,255,0.4) italic

Max 300 lines retained. When limit exceeded, remove oldest.

Initial content: `"Log empty — connect to start."` (sys style).

**Manual Send Row** (below log, top border):
- Text input: `"Manual command (e.g. RAW=ON, RAW=OFF, status)..."` placeholder
  - Disabled when not connected
  - On Enter/Submit → `sendManual()`
- `"SEND"` button: primary cyan, disabled when not connected
  - On press → `sendManual()`

`sendManual()`:
- Read input value, trim
- If empty, return
- Call `sendCmd(value)`
- Clear input

`addLog(type, msg)`:
- If first entry: clear initial content
- Format timestamp: `new Date().toLocaleTimeString('en-GB', { hour12: false })`
- Append new row
- Trim to 300 max
- Scroll to bottom

`clearLog()`: Replace all content with single sys line `"Log cleared."`

---

## FEATURE 10 — SAVE CONFIGURATION CARD

**Card header:** `"Save Configuration"` + pill (`"Pending"` idle / `"Ready"` live green / `"Saved ✅"` live green).

**Body:**

### Checklist
Two checklist rows, each containing:
- Status icon (left): `"○"` (empty), `"✅"` (ready), `"❌"` (missing/error)
- Label text (right, fills remaining space)

**Row 1 — Wi-Fi:**
- Default: `"Wi-Fi network — not selected"`, icon `"○"`, plain glass
- Ready: `"Wi-Fi: {ssid}"`, icon `"✅"`, green glass + green border (`ready` state)
- Missing (validation fail): icon `"❌"`, pink glass + pink border, shake animation

**Row 2 — Protocol:**
- Default: `"IR protocol — not tested yet"`, icon `"○"`, plain glass
- Ready (PROTOCOL mode): `"Protocol: {activeVariantName}"`, icon `"✅"`, green state
- Ready (LEARNED mode): `"IR: Learned Fallback ({savedCount}/{LEARN_NUM_SLOTS} slots saved)"`, icon `"✅"`, green state
- Missing: icon `"❌"`, pink + shake animation

**Missing state shake animation:** translateX 0 → -5 → +5 → -3 → 0, duration 350ms ease, triggered by removing and re-adding the class.

### Save Button
Full-width, tall (paddingVertical 15), JetBrains Mono bold.

States:
- Disabled: gray fill, no glow, `"💾 SAVE ALL — Configure Device"`
- Enabled: cyan-to-purple gradient, glow, same text
- Saving: orange fill, `"⏳ Saving..."`
- Success: green fill, `"✅ Saved! Restarting device..."`

---

### updateSaveChecklist()

```
// Wi-Fi readiness
sel = sel-wifi value
if sel === 'manual':
  ssid = inp-wifi-manual value trimmed
else if parseInt(sel) >= 0 && wifiList.length > 0:
  ssid = wifiList[parseInt(sel)].ssid || ''
else:
  ssid = ''
wifiReady = ssid.length > 0

// Protocol readiness
learnedReady = learnCtrlMode === 'LEARNED' && learnSlotStates.every(s => s === 'SAVED')
protoReady = (learnCtrlMode === 'LEARNED') ? learnedReady : (activeVariantId !== null)

// Update Wi-Fi check item
chk-wifi: toggle 'ready' class based on wifiReady
  icon: wifiReady ? '✅' : '○'
  label: wifiReady ? 'Wi-Fi: {ssid}' : 'Wi-Fi network — not selected'
  remove 'missing' if not wifiReady

// Update Protocol check item
chk-proto: toggle 'ready' class based on protoReady
  icon: protoReady ? '✅' : '○'
  label logic:
    if learnCtrlMode === 'LEARNED':
      savedCount = learnSlotStates.filter(s => s === 'SAVED').length
      protoReady ? 'IR: Learned Fallback ({savedCount}/{16} slots saved)'
                 : 'IR learned slots — {savedCount}/{16} saved'
    else:
      protoReady ? 'Protocol: {activeVariantName}'
                 : 'IR protocol — not tested yet'
  remove 'missing' if not protoReady

// Save pill
allReady = wifiReady && protoReady
pill: allReady → 'Ready' live green | else → 'Pending' idle

// Save button
if button not in 'saving' state: button.disabled = !connected || !allReady
```

---

### submitAll()

```
if (!connected) return

hasError = false

if (!wifiReady):
  trigger shake on chk-wifi, set icon '❌', set class 'missing'
  hasError = true

if (!protoReady):
  trigger shake on chk-proto, set icon '❌', set class 'missing'
  hasError = true

if (hasError):
  log err 'Fill in all required fields before saving'
  return

// Collect SSID
sel = sel-wifi.value
if sel === 'manual': ssid = inp-wifi-manual.value.trim()
else: ssid = wifiList[parseInt(sel)].ssid

pass = inp-wifi-pass.value
saveMode = learnCtrlMode

// UI: saving state
btn-save-all.disabled = true, class = 'saving', text = '⏳ Saving...'

// Begin save transaction
savePromise = beginSaveTransaction(saveMode)

try:
  log sys 'Saving Wi-Fi credentials...'
  send 'WIFI_SET:{ssid}\n{pass}' → if fails throw Error('Wi-Fi command send failed')

  if saveMode === 'LEARNED':
    log sys 'Using learned fallback slots for IR control...'
    send 'LRN:MODE:LEARNED' → if fails throw
  else:
    log sys 'Saving protocol control mode and IR variant...'
    send 'LRN:MODE:PROTOCOL' → if fails throw
    send 'save' → if fails throw

  await savePromise

  log sys: saveMode=LEARNED ? '✅ Device configured — WiFi + Learned Fallback ready'
                             : '✅ Device configured — WiFi + Protocol saved'
  set pill 'Saved ✅' live green
  btn-save-all: remove 'saving', add 'success', text = '✅ Saved! Restarting device...'
  log sys 'Sending restart command — device will reboot and begin normal operation.'
  setTimeout(1500ms): sendCmd('restart')
  // Device reboots and BLE disconnects automatically — no further UI reset needed

catch err:
  failSaveTransaction(err.message)
  try { await savePromise } catch {}
  log err 'Save failed: {err.message}'
  set pill 'Pending' idle
  btn-save-all: remove 'saving', restore text '💾 SAVE ALL — Configure Device', updateSaveChecklist()
```

---

### Save Transaction System

Tracks pending ACKs from firmware to determine when save is complete.

```js
saveTxn = null  // { mode, pending: Set, resolve, reject, timer }

beginSaveTransaction(mode):
  if saveTxn: failSaveTransaction('Previous save interrupted')
  pending = mode === 'LEARNED' ? Set(['WIFI', 'MODE']) : Set(['WIFI', 'MODE', 'SAVE'])
  return new Promise((resolve, reject) => {
    saveTxn = { mode, pending, resolve, reject,
                timer: setTimeout(() => failSaveTransaction('Timed out waiting for firmware ACK'), 10000) }
  })

completeSaveTransaction():
  if (!saveTxn || saveTxn.pending.size > 0) return
  clearTimeout(saveTxn.timer)
  resolve = saveTxn.resolve
  saveTxn = null
  resolve()

failSaveTransaction(reason):
  if (!saveTxn) return
  clearTimeout(saveTxn.timer)
  reject = saveTxn.reject
  saveTxn = null
  reject(new Error(reason))

noteSaveAck(key, val):
  if (!saveTxn) return
  if key === 'ERR': failSaveTransaction(val || 'Firmware error'), return
  if key === 'WIFI' && val === 'OK':           saveTxn.pending.delete('WIFI')
  if key === 'SAVE' && val === 'OK':           saveTxn.pending.delete('SAVE')
  if key === 'LRN' && val === 'MODE:'+mode:   saveTxn.pending.delete('MODE')
  completeSaveTransaction()
```

Call `noteSaveAck(key, val)` at the TOP of `onNotify()` before the switch, every time.
Call `failSaveTransaction('Disconnected')` in `onDisconnected()`.

---

## FEATURE 11 — FOOTER

Centered text: `"IrTrace · ESP32-C5 · RX · BLE · Chrome only"`
JetBrains Mono, 10px, rgba(255,255,255,0.2), marginTop 8, marginBottom 48.

---

## BLE CONNECT / DISCONNECT FLOW

### connect()
```
setStrip('warn', 'Scanning for IrTrace-BLE...')
try:
  scan for devices with SERVICE_UUID filter
  if no device found (NotFoundError): setStrip('', 'Scan cancelled.'), return
  
  setStrip('warn', 'Connecting...')
  connect to GATT server
  get primary service SERVICE_UUID
  get TX characteristic → startNotifications, add listener → onNotify
  get RX characteristic → store as rxChar
  call onConnected()

catch err:
  if err is NotFoundError: setStrip('', 'Scan cancelled.')
  else: setStrip('err', 'Failed: {err.message}'), log err err.message
```

### onConnected()
```
connected = true
firmwareVersion = ''
resetConfirmedProtocol()
resetWifiUi('Waiting for device scan...')
updateVersionLine()
update connect button: add 'conn' class, label = 'Disconnect'
setStrip('ok', 'Connected to {device.name}')
setControls(true)
resetAdminUi()
setFindRxState(false)
updateSaveChecklist()
show discovery card
setPill('ir-pill', live, 'Live')
log sys 'Connected to {device.name}'

// Send initial commands (in order, no delay):
sendCmd('wget')      // triggers Wi-Fi scan
sendCmd('status')    // returns FW, VAR, PWR, TEMP, RPT, RAW state
sendCmd('LRN:STATUS') // returns all 16 slot states + ctrl mode
```

### disconnect()
```
if bleDevice && gatt.connected: bleDevice.gatt.disconnect()
```

### onDisconnected() (fires automatically on BLE disconnect event)
```
connected = false
rxChar = null
failSaveTransaction('Disconnected')
pendingTestVariant = null
resetConfirmedProtocol()
resetWifiUi('Scan Ready')
resetLearnUi()
firmwareVersion = ''
updateVersionLine()
update connect button: remove 'conn' class, label = 'Connect'
setStrip('', 'Disconnected — tap Connect to reconnect')
setControls(false)
resetAdminUi()
setFindRxState(false)
updateSaveChecklist()
// Explicitly reset save button (updateSaveChecklist only touches disabled state):
btn-save-all: remove 'saving' + 'success' classes, text = '💾 SAVE ALL — Configure Device'
setPill('ir-pill', idle, 'Waiting')
setPill('wifi-pill', idle, 'Scan Ready')
log sys 'Disconnected'
```

---

## BLE INCOMING MESSAGE ROUTER (onNotify)

```
raw = decode UTF-8, trim
if empty: return
log rx raw

ci = raw.indexOf(':')
if ci === -1: return
key = raw.substring(0, ci).toUpperCase()
val = raw.substring(ci + 1).trim()

noteSaveAck(key, val)  // ← always first

switch key:
  'FW':        firmwareVersion = val; updateVersionLine()
  'VAR':       syncFirmwareVariant(val)
  'PWR':       log sys 'TX power state: {val}'
  'TEMP':      syncTxTemp(val)
  'RPT':       log sys 'TX repeat: {val}'
  'TX':        if val === 'OK': confirmPendingProtocolTest()
  'PROTOCOL':  onProtocolReceived(val)
  'POWER':     updateIR('power',   val)
  'MODE':      updateIR('mode',    val)
  'TEMP_RX':   updateIR('temp-rx', val)
  'FAN':       updateIR('fan',     val)
  'RAW':       update btn-raw-on (active-on if val=ON) and btn-raw-off (active-off if val=OFF)
  'NET':       onWifiNetworkReceived(val)
  'WIFI':      if val === 'OK': log sys '✅ Wi-Fi credentials saved on device'
  'SAVE':      if val === 'OK': log sys '✅ Protocol variant saved on device'
  'ADMIN':     handleAdminReply(val)
  'ADM_UID':   setAdminUnlocked(true); inp-admin-uid.value = padUid(val)
  'ADM_WAKE':  setAdminUnlocked(true); wakeSec=parseInt(val); if finite && >0: inp-admin-wake.value = Math.max(1, Math.round(wakeSec/60))
  'FIND_RX':   if val==='ON': setFindRxState(true); elif val==='OFF': setFindRxState(false); elif val==='PULSE': flashFindPulse()
  'ERR':       pendingTestVariant = null; log err val
  'LRN':       handleLearnMsg(val)
```

---

## sendCmd(cmd)

```
if (!connected || !rxChar): log err 'Not connected'; return false
try:
  await writeCharacteristicWithResponseForDevice(SERVICE_UUID, RX_UUID, base64(cmd))
  log tx cmd
  return true
catch err:
  log err 'Send failed: {err.message}'
  return false
```

---

## setControls(on)

Called on connect (on=true) and disconnect (on=false). Enables/disables all BLE-dependent UI elements.

```
Elements to enable/disable based on 'on':
  btn-raw-on, btn-raw-off, inp-send, btn-send,
  btn-tminus, btn-tplus, sel-lookup, sel-universal,
  btn-test-off, btn-test-on, btn-test-temp,
  sel-wifi, inp-wifi-pass, inp-wifi-manual, btn-wifi-rescan,
  inp-admin-pass, btn-admin-unlock, btn-find-rx, btn-find-rx-lrn

if !on:
  updateTestButtons()   // re-evaluates with connected=false → disables test buttons
  resetLearnUi()        // resets learn state + calls applyLearnModeUi('PROTOCOL')
else:
  updateLearnButtons()
  updateTestButtons()
  applyLearnModeUi(learnCtrlMode)

syncAdminControls()
```

---

## PROTOCOL LOOKUP TABLE (exact, complete)

```js
const PROTOCOL_LOOKUP = {
  'MITSUBISHI_AC':       [[0,'Mitsubishi STD 144-bit'],[1,'Mitsubishi 112-bit'],[2,'Mitsubishi 136-bit']],
  'MITSUBISHI112':       [[1,'Mitsubishi 112-bit'],[2,'Mitsubishi 136-bit'],[0,'Mitsubishi STD 144-bit']],
  'MITSUBISHI136':       [[2,'Mitsubishi 136-bit'],[1,'Mitsubishi 112-bit'],[0,'Mitsubishi STD 144-bit']],
  'TEKNOPOINT':          [[41,'TCL 96-bit / GZ055BE1'],[40,'TCL 112-bit'],[1,'Mitsubishi 112-bit'],[2,'Mitsubishi 136-bit'],[0,'Mitsubishi STD 144-bit']],
  'TCL96AC':             [[41,'TCL 96-bit / GZ055BE1'],[40,'TCL 112-bit'],[1,'Mitsubishi 112-bit'],[2,'Mitsubishi 136-bit']],
  'TCL112AC':            [[40,'TCL 112-bit'],[41,'TCL 96-bit / GZ055BE1'],[1,'Mitsubishi 112-bit'],[2,'Mitsubishi 136-bit']],
  'MITSUBISHI_HEAVY_152':[[3,'Mitsubishi Heavy 152-bit'],[4,'Mitsubishi Heavy 88-bit']],
  'MITSUBISHI_HEAVY_88': [[4,'Mitsubishi Heavy 88-bit'],[3,'Mitsubishi Heavy 152-bit']],
  'DAIKIN':    [[5,'Daikin STD 280-bit'],[6,'Daikin2 312-bit'],[9,'Daikin152'],[10,'Daikin160'],[11,'Daikin176'],[12,'Daikin216']],
  'DAIKIN2':   [[6,'Daikin2 312-bit'],[5,'Daikin STD 280-bit'],[9,'Daikin152'],[10,'Daikin160'],[11,'Daikin176'],[12,'Daikin216']],
  'DAIKIN64':  [[7,'Daikin64 64-bit (toggle)'],[5,'Daikin STD 280-bit'],[6,'Daikin2 312-bit']],
  'DAIKIN128': [[8,'Daikin128 128-bit (toggle)'],[5,'Daikin STD 280-bit'],[6,'Daikin2 312-bit']],
  'DAIKIN152': [[9,'Daikin152 152-bit'],[5,'Daikin STD 280-bit'],[6,'Daikin2 312-bit']],
  'DAIKIN160': [[10,'Daikin160 160-bit'],[5,'Daikin STD 280-bit'],[6,'Daikin2 312-bit']],
  'DAIKIN176': [[11,'Daikin176 176-bit'],[5,'Daikin STD 280-bit'],[6,'Daikin2 312-bit']],
  'DAIKIN216': [[12,'Daikin216 216-bit'],[5,'Daikin STD 280-bit'],[6,'Daikin2 312-bit']],
  'DAIKIN200': [[5,'Daikin STD 280-bit'],[6,'Daikin2 312-bit'],[9,'Daikin152'],[10,'Daikin160'],[11,'Daikin176'],[12,'Daikin216']],
  'DAIKIN312': [[6,'Daikin2 312-bit'],[5,'Daikin STD 280-bit'],[9,'Daikin152'],[10,'Daikin160'],[11,'Daikin176'],[12,'Daikin216']],
  'FUJITSU_AC':    [[13,'Fujitsu 56-128-bit'],[14,'Panasonic 216-bit']],
  'PANASONIC_AC':  [[14,'Panasonic 216-bit'],[13,'Fujitsu 56-128-bit']],
  'PANASONIC_AC32':[[15,'Panasonic32 32-bit (toggle)'],[14,'Panasonic 216-bit'],[13,'Fujitsu 56-128-bit']],
  'SAMSUNG_AC': [[16,'Samsung 112/168-bit']],
  'LG':  [[17,'LG Standard (GE6711AR2853M)']],
  'LG2': [[68,'LG2 — AKB75215403']],
  'HITACHI_AC':    [[18,'Hitachi STD 224-bit'],[19,'Hitachi AC1 104-bit'],[23,'Hitachi AC424'],[22,'Hitachi AC344'],[20,'Hitachi AC264'],[21,'Hitachi AC296']],
  'HITACHI_AC1':   [[19,'Hitachi AC1 104-bit'],[18,'Hitachi STD 224-bit'],[23,'Hitachi AC424'],[22,'Hitachi AC344'],[20,'Hitachi AC264'],[21,'Hitachi AC296']],
  'HITACHI_AC264': [[20,'Hitachi AC264 264-bit'],[23,'Hitachi AC424'],[22,'Hitachi AC344'],[21,'Hitachi AC296'],[18,'Hitachi STD 224-bit'],[19,'Hitachi AC1']],
  'HITACHI_AC296': [[21,'Hitachi AC296 296-bit'],[23,'Hitachi AC424'],[22,'Hitachi AC344'],[20,'Hitachi AC264'],[18,'Hitachi STD 224-bit'],[19,'Hitachi AC1']],
  'HITACHI_AC344': [[22,'Hitachi AC344 344-bit'],[23,'Hitachi AC424'],[21,'Hitachi AC296'],[20,'Hitachi AC264'],[18,'Hitachi STD 224-bit'],[19,'Hitachi AC1']],
  'HITACHI_AC424': [[23,'Hitachi AC424 424-bit'],[22,'Hitachi AC344'],[21,'Hitachi AC296'],[20,'Hitachi AC264'],[18,'Hitachi STD 224-bit'],[19,'Hitachi AC1']],
  'TOSHIBA_AC': [[24,'Toshiba 72-bit+']],
  'HAIER_AC':       [[25,'Haier STD 72-bit'],[26,'Haier YRW02 112-bit'],[27,'Haier AC160'],[28,'Haier AC176']],
  'HAIER_AC_YRW02': [[26,'Haier YRW02 112-bit'],[25,'Haier STD 72-bit'],[27,'Haier AC160'],[28,'Haier AC176']],
  'HAIER_AC160':    [[27,'Haier AC160 160-bit'],[26,'Haier YRW02 112-bit'],[25,'Haier STD 72-bit'],[28,'Haier AC176']],
  'HAIER_AC176':    [[28,'Haier AC176 176-bit'],[27,'Haier AC160 160-bit'],[26,'Haier YRW02 112-bit'],[25,'Haier STD 72-bit']],
  'KELVINATOR': [[29,'Kelvinator 128-bit'],[30,'Gree 64-bit']],
  'GREE':       [[29,'Kelvinator 128-bit'],[30,'Gree 64-bit']],
  'MIDEA':    [[31,'Midea 48-bit'],[32,'Midea24 24-bit'],[33,'Coolix 24-bit'],[34,'Coolix48 48-bit']],
  'MIDEA24':  [[32,'Midea24 24-bit'],[31,'Midea 48-bit']],
  'COOLIX':   [[63,'Bosch144 144-bit'],[33,'Coolix 24-bit'],[34,'Coolix48 48-bit'],[31,'Midea 48-bit']],
  'COOLIX48': [[63,'Bosch144 144-bit'],[34,'Coolix48 48-bit'],[33,'Coolix 24-bit'],[31,'Midea 48-bit']],
  'CARRIER_AC64': [[35,'Carrier64 64-bit']],
  'SHARP_AC': [[36,'Sharp 104-bit'],[29,'Kelvinator 128-bit']],
  'WHIRLPOOL_AC': [[37,'Whirlpool 168-bit (toggle)']],
  'ELECTRA_AC': [[38,'Electra / AUX 104-bit']],
  'VESTEL_AC': [[39,'Vestel 56-bit']],
  'TECO': [[42,'Teco 35-bit']],
  'GOODWEATHER': [[43,'Goodweather 48-bit']],
  'NEOCLIMA': [[44,'Neoclima 96-bit']],
  'AMCOR': [[45,'Amcor 64-bit']],
  'AIRWELL': [[46,'Airwell 34-bit (toggle)']],
  'DELONGHI_AC': [[47,"De'Longhi 64-bit"],[38,'Electra / AUX 104-bit']],
  'SANYO_AC':   [[48,'Sanyo STD 72-bit'],[49,'Sanyo88 88-bit']],
  'SANYO_AC88': [[49,'Sanyo88 88-bit'],[48,'Sanyo STD 72-bit']],
  'SANYO_AC152':[[48,'Sanyo STD 72-bit (best-effort)'],[49,'Sanyo88 88-bit (best-effort)']],
  'VOLTAS': [[50,'Voltas 120-bit']],
  'MIRAGE': [[51,'Mirage 120-bit']],
  'CORONA_AC': [[52,'Corona 168-bit']],
  'AIRTON': [[53,'Airton 56-bit']],
  'ECOCLIM': [[54,'EcoClim 56-bit']],
  'KELON':    [[55,'Kelon 48-bit'],[56,'Kelon168 168-bit']],
  'KELON168': [[56,'Kelon168 168-bit'],[55,'Kelon 48-bit']],
  'RHOSS': [[57,'Rhoss 96-bit']],
  'TECHNIBEL_AC': [[58,'Technibel 56-bit']],
  'TRANSCOLD': [[59,'Transcold 136-bit']],
  'TROTEC':      [[60,'Trotec STD 56-bit'],[61,'Trotec3550 120-bit'],[31,'Midea 48-bit']],
  'TROTEC_3550': [[61,'Trotec3550 120-bit'],[60,'Trotec STD 56-bit'],[31,'Midea 48-bit']],
  'TRUMA': [[62,'Truma (variable)']],
  'BOSCH144': [[63,'Bosch144 144-bit']],
  'ARGO':      [[64,'Argo WREM2 96-bit'],[65,'Argo WREM3 (variable)']],
  'ARGO_WREM3':[[65,'Argo WREM3 (variable)'],[64,'Argo WREM2 96-bit']],
  'EUROM': [[66,'Eurom 96-bit']],
  'YORK': [[67,'York 88-bit']],
  'BLUESTARHEAVY': [],
}
```

---

## ALL VARIANTS ARRAY (exact, 69 entries, IDs 0–68)

```js
const ALL_VARIANTS = [
  { id:  0, name: 'Mitsubishi STD 144-bit'     },
  { id:  1, name: 'Mitsubishi 112-bit'          },
  { id:  2, name: 'Mitsubishi 136-bit'          },
  { id:  3, name: 'Mitsubishi Heavy 152-bit'    },
  { id:  4, name: 'Mitsubishi Heavy 88-bit'     },
  { id:  5, name: 'Daikin STD 280-bit'          },
  { id:  6, name: 'Daikin2 312-bit'             },
  { id:  7, name: 'Daikin64 64-bit (toggle)'    },
  { id:  8, name: 'Daikin128 128-bit (toggle)'  },
  { id:  9, name: 'Daikin152 152-bit'           },
  { id: 10, name: 'Daikin160 160-bit'           },
  { id: 11, name: 'Daikin176 176-bit'           },
  { id: 12, name: 'Daikin216 216-bit'           },
  { id: 13, name: 'Fujitsu 56-128-bit'          },
  { id: 14, name: 'Panasonic 216-bit'           },
  { id: 15, name: 'Panasonic32 32-bit (toggle)' },
  { id: 16, name: 'Samsung 112/168-bit'         },
  { id: 17, name: 'LG Standard — GE6711AR2853M'},
  { id: 18, name: 'Hitachi STD 224-bit'         },
  { id: 19, name: 'Hitachi AC1 104-bit'         },
  { id: 20, name: 'Hitachi AC264 264-bit'       },
  { id: 21, name: 'Hitachi AC296 296-bit'       },
  { id: 22, name: 'Hitachi AC344 344-bit'       },
  { id: 23, name: 'Hitachi AC424 424-bit'       },
  { id: 24, name: 'Toshiba 72-bit+'             },
  { id: 25, name: 'Haier STD 72-bit'            },
  { id: 26, name: 'Haier YRW02 112-bit'         },
  { id: 27, name: 'Haier AC160 160-bit'         },
  { id: 28, name: 'Haier AC176 176-bit'         },
  { id: 29, name: 'Kelvinator 128-bit'          },
  { id: 30, name: 'Gree 64-bit'                 },
  { id: 31, name: 'Midea 48-bit'                },
  { id: 32, name: 'Midea24 24-bit'              },
  { id: 33, name: 'Coolix 24-bit'               },
  { id: 34, name: 'Coolix48 48-bit'             },
  { id: 35, name: 'Carrier64 64-bit'            },
  { id: 36, name: 'Sharp 104-bit'               },
  { id: 37, name: 'Whirlpool 168-bit (toggle)'  },
  { id: 38, name: 'Electra / AUX 104-bit'       },
  { id: 39, name: 'Vestel 56-bit'               },
  { id: 40, name: 'TCL 112-bit (TAC09CHSD)'     },
  { id: 41, name: 'TCL 96-bit (GZ055BE1)'       },
  { id: 42, name: 'Teco 35-bit'                 },
  { id: 43, name: 'Goodweather 48-bit'          },
  { id: 44, name: 'Neoclima 96-bit'             },
  { id: 45, name: 'Amcor 64-bit'                },
  { id: 46, name: 'Airwell 34-bit (toggle)'     },
  { id: 47, name: "De'Longhi 64-bit"            },
  { id: 48, name: 'Sanyo STD 72-bit'            },
  { id: 49, name: 'Sanyo88 88-bit'              },
  { id: 50, name: 'Voltas 120-bit'              },
  { id: 51, name: 'Mirage 120-bit'              },
  { id: 52, name: 'Corona 168-bit'              },
  { id: 53, name: 'Airton 56-bit'               },
  { id: 54, name: 'EcoClim 56-bit'              },
  { id: 55, name: 'Kelon 48-bit'                },
  { id: 56, name: 'Kelon168 168-bit'            },
  { id: 57, name: 'Rhoss 96-bit'                },
  { id: 58, name: 'Technibel 56-bit'            },
  { id: 59, name: 'Transcold 136-bit'           },
  { id: 60, name: 'Trotec STD 56-bit'           },
  { id: 61, name: 'Trotec3550 120-bit'          },
  { id: 62, name: 'Truma (variable)'            },
  { id: 63, name: 'Bosch144 144-bit'            },
  { id: 64, name: 'Argo WREM2 96-bit'           },
  { id: 65, name: 'Argo WREM3 (variable)'       },
  { id: 66, name: 'Eurom 96-bit'                },
  { id: 67, name: 'York 88-bit'                 },
  { id: 68, name: 'LG2 — AKB75215403'           },
]
```

---

## INITIALIZATION SEQUENCE (on app mount)

```
buildUniversalDropdown()  // populate All Protocols dropdown from ALL_VARIANTS
resetAdminUi()
buildLearnSlotGrid()
resetLearnUi()
updateVersionLine()

// Check BLE availability:
if BLE not supported: setStrip('err', 'Bluetooth not supported on this device'), disable connect button
```

---

## ANIMATION SPECS (Reanimated 3)

All `useAnimatedStyle` driven. No `LayoutAnimation`. No CSS transitions.

| Element | Animation | Spec |
|---|---|---|
| Button press | Scale bounce | Press: 0.95 (80ms), release: 1.02 (80ms) → 1.0 (70ms) |
| Status strip bg/text | Color crossfade | 300ms ease |
| IR cell flash | Background opacity | rgba(0,245,255,0.15) → 0, 500ms ease-out |
| Active variant tag | Slide + fade | height 0→auto + opacity 0→1, 250ms ease |
| Admin fields reveal | Slide + fade | Same as above |
| Find RX button glow | Pulse shadow | 0→7px→0 orange glow, 1.5s ease-in-out infinite |
| BLE dot (connected) | Radial pulse ring | Scale 1→2 opacity 1→0, 1.5s infinite |
| Status dot (default) | Opacity blink | 1→0.3→1, 2s infinite |
| Check item shake | TranslateX | 0→-5→+5→-3→0, 350ms ease |
| Dropdown bottom sheet | Slide up | Y: screenHeight→0, 300ms spring |
| Save btn success | Background flash | cyan-purple → green, 200ms |
| Scanline overlay | TranslateY | 0 → repeat-unit, 8s linear infinite |
| Card appear | Fade + slight slide | opacity 0→1 + translateY 10→0, 200ms ease on mount |

---

## PLATFORM NOTES

- iOS: BLE requires `NSBluetoothAlwaysUsageDescription` in Info.plist
- Android: Requires `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION` permissions, request at runtime before first scan
- Handle BLE permission denial gracefully: show error strip, disable connect button
- Use `react-native-ble-plx` `BleManager` singleton, initialize once on app mount
- Decode all BLE values from base64 before parsing (react-native-ble-plx returns base64)
- Encode commands to base64 before writing (react-native-ble-plx writeCharacteristic expects base64)

---

## WHAT NOT TO DO

- Do NOT use native `<Picker>` or `<select>` — all dropdowns must be custom bottom sheets
- Do NOT use `StyleSheet.create` color tokens that differ from the design system above
- Do NOT add features not present in the original — no settings screen, no history, no cloud sync
- Do NOT simplify the Wi-Fi SSID parsing logic — it must handle colons in SSIDs correctly
- Do NOT change any BLE UUID, command string, or message key
- Do NOT change the PROTOCOL_LOOKUP table ordering — candidate priority matters for device behavior
- Do NOT change the ALL_VARIANTS IDs — they map directly to firmware #defines
- Do NOT skip the save transaction ACK system — premature success display breaks UX
- Do NOT use timeouts to fake state — always wait for actual BLE ACKs
- Do NOT put `findRxActive` state in each card separately — it is shared and both buttons update together
