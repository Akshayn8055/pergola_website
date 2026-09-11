# Custom Deck Builder

## Overview
Add deck-building choices directly after Pergola Enclosures. Customers can start with either a standalone **Custom Decks** card or a separate **Deck + Pergola** card, then configure the deck visually in the existing 3D configurator.

## What will be added
- Add two structure cards after Pergola Enclosures:
  - **Custom Decks** for a standalone deck.
  - **Deck + Pergola** for a deck underneath and around a pergola or outdoor room.
- Generate and use a polished deck-with-pergola image for the new card artwork.
- Add five shape choices based on the supplied reference:
  - Square
  - Notched
  - L-shaped left
  - L-shaped right
  - T-shaped
- Add standard size choices plus custom length, width, and numeric deck height controls.
- Limit deck materials to **Composite Deck** and **Timber Deck**.
- Add visual board colour and timber-species swatches that update the 3D deck.
- Keep horizontal and vertical board-direction choices.
- Add independent Front, Rear, Left, and Right stair sections, each with its own width control.
- Add railing choices for None, Aluminium Balustrade, and Glass Balustrade, with selectable handrail options.
- Update the live summary and estimate so the selected deck material, stairs, railing type, and elevated height are reflected.

## 3D behaviour
- Build each deck shape from stable rectangular sections so boards, framing, stairs, and railings follow the selected footprint.
- Render elevated support framing when height is raised.
- Place stairs on every enabled side using the selected width.
- Render aluminium rails as metal posts/rails and glass rails as transparent panels, with the chosen handrail treatment.
- In Deck + Pergola mode, position the pergola above the deck while allowing the deck footprint to extend around it.

## Technical details
- Extend the deck configuration types for five shapes, per-side stair settings, railing material, handrail style, and deck placement mode.
- Reuse the existing configurator state, pricing, dimensions, material flow, and quote summary rather than creating a separate configurator.
- Update the deck model and scene composition without changing existing pergola-only behaviour.
- Keep the supplied shape image as visual reference only; create the shape choices in the interface rather than embedding the screenshot.

## Verification
- Check both new entry cards and every deck shape.
- Verify material/species swatches, dimensions, height, board direction, multiple stair sections, railing types, and handrails update the 3D preview.
- Verify standalone and Deck + Pergola modes on desktop and mobile.
- Run the relevant type checks and inspect the live configurator for layout or rendering issues.
