# SpendGrove Design System

## Brand direction

SpendGrove should feel calm, private, modern, premium and beginner-friendly. The interface should align with the SpendGrove green/teal logo and avoid dense spreadsheet-like mobile screens.

## Design principles

- Mobile-first.
- Simple Mode by default.
- Plain-English wording.
- Calm green/teal visual system.
- Generous spacing.
- Rounded cards.
- Large touch targets.
- Clear primary actions.
- No technical parser/provider language in user-facing copy unless necessary.

## Colour direction

Exact values may be refined after final logo assets are added.

| Token | Direction | Usage |
|---|---|---|
| `brand.deepTeal` | Deep teal/navy | Headings, primary text, navigation emphasis |
| `brand.green` | Fresh green | Primary actions, positive progress |
| `brand.teal` | Teal accent | Secondary actions, chips, badges |
| `surface.base` | White/off-white | Main background |
| `surface.mint` | Soft mint | Supportive panels, safe/privacy messages |
| `border.subtle` | Pale grey/green-grey | Card borders/dividers |
| `warning.amber` | Amber | Warnings, needs-review states |
| `danger.red` | Red | Errors only |

## Layout

### Mobile

- Use stacked cards.
- Use bottom navigation for primary areas.
- Avoid wide tables.
- Use status chips and badges.
- Use sticky action footers where helpful.
- Make Import Review readable as cards grouped by status.

### Web/Desktop

- Use wider tables for bulk workflows.
- Use sidebars or larger filter panels where appropriate.
- Preserve the same business logic as mobile.

## Typography

- Use modern, readable typography.
- Maintain clear heading/body/label hierarchy.
- Use sentence case for labels and headings unless a proper noun requires otherwise.
- Avoid jargon for beginners.

## Components

### Buttons

- Primary button: green/teal, clear action verb.
- Secondary button: outlined or subtle.
- Destructive button: red only where genuinely destructive.
- Avoid too many competing primary buttons on one screen.

### Cards

- Rounded corners.
- Subtle border/shadow.
- Clear title and short supporting text.
- Use icon labels where helpful, but do not rely on icon alone.

### Forms

- Large inputs.
- Clear labels.
- Inline validation.
- Australian date and AUD money formatting.
- Advanced fields hidden unless enabled.

### Import Review

Mobile:

- row cards grouped by status;
- merchant/date/amount/category/action visible;
- clear badges for possible duplicate, merge recommended, needs category, private data excluded.

Desktop:

- editable table;
- filters;
- sticky summary;
- bulk actions where approved.

## Accessibility

- Maintain strong contrast.
- Use large touch targets.
- Do not rely on colour alone.
- Label icons.
- Ensure screen-reader-friendly button labels where practical.
- Keep error messages specific and actionable.

## UI flexibility

The agent may make sensible first-pass UI choices. The client may request changes based on screenshots/previews. Approved UI change requests should be handled in the same PR where practical.
