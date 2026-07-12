# Phase 4 Milestone 3 Interface Audit

Status: frozen baseline for the approved simplification milestone

Date: 12 July 2026

## Audit method

Repository-truth review of the current Home, bottom navigation, Transactions, CSV Import, regular payments, budgets, Loans, Property records and Settings components. Presentation may change; existing functionality remains required.

| Area | Primary purpose/action | Must remain visible for safety | Simplification target | Progressive disclosure target | Main risks |
|---|---|---|---|---|---|
| App shell/navigation | Identify SpendGrove and move between current routes | Current five routes and account state | Shorter header and current-task hierarchy | Account detail where supported | Narrow-width crowding and labels |
| Home | Understand this month and act on review needs | Current spending facts and relevant errors | Remove repeated entry actions; hide empty feature blocks | Category/comparison detail | Dense stacked cards |
| Transactions | Review everyday transactions; add one | Date, description, category and amount | One Add action; concise rows | Edit, duplicate, Property link, archive/delete, notes/source detail | Correction access |
| Manual transaction | Save a reviewed transaction | Type, amount, date, description, category and relevant Property choice | One Save action; shorter hints | CSV-match hint, notes, uncommon options | Hiding save-critical values |
| CSV upload | Choose one file | File rules and actionable privacy error | One Choose action and concise privacy assurance | Repeated privacy explanation | Private-field handling |
| Mapping | Confirm required columns | Date/amount/description choices and preview | Compact confirmed state | Overrides and technical column detail | Mapping logic must not change |
| Import review | Decide Import, Skip or Merge and commit | Row values, warnings and required choices | Clear progress and one final Import action | Duplicate detail, merchant rules, mapping override | Review semantics |
| Import completion | Confirm result and review transactions | Safe count and failure retry state | One Review transactions action | Technical batch detail | Retry idempotency |
| Regular-payment suggestions | Confirm or dismiss | Safe reason and editable values | Beginner labels; contextual actions | Why suggested | Detector thresholds |
| Confirmed regular payments | Review/edit planning records | Label, amount, familiar frequency | Compact active list | Edit/archive | No payment implication |
| Dismissed/archived regular payments | Recover prior choices | Show again or Restore | Secondary collapsed sections | History detail | Ownership/stale/duplicate checks |
| Budgets | Create and understand monthly limits | Category, monthly amount, spent and remaining | Calm progress; hide empty/archived detail | Edit/archive/history | Formula and no-rollover |
| Loans | Manage Loan Accounts first | Nickname/type/status and history access | Reduce specialist copy/actions | Edit/archive, repayment components and matches | Loan/property distinctions |
| Property records/reporting | Review linked records/export | Nickname, eligible records, disclaimer | Show only when Property exists | Report/export and source-path detail | Tax implication/eligibility |
| Settings | Everyday preferences/privacy | Simple Mode default and account access | Group Everyday, Privacy/data, Advanced | History, development reset, technical management | Destructive confirmation |
| Global states | Recover from failures | Safe error and retry guidance | Short consistent copy; hide unusable controls | Diagnostics stay internal | Duplicate submit/focus |

## Duplicated or unnecessary presentation found

- Home repeats Transactions and Import entry actions before rendering financial sections.
- Transaction detail surfaces expose Edit, Duplicate and Delete together.
- CSV mapping keeps full matching controls prominent after confirmation.
- Active and archived lifecycle management compete at equal visual weight.
- Loans combines setup, history, matching, Property management and reporting in one large manager.
- Settings places everyday preferences, account history and development reset at one level.
- Privacy/no-movement explanations repeat where a shorter contextual message is sufficient.
- Internal cadence, confidence and reconciliation terms must not leak into beginner copy.

## Essential functionality that cannot be removed

Review-before-commit and Import/Skip/Merge; duplicate/invalid-row decisions; transaction create/edit/correction and soft-delete access; Property link/unlink/relink; regular-payment confirm/dismiss/edit/archive/restore and dismissal undo; budget create/edit/archive/restore; loan correction, unlink-before-edit, archive/restore and repayment matching; Property linked-record review/export and disclaimer; destructive confirmations, safe retry, privacy and ownership enforcement.

## Mobile and accessibility baseline risks

Five-item navigation label/target sizing; long merchant/category/loan/Property names; large stacked managers; icon discoverability; semantic expandable controls; live errors/status; action wrapping and horizontal overflow.

## Acceptance boundary

Every implementation PR must prove that removed surface clutter is unnecessary or still reachable contextually. No simplification may alter stored data, financial results, import outcomes, relationship cardinality or privacy controls.
