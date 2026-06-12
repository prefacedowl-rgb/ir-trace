# IrTrace React Native App — Eco / Nature Design System Prompt

Redesign the IrTrace React Native app with a clean, environment-friendly aesthetic. The design must feel fresh, breathable, and grounded in nature — like a premium sustainability brand app. Every feature and all logic stays identical to the original. Only the visual design changes.

---

## BACKGROUND

Use a full-screen nature photograph as the app background. The photo should be a high-resolution landscape — forest canopy, misty mountains, soft green meadow, or morning sunlight through leaves. The image must sit behind all content at **8–12% opacity** (very subtle, almost ghost-like), so it provides texture and warmth without competing with content readability.

Implementation:
- Use an `<ImageBackground>` component wrapping the entire screen
- Set `resizeMode="cover"` so it fills the screen at all sizes
- Apply an `opacity` of `0.10` to the image layer only (not the content)
- Over the image, place a solid white base layer at 92% opacity so the overall background reads as clean white with the photo barely visible beneath
- The final visual effect: a crisp white app where, if you look carefully, you can see soft natural texture in the background

Recommended background photo sources to bundle locally:
- A top-down aerial photo of a forest canopy (deep greens)
- OR a soft bokeh photo of leaves with light filtering through
- OR a misty mountain valley (cool greens and grays)
- Use one consistent photo throughout — no dynamic switching

---

## COLOR PALETTE

All colors are light, clean, and nature-inspired. No dark backgrounds. No neons.

```
--white:        #FFFFFF
--off-white:    #F7F9F5          (very slight green tint to white)
--surface:      #FFFFFF          (card backgrounds — pure white)
--surface2:     #F2F5F0          (card header strip — pale sage)
--bg:           #EEF2EB          (page background — lightest sage green)
--border:       #D8E0D2          (borders — soft sage gray)
--text:         #1A2318          (primary text — deep forest green, near black)
--muted:        #6B7D65          (secondary text — muted sage)

--green:        #2D7A3A          (primary accent — forest green)
--green-lt:     #E8F5EA          (green tint background)
--green-mid:    #4CAF50          (medium green for active states)

--sage:         #7DAA72          (secondary accent — sage green)
--sage-lt:      #EFF5ED          (sage tint background)

--sky:          #4A90A4          (info/blue accent — sky through leaves)
--sky-lt:       #E8F4F8          (sky tint background)

--amber:        #C17F24          (warning — warm amber/bark)
--amber-lt:     #FDF3E3          (amber tint background)

--red:          #C0392B          (error/danger — deep clay red)
--red-lt:       #FDECEA          (red tint background)

--shadow:       rgba(45, 122, 58, 0.08)   (green-tinted shadow)
--shadow-md:    rgba(45, 122, 58, 0.14)
```

---

## TYPOGRAPHY

- **Primary font:** `Inter` or `DM Sans` — clean, humanist, highly readable
- **Monospace font:** `JetBrains Mono` — used for all data values, log entries, version numbers, command strings
- **Card section labels:** Inter 11px, 0.12em letter-spacing, UPPERCASE, color `--muted`
- **Data values:** JetBrains Mono 20px bold, color `--text`
- **Button labels:** Inter 700, 13px, uppercase or title-case
- **Body text / descriptions:** Inter 13px, color `--muted`, line-height 1.6
- **Brand name:** Inter 800, 17px, color `--text`
- **Log entries:** JetBrains Mono 11px

---

## CARDS

Each card is a pure white rounded rectangle floating above the nature background.

```
background:    #FFFFFF
border-radius: 16px
border:        1px solid var(--border)      (#D8E0D2)
shadow:        0 2px 12px rgba(45,122,58,0.08),
               0 1px 3px  rgba(0,0,0,0.04)
overflow:      hidden
```

**Card header strip:**
```
background:    #F2F5F0    (pale sage — matches --surface2)
border-bottom: 1px solid var(--border)
padding:       10px 16px
```

Card header label: Inter 11px uppercase, `--muted` color, bold, letter-spacing 0.1em.

Cards should feel like clean paper cards sitting on a table in a garden — very light, minimal, pure.

---

## STATUS PILLS

Rounded capsule, Inter 700 11px.

| State | Background | Text | Border |
|---|---|---|---|
| idle | `#F2F5F0` | `--muted` (#6B7D65) | `--border` |
| live / ok | `#E8F5EA` | `--green` (#2D7A3A) | `#A5D6A7` |
| warn | `#FDF3E3` | `--amber` (#C17F24) | `#F5CBA7` |
| err | `#FDECEA` | `--red` (#C0392B) | `#F5B7B1` |
| proto | `#E8F4F8` | `--sky` (#4A90A4) | `#AED6E8` |

No glow effects on pills — clean flat look only.

---

## BUTTONS

All buttons have soft rounded corners (border-radius 10px), Inter 700 font, and subtle press feedback.

Press animation: scale 0.97 on press, back to 1.0 on release (120ms ease). No bounce overshoot.

### Primary Button (Connect, Save All)
```
background: linear-gradient(135deg, #2D7A3A, #4CAF50)
color: #FFFFFF
shadow: 0 3px 10px rgba(45,122,58,0.30)
border: none
```
Hover/focused state: darken gradient slightly.

### Danger Button (Disconnect, Delete)
```
background: #C0392B
color: #FFFFFF
shadow: 0 2px 8px rgba(192,57,43,0.25)
border: none
```

### Secondary Button (RE-SCAN, Test OFF, Test ON, Set Temp, etc.)
Each semantic variant:

- **Off / danger tone:** background `--red-lt`, color `--red`, border `1.5px solid #F5B7B1`
- **On / success tone:** background `--green-lt`, color `--green`, border `1.5px solid #A5D6A7`
- **Temp / info tone:** background `--sky-lt`, color `--sky`, border `1.5px solid #AED6E8`
- **Neutral:** background `#F2F5F0`, color `--muted`, border `1px solid --border`
- **Learn/Capture:** background `--sky-lt`, color `--sky`, border `1.5px solid #AED6E8`
- **Replay/Test:** background `--amber-lt`, color `--amber`, border `1.5px solid #F5CBA7`
- **Save:** background `--green-lt`, color `--green`, border `1.5px solid #A5D6A7`
- **Discard:** background `#F2F5F0`, color `--muted`, border `1px solid --border`
- **Admin Unlock:** background `#1A2318`, color `#FFFFFF`, border none
- **Admin Save:** background `--red`, color `#FFFFFF`

Disabled state for all: opacity 0.38, no shadow.

---

## INPUTS AND SELECTS

```
background:    #FFFFFF
border:        1.5px solid var(--border)   (#D8E0D2)
border-radius: 10px
padding:       11px 14px
font:          JetBrains Mono 13px
color:         --text
placeholder:   --muted at 60% opacity
```

Focus state:
```
border-color: var(--green)      (#2D7A3A)
shadow:        0 0 0 3px rgba(45,122,58,0.12)
```

Disabled state:
```
background:  #F7F9F5
opacity:     0.55
```

Password eye-toggle icon: color `--muted`, switches to `--green` when input is focused.

---

## HEADER

```
background:      rgba(255,255,255,0.92)
backdrop-filter: blur(12px)              (frosted glass effect — iOS/Android supported via @react-native-community/blur)
border-bottom:   1px solid var(--border)
height:          58px
position:        sticky / absolute top
```

**Brand icon:** 36×36 rounded square (border-radius 10), forest green gradient background (`#2D7A3A` → `#4CAF50`), white wifi/radio SVG icon.

**Guide button:** background `#F2F5F0`, color `--green`, border `1px solid --border`, Inter 700 13px.

**Connect button idle:** green gradient, white text, small white dot (50% opacity).
**Connect button connected:** background `--red-lt`, color `--red`, border `1px solid #F5B7B1`, red dot (solid, with soft slow pulse ring in red at 20% opacity).

---

## STATUS STRIP

Full-width bar under header.

```
font:      JetBrains Mono 11px
padding:   7px 20px
```

State backgrounds and text (smooth 300ms animated transition):
- default: background `--sky-lt` (#E8F4F8), text `--sky` (#4A90A4), border-bottom `1px solid #AED6E8`
- ok: background `--green-lt` (#E8F5EA), text `--green` (#2D7A3A), border-bottom `1px solid #A5D6A7`
- err: background `--red-lt` (#FDECEA), text `--red` (#C0392B), border-bottom `1px solid #F5B7B1`
- warn: background `--amber-lt` (#FDF3E3), text `--amber` (#C17F24), border-bottom `1px solid #F5CBA7`

Dot: 6px circle, currentColor. Blinks for default and warn states (2s cycle). Solid for ok and err.

---

## IR RECEIVED SIGNAL CARD

Data cells use a 2-column grid layout with 1px `--border` dividers between them.

**Field label:** Inter 11px uppercase, `--muted` color.
**Value display:**
- Empty `"—"`: color `#C5CDD0`, fontSize 16px
- Protocol: color `--sky` (#4A90A4), fontSize 16px
- Power ON: color `--green` (#2D7A3A), bold
- Power OFF: color `--red` (#C0392B), bold
- N/A: color `#C5CDD0`, fontSize 14px
- Default: color `--text` (#1A2318), bold

**Cell flash animation on new value:** background pulses from `rgba(45,122,58,0.10)` to transparent, 500ms ease-out.

**Last timestamp:** JetBrains Mono 10px, `--muted`, shown top-right of card header after first signal.

---

## TEMPERATURE CONTROL ROW

Glass-effect row with very light sage background:
```
background:    #F2F5F0
border:        1px solid var(--border)
border-radius: 12px
padding:       10px 14px
```

`−` and `+` buttons:
```
width/height:  36px
border-radius: 8px
background:    #FFFFFF
border:        1.5px solid var(--border)
color:         --text
```

On hover/press: `border-color: --green`, `background: --green-lt`, `color: --green`.

Temperature display: JetBrains Mono 28px bold, `--green` color. `°C` suffix 14px `--muted`.

---

## LEARN SLOT GRID

Each slot cell:
```
border-radius: 10px
border:        1.5px solid var(--border)
background:    #F7F9F5
padding:       8px 4px
```

State styles:
| State | Border | Background | Dot |
|---|---|---|---|
| EMPTY | `--border` (#D8E0D2) | `#F7F9F5` | `--border` |
| CAPTURED | `--amber` (#C17F24) | `--amber-lt` (#FDF3E3) | `--amber` |
| SAVED | `--green` (#2D7A3A) | `--green-lt` (#E8F5EA) | `--green` |
| selected | `--sky` (#4A90A4) outline overlay | — | — |
| disabled | 38% opacity | — | — |

---

## FIND AC RECEIVER BUTTON

Idle:
```
background:    #F2F5F0
border:        1.5px solid var(--border)
color:         --muted
```

Active/scanning:
```
background:    --amber-lt (#FDF3E3)
border:        1.5px solid --amber (#C17F24)
color:         --amber
```

Scanning pulse animation: shadow `0 0 0px → 0 0 8px rgba(193,127,36,0.40) → 0 0 0px`, 1.5s ease-in-out infinite.

Hint text below: `--amber` color, blinks on FIND_RX:PULSE.

---

## MESSAGE LOG

Log area background: `#FAFCF9` (very pale sage white).
Log entry colors:
- `rx` (incoming BLE): `--sky` (#4A90A4)
- `tx` (sent commands): `--green` (#2D7A3A)
- `err`: `--red` (#C0392B)
- `sys` (system): `--muted` (#6B7D65), italic

Timestamp: `#A0ADB9`, JetBrains Mono 11px.

Scrollbar (if visible): thin, sage-tinted.

Manual send input: same input styles as above. Send button: primary green gradient.

---

## SAVE CONFIGURATION CARD

Check item rows:
```
border-radius: 8px
background:    #F7F9F5
border:        1px solid var(--border)
padding:       9px 12px
font:          JetBrains Mono 12px
```

Ready state: background `--green-lt`, border `#A5D6A7`, text `--green` bold.
Missing state: background `--red-lt`, border `#F5B7B1`, text `--red` bold + shake animation.

Save button states:
- Disabled: background `#D8E0D2`, color `#9AADA4`
- Enabled: forest green gradient
- Saving: background `--amber` (#C17F24)
- Success: background `--green` (#2D7A3A)

---

## ADMIN CARD

Admin unlock button:
```
background: #1A2318    (deep forest, near black)
color:      #FFFFFF
border-radius: 10px
```

Admin save button:
```
background: --red (#C0392B)
color:      #FFFFFF
```

Admin fields revealed section: slides down with 250ms ease-in animation. Background `--surface2` (#F2F5F0), border `1px solid --border`, border-radius 10px, padding 14px.

---

## ANIMATIONS (Reanimated 3, light and calm — no bouncy overshoot)

| Element | Animation | Spec |
|---|---|---|
| Button press | Gentle scale | 0.97 press, 1.0 release, 120ms ease |
| Status strip | Color crossfade | 300ms ease, all properties |
| IR cell flash | Background fade | rgba(45,122,58,0.10) → 0, 500ms ease-out |
| Active variant tag | Slide + fade | height 0→auto, opacity 0→1, 220ms ease |
| Admin fields reveal | Slide + fade | Same, 250ms ease |
| Find RX glow | Pulse shadow | amber glow 0→8px→0, 1.5s ease-in-out infinite |
| BLE dot (connected) | Soft pulse ring | scale 1→1.8, opacity 1→0, 2s infinite |
| Status dot (idle/warn) | Opacity blink | 1→0.3→1, 2s infinite |
| Check row shake | TranslateX | 0→-5→+5→-3→0, 350ms ease |
| Dropdown sheet | Slide up | Y: screenHeight→0, spring(damping:20, stiffness:200) |
| Card mount | Fade in | opacity 0→1, translateY 8→0, 180ms ease |
| Background photo | Static | No animation — fixed in place |

---

## BACKGROUND IMPLEMENTATION (exact)

```jsx
<View style={{ flex: 1, backgroundColor: '#EEF2EB' }}>
  {/* Nature photo layer */}
  <Image
    source={require('./assets/nature-bg.jpg')}
    style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100%',
      height: '100%',
      opacity: 0.10,
    }}
    resizeMode="cover"
  />
  {/* White wash layer — keeps background mostly white */}
  <View
    style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(238,242,235,0.92)',
    }}
  />
  {/* All app content goes here */}
  <ScrollView>
    {/* cards... */}
  </ScrollView>
</View>
```

The background image (`nature-bg.jpg`) should be bundled locally in the `assets/` folder. Use a high-resolution photo (at least 1080×1920px) of forest, meadow, or mountain scenery. Greens and soft blues work best.

---

## WHAT STAYS THE SAME (do not change these)

- All BLE UUIDs and all command strings
- All feature logic, state machines, and data flow
- The PROTOCOL_LOOKUP table (all entries, all ordering)
- The ALL_VARIANTS array (all 69 entries, exact IDs)
- The save transaction ACK system
- The Wi-Fi SSID parsing logic
- The learn slot grid structure (16 slots, exact names)
- The message log system (300 line cap, auto-scroll)
- The initialization sequence (wget, status, LRN:STATUS)
- The find-rx shared state between both cards
- All BLE message routing (onNotify switch)

---

## WHAT CHANGES (design only)

- Background: dark → white with nature photo ghost
- Colors: neon/dark → forest greens, sage, clean whites
- Cards: dark glass → pure white with soft green shadow
- Buttons: neon gradients → forest green gradient (primary), soft semantic colors (secondary)
- Typography: same fonts, but lighter weights for body text
- Animations: toned down — no scale overshoot, no heavy glow, calm and smooth
- Pills: same logic, eco color palette
- Inputs: same structure, white background, green focus ring
- Status strip: same logic, eco palette

---

## TONE AND FEEL

The app should feel like it was made by a premium sustainability tech brand — think nothing wasted, everything purposeful. Clean white space. Soft greens. The nature background is barely visible but you know it's there, grounding the whole experience. Buttons feel satisfying but not flashy. Data is clear and readable. The overall impression: trustworthy, clean, connected to nature.
