# Phase 5 Consolidated Client Review Checklist

Status: pending client review  
Use: controlled synthetic data only  
Date: 17 July 2026

Do not invite beta users, use real private CSV files for support evidence, run a Production migration or create an App Store submission while completing this checklist.

## Before testing — operator gates

These checks happen in provider dashboards. Record only yes/no or safe labels. Do not copy keys, database URLs, connection strings or private screenshots into GitHub/chat.

### Clerk

- [ ] A Clerk Production instance exists.
- [ ] Vercel Production uses the live-key class from that Production instance.
- [ ] Vercel Preview uses a test/development instance.
- [ ] Production domain and authorised origins are complete.
- [ ] Email verification works with a synthetic account.
- [ ] Password recovery/provider-equivalent recovery works.
- [ ] Sign-out and expired-session behaviour work.
- [ ] Backend identity deletion is enabled and tested with a disposable synthetic account.

### Vercel

- [ ] Production and Preview Clerk variable scopes are different where required.
- [ ] Production and Preview database destinations are different.
- [ ] No secret is scoped to all environments accidentally.
- [ ] Latest intended Production deployment is Ready and associated with the expected main commit.
- [ ] Canonical https://spendgrove.vercel.app resolves to that deployment.
- [ ] No unexplained Production runtime error is present.

### Neon

- [ ] Intended Production branch/database is identified.
- [ ] Intended Preview branch/database is identified.
- [ ] The two destinations are distinct.
- [ ] Migration names have no failed or unresolved state in each destination.
- [ ] Current restore window is recorded and accepted.
- [ ] Branch protection status is recorded.
- [ ] A restore drill has succeeded on non-Production synthetic data.
- [ ] Recovery owner, recovery-point objective and recovery-time objective are agreed.

Stop if these gates cannot be completed safely.

## 1. Signed-out access

Open a private/incognito browser.

- [ ] `/` sends you to sign in.
- [ ] `/transactions` sends you to sign in.
- [ ] `/import` sends you to sign in.
- [ ] `/loans` sends you to sign in.
- [ ] `/settings` sends you to sign in.
- [ ] Returning after sign-in goes only to an internal SpendGrove route.
- [ ] A crafted external redirect URL is ignored.
- [ ] Privacy is public and contains no account data.
- [ ] Help is public and contains no account data.
- [ ] Sign-up is available.
- [ ] No signed-out finance total, transaction, Property, Loan or report is visible.

## 2. Account and session

Use synthetic accounts only.

- [ ] Create a new account.
- [ ] Complete email verification.
- [ ] Sign out and sign back in.
- [ ] Use the recovery flow.
- [ ] Let a session expire or revoke it and confirm finance routes stop returning data.
- [ ] A new account has a true empty state.
- [ ] User A cannot see or change User B's records.
- [ ] Direct API/URL attempts do not reveal whether another user's record exists.
- [ ] Sign-out does not expose the previous account's screen or cached download.

## 3. Browser-local prototype data

If the browser has old prototype data:

- [ ] It remains on that device.
- [ ] It is not counted in the signed-in account.
- [ ] It is not uploaded automatically.
- [ ] It is not merged automatically.
- [ ] It is not deleted on sign-in or sign-out.
- [ ] It does not appear for another signed-in user.
- [ ] Any notice explains the separation without showing private values.
- [ ] No UI describes the local data as synced or backed up.

## 4. Complete account export

Create a synthetic account that exercises all available areas.

- [ ] Settings has one clear export action.
- [ ] Export requires recent identity verification.
- [ ] Cancelling verification creates no download.
- [ ] Successful export downloads one JSON file.
- [ ] The document identifies `spendgrove.account-export` version 1.
- [ ] Money remains signed integer cents.
- [ ] Australian record dates use `YYYY-MM-DD`.
- [ ] UTC timestamps remain ISO 8601.
- [ ] Categories, transactions, splits, imports, merchant learning, Properties, Loans, repayments, links, recurring items, dismissed suggestions and budgets are represented when present.
- [ ] Archived and soft-deleted records are represented with lifecycle state.
- [ ] Relationships use stable IDs.
- [ ] Raw CSV rows are absent.
- [ ] Filenames and filename hashes are absent.
- [ ] Account/card/BSB/customer identifiers are absent.
- [ ] Duplicate fingerprints and raw import descriptions are absent.
- [ ] Free-form audit metadata is absent.
- [ ] No other user's record appears.
- [ ] Export is not saved inside SpendGrove.
- [ ] Repeated click prevention and plain retry errors work.
- [ ] A realistically large synthetic account remains within the current 4.5 MB response limit, or is recorded as exceeding it.

## 5. Immediate account deletion

Use a disposable synthetic account. This is irreversible.

- [ ] Export-first guidance is visible.
- [ ] The consequence lists the account data that will disappear.
- [ ] The normal Settings screen is not dominated by the destructive action.
- [ ] Exact `DELETE` confirmation is required.
- [ ] Recent Clerk verification is required.
- [ ] Cancel performs no deletion.
- [ ] A malformed or signed-out request deletes nothing.
- [ ] A simulated database failure leaves the account intact and does not delete Clerk identity.
- [ ] A simulated Clerk failure after application deletion reports partial completion truthfully.
- [ ] Retrying identity deletion is safe.
- [ ] Complete deletion removes application data and Clerk identity.
- [ ] Sign-in no longer restores deleted finance data.
- [ ] Another user's data remains untouched.
- [ ] Browser-local prototype data remains untouched.
- [ ] No record contents, amounts, emails or counts appear in error logs.

## 6. Privacy and Help

- [ ] Privacy is understandable for a beginner.
- [ ] It accurately states what account data is stored.
- [ ] It accurately states raw CSV is not retained.
- [ ] It identifies Clerk, Vercel and Neon appropriately.
- [ ] It explains cookies/sessions and local-data separation.
- [ ] It explains export and deletion.
- [ ] It says analytics is off.
- [ ] It does not promise legal compliance or professional approval.
- [ ] Help explains manual entry and review-before-commit.
- [ ] Help warns users not to send real CSV files or private screenshots.
- [ ] Help states file/row limits.
- [ ] Help explains no live bank connection, payment movement, AI or tax advice.
- [ ] Final Groveware support details replace the placeholder after approval.
- [ ] Privacy/legal professional has reviewed the final public wording.

## 7. Security and error handling

- [ ] Clerk sign-in and sign-up render under the Content Security Policy.
- [ ] Protected pages are not frameable.
- [ ] Protected pages and account downloads use private/no-store caching.
- [ ] Browser response headers include CSP, frame protection, nosniff, referrer and permissions policies, and HSTS.
- [ ] `X-Powered-By` is absent.
- [ ] Error screens show recovery actions without stack traces or record details.
- [ ] A missing page shows a calm not-found state.
- [ ] No console/log entry includes raw CSV, filename, description, merchant history, amount, balance, account reference, loan/Property detail, email or secret.
- [ ] Provider outage messages do not expose internal details.
- [ ] Two-user tests remain green.

## 8. Request limits and abuse cases

Use synthetic payloads.

- [ ] CSV selection rejects files over 5 MiB.
- [ ] CSV review rejects more than 5,000 rows.
- [ ] Reviewed everyday import bodies over 4 MiB receive a safe 413.
- [ ] Reviewed Loan import bodies over 4 MiB receive a safe 413.
- [ ] Deletion confirmation bodies over 1 KiB receive a safe 413 and delete nothing.
- [ ] Chunked bodies cannot bypass limits.
- [ ] Malformed JSON receives a safe 400.
- [ ] Duplicate import submission remains idempotent.
- [ ] Repeated export/deletion controls do not create duplicate operations.
- [ ] If Vercel Firewall rules are approved later, legitimate Clerk and CSV flows still work.

## 9. Financial and CSV regression

Reuse the accepted Phase 4 checklist and synthetic supported-bank fixtures.

- [ ] Manual Money in, Money out and Transfer remain sign/type compatible.
- [ ] Positive income and transfers stay out of expense spending.
- [ ] Split parents remain excluded where children count.
- [ ] Split children reconcile exactly.
- [ ] Import / Skip / Merge behaviour is unchanged.
- [ ] Duplicate scoring is unchanged.
- [ ] Merchant/category suggestions remain reviewable.
- [ ] Property links remain owner-scoped.
- [ ] Everyday transactions remain the only cashflow records.
- [ ] Loan repayment analytical records do not double count.
- [ ] Budgets, recurring suggestions, monthly charts and reports reconcile to accepted formulas.
- [ ] No tax, Property profit, equity, valuation, net-worth, loan forecast or advice metric appears.

## 10. Desktop, mobile and accessibility

Test current Safari/Chrome/Edge plus a real narrow mobile device where available.

- [ ] Public sign-in, Privacy and Help fit at approximately 390 px without horizontal scrolling.
- [ ] Home, Transactions, Import, Budgets, Regular payments, Loans and Settings fit at approximately 390 px.
- [ ] Long merchant, category and Property nicknames wrap safely.
- [ ] Keyboard navigation reaches all important actions.
- [ ] Focus remains visible.
- [ ] Errors are announced.
- [ ] Dialog focus is predictable and returns sensibly.
- [ ] Touch targets are practical.
- [ ] Meaning does not rely on colour alone.
- [ ] Reduced-motion preference is respected.
- [ ] Screen-reader labels explain important controls.
- [ ] Export/download and deletion confirmation remain accessible.
- [ ] No unexpected browser-console error appears.

## 11. Operations and recovery

Perform a tabletop exercise; do not touch Production data.

- [ ] Incident severity levels are understood.
- [ ] Incident owner and backup owner are named.
- [ ] Deployment rollback steps are understood.
- [ ] Database forward-fix versus restore decision rule is understood.
- [ ] Provider outage runbook covers Clerk, Vercel and Neon.
- [ ] Evidence preservation avoids private content.
- [ ] User communication owner is assigned.
- [ ] Non-Production restore rehearsal evidence is recorded.
- [ ] Six-hour recovery limit is accepted or a separate plan decision is made.
- [ ] No one assumes an automatic Prisma rollback exists.
- [ ] No one uses `migrate dev`, `migrate reset`, `db push`, manual SQL or `migrate resolve` in Production.

## 12. Dependency and release gate

- [ ] Exact release commit passes application verification.
- [ ] Exact release commit passes production dependency security.
- [ ] `npm ci` accepts the committed lockfile.
- [ ] Next.js is `15.5.20`.
- [ ] React and React DOM are `19.1.8`.
- [ ] No Next.js 14 package remains.
- [ ] No high or critical Production advisory is open.
- [ ] The known PostCSS moderate advisory is rechecked.
- [ ] Development-tool advisories are not mistaken for deployed runtime packages.
- [ ] No `--force` or legacy peer override is used.
- [ ] Diff contains no unexpected package, provider, secret, schema or migration change.

## 13. Future App Store readiness review

This section does not authorise Apple action.

- [ ] Client reviews the platform decision matrix.
- [ ] Web private beta remains the immediate target.
- [ ] No native framework is selected accidentally.
- [ ] Individual versus organization Apple enrolment is decided later.
- [ ] Groveware legal/seller identity is confirmed.
- [ ] Privacy and Support URLs are planned.
- [ ] App Privacy inputs are reviewed after a native path is selected.
- [ ] Account deletion requirement is understood.
- [ ] Sign in with Apple implications are understood.
- [ ] Synthetic screenshot inventory is acceptable.
- [ ] Draft copy makes no tax, advice, live-bank, payment or AI claim.
- [ ] No Apple fee, app record, build or submission occurs without approval.

## Final acceptance questions

Client should answer:

1. Are the signed-out and signed-in access rules accepted?
2. Does browser-local data remain understandable and safely separate?
3. Is account export complete and usable?
4. Is immediate account deletion understandable and trustworthy?
5. Are Privacy and Help factually accurate?
6. Are the remaining provider and legal actions acceptable?
7. Is the current six-hour recovery posture acceptable for a controlled beta?
8. Is the absence of global durable rate limiting acceptable, or should Vercel Firewall rules be approved?
9. Is the web-first platform strategy accepted?
10. After all blockers are cleared, do you accept and formally close Phase 5?

Until explicit acceptance is given, Phase 5 remains open and Phase 6 remains unapproved.
