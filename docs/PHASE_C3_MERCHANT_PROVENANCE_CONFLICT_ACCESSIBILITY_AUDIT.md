# Phase C3 Merchant Provenance, Conflict and Accessibility Audit

Date: 26 July 2026  
Status: existing-schema audit and focused implementation contract complete; no implementation or schema change in this document  
Master-plan alignment: Phase C3 — alias/profile/category rule provenance, conflict/correction and Settings accessibility  
Feature-register alignment: MER-02, MER-03, MER-04, MER-06, MER-07, CAT-02

## 1. Objective

Audit the existing Merchant suggestions Settings workflow and define the next independently safe implementation slice using only the current MerchantProfile, MerchantAlias and MerchantRule schema.

The slice must improve:

- plain-English explanation of how a saved merchant suggestion works;
- rule type and date visibility without exposing normalized patterns;
- conflict wording and user choice;
- custom Category presentation;
- keyboard/focus/accessibility treatment;
- recoverable correction wording;
- existing React hook warning hygiene;

without implementing merchant merge, changing historical Transactions, adding provenance fields, changing financial rules or crossing the material schema gate in `PHASE_C3_MERCHANT_MERGE_SCHEMA_ASSESSMENT.md`.

## 2. Sources reviewed

Repository truth reviewed:

- `components/merchant-rule-manager.tsx`;
- `src/server/merchant-rules.ts`;
- `lib/merchant-rules.ts`;
- `lib/account-merchant-rules.ts`;
- `lib/validation/merchants.ts`;
- current merchant routes and tests;
- current Prisma MerchantProfile, MerchantAlias, MerchantRule, Category and Transaction models;
- Phase 7 merchant profile completion contract;
- Phase C3 merchant merge/history contract and schema assessment;
- Review Gates, Definition of Done and Design System.

## 3. Existing strengths

The current workflow already provides:

- owner-scoped account-backed merchant records;
- browser-local preservation when account persistence is unavailable;
- clear separation between profiles, matching names and saved rules;
- edit of cleaned merchant name and suggested Category;
- remove/restore profile lifecycle;
- rename, disable, restore and recoverably delete alias lifecycle;
- disable, restore and recoverably delete rule lifecycle;
- conflict prompt for an alias/name already associated with another merchant;
- explicit statement that rules remain suggestions during review;
- no normalized keys, database IDs or raw bank narration in the UI;
- account-unavailable, corruption recovery, migration and stale-Category messages;
- safe account synchronization through the existing merchant snapshot contract.

The current server preserves:

- authenticated user scope;
- active and non-deleted Category validation;
- private-identifier validation;
- deterministic exact/contains/starts-with rule types;
- profile and exact-rule Category consistency;
- no historical Transaction mutation from a profile edit;
- no direction or transfer-precedence override.

## 4. Current findings

### 4.1 Rule meaning is under-explained

Each saved rule currently displays only:

- its Category label; and
- whether it is disabled.

The user cannot distinguish:

- an exact match;
- a starts-with match; or
- a contains match.

The current model already contains the safe rule type. The UI can explain rule breadth without displaying the raw or normalized pattern.

### 4.2 Exact provenance is not stored

The current MerchantRule model contains:

- profile relation;
- Category relation;
- rule type;
- pattern and normalized pattern;
- priority;
- lifecycle state;
- created and updated timestamps.

It does not contain an authoritative origin such as:

- confirmed during CSV review;
- created directly in Settings;
- migrated from browser-local storage;
- created by a future provider or AI.

The UI must not infer or claim an origin that the schema does not record.

The strongest truthful existing-schema wording is:

- **Saved suggestion**;
- **Saved after review** only where the creation path can be proven by the current user action in that session;
- **Saved on [Australian date]** using `createdAt`;
- a plain-English rule type;
- the suggested Category.

A durable exact provenance feature would require a separate material schema contract and migration. It is not authorised here.

### 4.3 Custom Category display can be inaccurate

Profile Category display checks account-provided `categoryOptions` before seeded categories.

Rule Category display currently uses only `getManualCategory(rule.categoryId)`. An owned custom Category can therefore display `Category unavailable` even while it is active and present in `categoryOptions`.

This is a presentation defect. The focused implementation should resolve rule labels through:

1. active account `categoryOptions`;
2. seeded category registry;
3. neutral `Category unavailable` fallback.

No Category identity or financial meaning changes.

### 4.4 Conflict wording does not clearly state impact

The current prompt says a saved match “already belongs somewhere else” and offers:

- Replace;
- Keep existing;
- Cancel.

The wording does not clearly tell the user that replacing the saved match:

- changes future merchant suggestions;
- does not edit existing Transactions;
- does not automatically change Categories;
- remains subject to review and direction compatibility.

The buttons can also be more explicit than `Replace`.

Recommended choices:

- **Use new merchant for this match**;
- **Keep current merchant**;
- **Cancel**.

### 4.5 Alias edit lacks an explicit cancel control

Alias edit currently presents an input and Save button only. The user must rely on another action or component state change to escape editing.

Add **Cancel** beside Save. Cancel must:

- restore the displayed saved value;
- clear conflict state;
- make no local or account write;
- return focus to the initiating Rename control where practical.

### 4.6 Focus treatment is inconsistent

Several merchant controls do not use the established `focus-visible` ring pattern, including:

- conflict action buttons;
- clear saved suggestions;
- details summary;
- profile edit fields and actions;
- alias and rule actions;
- removed merchant restore.

The focused implementation should use the existing SpendGrove focus token consistently. It must not change colour direction or create a new component system.

### 4.7 Expand/collapse semantics can be strengthened

The merchant-management `<summary>` is keyboard-operable natively, but it lacks:

- a guaranteed minimum touch target;
- visible focus treatment;
- plain helper wording describing what the disclosure contains.

The existing `<details>` pattern may remain. No new navigation destination is needed.

### 4.8 Status messages are safe but not fully classified

The current `message` output uses `role="status"`, which is appropriate for successful loading/saving messages.

Conflict uses `role="alert"`, which is appropriate for a blocking choice.

The implementation should preserve:

- polite status for normal load/save completion;
- alert semantics for blocking errors/conflicts;
- no repeated announcement loops from background account synchronization.

### 4.9 Existing hook warnings should be resolved in scope

The current component has two known `react-hooks/exhaustive-deps` warnings because asynchronous effects use `onDataChange` without listing it as a dependency.

Blindly adding an unstable callback to the dependency arrays could create repeated load/save effects.

The focused implementation should use one of these safe patterns:

- parent wraps `onDataChange` in `useCallback` and the child includes it; or
- child maintains a current callback ref updated by a small dependency-correct effect, and asynchronous account effects call the ref.

The selected approach must prove:

- one account load on mount;
- no render/save loop;
- latest callback is used;
- cancellation guards remain;
- browser-only data is not overwritten after account failure.

### 4.10 Whole-snapshot persistence remains an existing boundary

Merchant edits currently synchronize the complete validated merchant snapshot. This audit does not redesign that persistence model.

The implementation must not:

- add a new API;
- change snapshot deletion semantics;
- change conflict algorithms;
- add cross-tab merge resolution;
- convert merchant management to direct entity-by-entity writes;
- weaken owner or Category revalidation.

Concurrency redesign, if later needed, requires a separate contract.

## 5. Approved existing-schema implementation

### 5.1 Rule presentation helper

Add one pure presentation helper mapping current rule types:

- `EXACT` → `Exact merchant match`;
- `STARTS_WITH` → `Name starts with`;
- `CONTAINS` → `Name contains`.

`REGEX` must not be displayed as an active supported user rule because the durable service currently limits account-loaded rules to exact, contains and starts-with.

The UI must not display:

- `normalizedPattern`;
- raw imported narration;
- database enum text;
- rule priority;
- internal IDs.

### 5.2 Rule summary

Each rule row may display:

- plain rule type;
- suggested Category label;
- `Saved [Australian date]` from `createdAt` where valid;
- `Disabled` text where inactive.

Example:

> Exact merchant match · Groceries · Saved 26 July 2026

The date is history context, not proof of exact creation source.

### 5.3 Provenance wording

At section level, add a concise explanation:

> Saved suggestions come from choices you reviewed. SpendGrove checks them during future reviews; they do not silently edit existing transactions.

This is truthful for the accepted local-first workflow and does not claim a specific import batch or external provider.

Do not use:

- “AI learned”;
- “bank verified”;
- “automatically categorised”;
- “created from this CSV” without a stored relation;
- “always applies”;
- “historical transactions updated”.

### 5.4 Custom Category resolution

Use the same safe Category-label order for profiles and rules:

1. active `categoryOptions` exact ID;
2. seeded manual Category exact ID;
3. `Category unavailable`.

Do not substitute another Category when unavailable.

### 5.5 Conflict prompt

Recommended content:

Heading:

> This matching name is already saved for another merchant

Body:

> It currently suggests [existing Category] for [existing merchant]. Using [requested merchant] will change this saved suggestion for future reviews only. Existing transactions and Categories will not be changed.

Buttons:

- `Use new merchant for this match`;
- `Keep current merchant`;
- `Cancel`.

The conflict response remains local and explicit. No write occurs until a non-cancel resolution is chosen.

### 5.6 Profile Category explanation

Under Suggested Category, use helper text:

> Used as a suggestion during review when it matches the transaction direction. Existing transactions are not changed.

This text must remain visible or programmatically associated with the select.

### 5.7 Alias correction

Alias edit must provide:

- labelled input;
- Save;
- Cancel;
- loading/disabled treatment only if the parent exposes an active save state in a later focused extension;
- no implicit save on blur;
- conflict prompt after attempted Save only.

Cancel clears the draft and conflict without calling `onRenameAlias`.

### 5.8 Remove/delete wording

Preserve current lifecycle semantics but clarify labels where space permits:

- `Remove merchant` remains reversible and source profile appears under Removed merchants;
- alias/rule `Delete` may be presented as `Remove matching name` / `Remove saved rule` if the existing confirmation and test language is updated consistently;
- `Disable` remains the preferred reversible way to temporarily stop a match;
- no hard-delete wording is introduced.

This slice must not add restoration of records with `deletedAt` because current account list queries intentionally exclude them. A future deleted-item recovery workspace would require its own contract.

### 5.9 Accessibility

Every interactive control must have:

- minimum 40–44 px target consistent with current component density;
- visible `focus-visible` ring;
- plain accessible name;
- no colour-only state;
- disabled state communicated in text;
- logical source order.

The management disclosure must:

- retain native details/summary behaviour;
- have a minimum 44 px summary target;
- show visible focus;
- avoid horizontal overflow at 390 px.

Rule and alias rows must wrap cleanly at 390 px.

### 5.10 Status and error semantics

- successful account load/save uses polite status;
- account unavailable uses a neutral status or alert only when user action failed;
- conflict remains an alert;
- validation errors use alert semantics;
- status text contains no merchant history, raw pattern or financial data beyond the specific cleaned merchant names/categories already visible in the active editor;
- background re-renders do not repeatedly announce unchanged status.

### 5.11 Hook-warning correction

The implementation must remove the two MerchantRuleManager hook warnings without:

- disabling ESLint;
- suppressing the rule;
- causing repeated fetch/save;
- creating stale callback behaviour;
- moving account persistence into a new provider.

A focused test should inspect or exercise the selected callback-dependency pattern.

## 6. Explicit exclusions

This slice does not authorise:

- merchant merge or merge preview;
- merchant merge schema or migration;
- apply-category-to-history UI;
- historical Transaction mutation;
- new provenance fields or backfill;
- raw rule-pattern display;
- provider, Basiq or AI origin labels;
- new merchant creation from Settings;
- new rule creation from Settings;
- new API routes;
- changes to snapshot persistence semantics;
- changes to rule matching, priority or conflict algorithms;
- changes to Category compatibility;
- changes to import review or commit;
- packages, providers, secrets or environment changes;
- Production database access;
- Apple, Expo, TestFlight or release actions.

## 7. Privacy and financial safeguards

The implementation preserves:

- cleaned names only;
- no raw CSV or original filenames;
- no bank/account/card/customer identifiers;
- no amounts, balances or Transaction descriptions in merchant Settings;
- owner scope and neutral cross-user errors;
- integer cents and signed direction;
- transfer precedence;
- split and Loan no-double-count rules;
- review-before-commit;
- no existing Transaction changes from profile/rule presentation;
- account export/deletion behaviour unchanged;
- no analytics or external provider payload.

Dates displayed from `createdAt` use Australian formatting and reveal only the user's own low-sensitivity merchant-setting history.

## 8. Required tests

### 8.1 Presentation

- exact, starts-with and contains types map to approved plain-English labels;
- raw/normalized pattern never appears in rendered rule rows;
- custom Category resolves through account Category options;
- seeded Category fallback remains;
- unavailable Category remains explicit;
- created date uses Australian formatting;
- disabled state includes text.

### 8.2 Conflict

- heading and body explain existing and requested choice;
- wording states future-review-only impact;
- wording states existing Transactions/Categories are unchanged;
- use-new choice passes `REPLACE`;
- keep-current choice passes `KEEP_EXISTING`;
- cancel passes no write and clears conflict;
- no financial values or private source data appears.

### 8.3 Alias edit

- Save retains current rename behaviour;
- Cancel calls no mutation callback;
- Cancel restores non-edit view;
- conflict cleared on cancel/new edit;
- keyboard focus and labels are present.

### 8.4 Profile guidance

- suggested Category helper explains review/direction boundary;
- profile Category changes remain future suggestions only;
- no history/category application language is implied.

### 8.5 Accessibility

- summary has visible focus and minimum target;
- buttons/inputs/selects use focus-visible treatment;
- conflict is an alert;
- normal status is polite;
- mobile layout has no fixed-width overflow;
- active/inactive state is not conveyed by opacity alone;
- controls have accessible names.

### 8.6 Hook and persistence boundary

- MerchantRuleManager no longer produces its existing missing-dependency warnings;
- account load does not repeat because `onDataChange` identity changes;
- account save does not loop after server-normalized data returns;
- account failure preserves current browser-only review;
- no new API or persistence path is introduced.

### 8.7 Regression

- profile edit/remove/restore unchanged;
- alias rename/disable/restore/delete unchanged;
- rule disable/restore/delete unchanged;
- clear-saved-suggestions boundary unchanged;
- owner/Category validation unchanged;
- direction and transfer compatibility unchanged;
- no schema, migration or financial change.

## 9. Proposed focused PR sequence

1. This audit and implementation contract.
2. Merchant provenance/conflict/accessibility UI polish and hook-warning correction.
3. Focused synthetic tests plus full exact-head repository verification.
4. Vercel responsive review at 390 px and desktop using synthetic data.
5. Permanent Phase C3 evidence update.

Merchant merge remains separately blocked behind PR #252's material schema gate.

## 10. Acceptance checklist

The implementation is acceptable when:

- users can understand exact/contains/starts-with rule breadth without seeing raw patterns;
- custom Category labels are accurate;
- conflict choices explain their limited impact;
- alias edit can be cancelled explicitly;
- future-suggestion and historical-transaction boundaries are clear;
- focus and disclosure accessibility are consistent;
- current MerchantRuleManager hook warnings are removed safely;
- no persistence, matching, financial, privacy or schema meaning changes;
- focused and full tests pass;
- exact-head Preview is green;
- known limitations remain documented.

## 11. Known limitations after this slice

Even after the approved polish:

- exact rule origin remains unavailable because the schema does not store it;
- merchant merge remains unimplemented;
- apply-category-to-history UI remains tied to the activation/bulk-operation gates;
- deleted aliases/rules remain outside the active management list;
- snapshot concurrency redesign remains outside scope;
- authenticated synthetic client review remains required before Phase C3 closure.

## 12. Next action

Implement the focused existing-schema provenance, conflict wording, custom Category display, alias cancel, focus treatment and hook-warning correction exactly within this contract.

Do not introduce exact provenance fields or merchant merge schema without a separate explicit material schema approval.
