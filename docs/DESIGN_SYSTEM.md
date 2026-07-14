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


## Phase 4 Milestone 4 binding refinement

Controlling contract: `docs/PHASE_4_MILESTONE_4_UI_OVERHAUL_CONTRACT.md`.

### Approved assets

- full wordmark: `assets/brand/spendgrove-logo.png`;
- compact icon source: `assets/brand/app-icon-source.png`;
- current application icon: `app/icon.svg`.

Use the full wordmark in desktop/sidebar contexts and the compact approved symbol in constrained contexts. Preserve aspect ratio and colours. Do not redraw, distort or add an unnecessary surrounding shape.

### Final token direction

| Role | Value | Use |
|---|---:|---|
| Evergreen | `#0C4B4B` | Brand, primary actions, active navigation |
| Leaf green | `#48B879` | Selection and meaningful positive progress |
| Supporting teal | `#247F78` | Quiet accent |
| Canvas | `#F7F8F6` | App background |
| Surface | `#FFFFFF` | Primary surface |
| Strong text | `#163333` | Primary text |
| Muted text | `#5F716F` | Metadata/helper text |
| Border | `#DDE5E2` | Subtle separation |
| Focus | `#177C72` | Visible focus ring |
| Warning | `#B26A00` | Needs review |
| Danger | `#B42318` | Errors/destructive confirmation |

White is the default primary surface. Pale green is not the default card fill. Green is reserved for brand, the primary action, selection and meaningful progress. Normal text and controls must meet WCAG AA contrast.

### Density and hierarchy

- compact rows target approximately 56-72px where content permits;
- practical interactive targets remain at least 44px;
- ordinary card/section padding is 16-20px;
- use modest 10-18px radii and minimal shadows;
- use whitespace, headings and dividers before another rounded container;
- use sentence case and a small set of type roles: page title, section title, primary amount, row title, metadata and helper text;
- use tabular numerals for primary amounts.

One primary action is permitted per page or major section. Secondary actions are neutral or outlined. Detail and destructive actions belong in row selection, detail or More. Routine Expense, Income, Imported, Matched, Active and Linked states are not badges.

### Responsive shell

Primary destinations remain exactly Home, Transactions, Loans, Import and Settings.

- mobile: compact safe-area bottom navigation;
- tablet/desktop: compact left rail/sidebar with approved wordmark;
- no sixth destination;
- active destination is visible without colour alone;
- desktop uses aligned lists and workflow-appropriate widths, not stretched mobile cards.

### Interaction and state patterns

- reveal optional fields, history, correction and recovery only when requested;
- only one editor/detail is open at a time where practical;
- loading is compact and announced;
- empty states offer one useful next action;
- success/error copy is short, actionable and privacy-safe;
- dialogs require an accessible name, Escape/Cancel and focus return;
- hidden histories must not be rendered or fetched merely for summary screens;
- no new component library or font package is required.

### Review widths

Where connected visual access permits, verify approximately 390px, 768px, 1024px and 1440px with no horizontal overflow, obscured actions or stretched mobile navigation.
