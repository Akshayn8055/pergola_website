# Flyover option for the Louvered Roof Pergola

Add a new style option called **Flyover**, shown only for the Louvered Roof Pergola, where the roof is attached high on the house wall and slopes down towards the front posts. A pitch control lets the customer set how steep that slope is.

## What the customer sees

- In the **Style** step, the Type list gains a sixth pill: **Flyover** (only for the Louvered Roof Pergola; all other models keep the current five).
- When Flyover is selected, a **Pitch** slider appears with the range 0° to 25° and a number box next to it, defaulting to 8°, matching the reference screenshot.
- In the 3D view the roof rises at the wall side and drops towards the front, following the chosen pitch. Two front posts carry the low edge; the rear edge sits on a wall-mounted beam. At 0° the roof is flat, like the current wall-mounted look.
- The height labels keep showing the post height, plus the higher wall-attachment height as the pitch increases.

## Technical notes

- `src/types/configurator.ts`: add `'flyover'` to `MountingType`; add `roofPitch: number` to `PergolaConfig` with default `8`.
- `src/components/configurator/ConfigPanel.tsx`:
  - append the Flyover entry to `mountingTypes`, filtered so it only renders when `config.pergola.type === 'pro'`.
  - render a pitch slider (0–25, step 1) plus numeric input when `mounting === 'flyover'`, writing `roofPitch`.
- `src/components/configurator/models/PergolaModel.tsx`:
  - treat `flyover` like `wall-mounted` for posts (two front posts) and for the rear wall.
  - front posts shorten / rear beam raises by `tan(pitch) * width`, so the roof plane pivots on the front edge and lifts at the wall.
  - wrap the roof assembly (perimeter frame, blades, centre rail, fascia, LED strips) in a group rotated by the pitch around the X axis, pivoting at the front edge, so blades and lighting tilt together.
  - clamp so the raised rear stays within the current maximum height.
- Pricing and PDF output are unchanged; `flyover` is stored in the existing `mounting` field, and `roofPitch` is saved with the rest of the pergola config.
