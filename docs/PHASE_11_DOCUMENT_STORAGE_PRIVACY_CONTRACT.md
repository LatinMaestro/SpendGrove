# Phase 11 Documents, Receipts and Evidence Storage and Privacy Contract

Date: 17 July 2026  
Status: repository implementation contract; storage provider and active upload remain unapproved  
Runtime target: metadata and service preparation only, fail closed until ordered Preview migration and provider/security activation  
Client review: deferred until the consolidated pre-release review

## Objective

Prepare secure, owner-scoped document and evidence management without storing file bytes in PostgreSQL, exposing finance documents publicly or activating an unapproved storage/scanning provider.

## User value

The completed feature is intended to let a user organise receipts, invoices, Property records, Loan statements and report evidence beside the records they support. It must make EOFY/accountant preparation easier while keeping document access private, revocable, exportable and deletable.

## Current decision

No storage provider is activated in Phase 11 repository preparation.

Vercel Private Blob is the preferred first candidate for a later operator decision because SpendGrove is already deployed on Vercel and the official 30 June 2026 release states that Private Blob, signed URLs and short-lived OIDC authentication are generally available. This is a recommendation, not permission to create a store, add a package, configure a credential or incur usage charges.

Cloudflare R2, Amazon S3 and Supabase Storage remain documented alternatives. A later client/operator decision must confirm provider, region/data-location posture, expected limits and costs, deletion behaviour, malware controls and environment separation.

## Official provider assessment

Accessed 17 July 2026. Pricing and capabilities must be reconfirmed immediately before activation.

| Candidate | Officially documented strengths | Cost posture at access date | SpendGrove implications |
| --- | --- | --- | --- |
| Vercel Private Blob | Private authenticated objects, signed URLs scoped to one operation/path/expiry, short-lived project OIDC, AES-256 at rest, existing Vercel deployment integration | Storage listed at USD $0.023/GB-month, advanced operations USD $5/million, simple operations USD $0.40/million and blob transfer USD $0.05/GB in the displayed managed-infrastructure region; private delivery also uses Function/Fast Data Transfer | Preferred candidate. Requires a private store, environment scoping and an approved compatible SDK/package. Private downloads need owner-authorised signed or proxied access. |
| Cloudflare R2 Standard | S3-compatible API, AES-256 at rest, TLS, lifecycle controls, no direct R2 egress charge | 10 GB-month, 1 million Class A and 10 million Class B operations free monthly; then USD $0.015/GB-month, $4.50/million Class A and $0.36/million Class B | Cost-attractive alternative, but introduces a new provider/account, credentials, environment mapping and S3-compatible integration. |
| Amazon S3 | Mature object storage, IAM/presigned access, encryption and lifecycle capabilities | Region-, storage-class-, operation- and transfer-dependent; use the official calculator before selection | Strong control surface but highest operator/IAM complexity for the current stack. No account or region decision is approved. |
| Supabase Storage | File buckets, S3 compatibility, row-level access controls and resumable uploads | Free quota listed as 1 GB; Pro/Team quota 100 GB with USD $0.0213/GB-month overage | Introduces another data/auth provider and policy surface without a current architectural benefit over the preferred candidate. |

### Official sources

- [Vercel Private Blob is now generally available](https://vercel.com/changelog/vercel-private-blob-is-now-generally-available) — Vercel, 30 June 2026.
- [Vercel Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing) — Vercel.
- [Vercel Blob security](https://vercel.com/docs/vercel-blob/security) — Vercel.
- [Vercel Blob private storage](https://vercel.com/docs/vercel-blob/private-storage) — Vercel.
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/) — Cloudflare.
- [Cloudflare R2 data security](https://developers.cloudflare.com/r2/reference/data-security/) — Cloudflare.
- [Cloudflare R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) — Cloudflare.
- [Amazon S3 pricing](https://aws.amazon.com/s3/pricing/) — Amazon Web Services.
- [Supabase Storage pricing](https://supabase.com/docs/guides/storage/pricing) — Supabase.

## Storage architecture boundary

1. PostgreSQL stores metadata and links only.
2. File bytes belong in a private object store selected later.
3. Object keys are opaque random identifiers. Do not include email, Clerk ID, filename, Property address, account reference or financial description.
4. Storage credentials never reach a browser.
5. Upload/download/delete authorization is issued server-side after authentication and ownership checks.
6. Private objects are never served through a permanent public URL.
7. Direct client upload may be used only with a short-lived, single-object token constrained by owner, content type, size and destination key.
8. A database record is not marked AVAILABLE until provider completion is revalidated.
9. Provider failure must not create a durable “available” record or expose an orphan as user-accessible.
10. Object deletion and metadata lifecycle must be retryable and reconciled without pretending erasure occurred.

## Proposed additive metadata model

The exact schema proposal must define:

### Document

- owner `userId`;
- safe user-visible label, not the original uploaded filename by default;
- document category;
- lifecycle status;
- MIME type;
- byte size;
- SHA-256 checksum when available;
- opaque provider code;
- opaque object key;
- optional safe document date;
- optional Australian financial-year key;
- created/updated/deleted timestamps.

No file bytes, OCR text, raw bank data or public URL may be stored in PostgreSQL.

### DocumentLink

- document owner;
- document;
- approved target type;
- owner-scoped target ID or financial-year/report key;
- created/revoked timestamps;
- unique active link treatment.

Initial link targets:

- Transaction, including eligible split-child Transactions;
- Property;
- Loan Account;
- Loan Repayment;
- Import Batch audit context;
- report/evidence key;
- Australian financial year.

A relationship does not imply further links. Linking a document to a Property does not automatically link every Property transaction or Loan.

## Initial content policy for later activation

Repository preparation may enforce the proposed conservative limits:

- PDF: `application/pdf`;
- JPEG: `image/jpeg`;
- PNG: `image/png`;
- maximum 10 MiB per file;
- one file per upload authorization;
- opaque object key and server-generated safe display label;
- no archives, executables, scripts, HTML, SVG, Office macros or password-protected archives;
- MIME declaration is never sufficient by itself; magic-byte/content validation is required.

HEIC, DOCX and additional formats remain future compatibility decisions because previewing, malware handling and cross-platform behaviour need separate evidence.

## Malware and unsafe-content boundary

No active upload is allowed until a defensible malware-control decision exists.

Minimum activation requirements:

- deny-by-default type and size validation before token issuance;
- content-signature validation after upload;
- quarantine/non-AVAILABLE state until validation completes;
- no inline execution or active-content rendering;
- attachment download headers;
- safe image/PDF preview isolation;
- rate and quota controls;
- orphan cleanup;
- incident response and object revocation;
- a documented malware scanning approach.

If malware scanning needs a provider, package, secret or paid plan, that is a separate client/operator gate. Repository preparation must leave upload disabled rather than claiming unscanned uploads are safe.

## Ownership and authorisation

Every operation must:

1. require an authenticated SpendGrove account;
2. scope the Document by `userId`;
3. validate a link target using both target ID and the same owner;
4. deny shared-household/accountant access unless a later explicit document scope is approved;
5. return purpose-limited metadata;
6. issue no provider operation until all checks pass;
7. revalidate ownership on provider callback/completion;
8. use safe audit reason codes only.

Phase 10 relationships do not share documents automatically. Accountant evidence access requires a later explicit selected document/report scope and remains read-only.

## Lifecycle, retention and deletion

Proposed lifecycle:

- PENDING_UPLOAD;
- QUARANTINED;
- AVAILABLE;
- FAILED;
- DELETED.

Rules:

- failed/quarantined objects are never downloadable by normal users;
- Delete is a recoverable metadata action only if the provider object remains within an explicitly approved recovery window;
- permanent erasure requires successful provider deletion and metadata finalisation;
- no recovery/grace duration is assumed until the client retention decision is made;
- account deletion must block or report partial failure if owned provider objects cannot be deleted;
- deletion must revoke download access immediately even if provider cleanup is retrying;
- audit records retain only safe IDs/reason codes under the accepted audit-retention contract;
- backups and provider deletion propagation require operator evidence before release.

No repository preparation may upload or delete a real object.

## Export

A complete account export must eventually include:

- safe document metadata;
- safe links;
- lifecycle state;
- checksums where available;
- a manifest mapping opaque export paths to user labels;
- file bytes only through an authenticated, time-limited export process after the provider is active.

Exports must not contain internal provider credentials, permanent private URLs or another user's files. If a file cannot be retrieved, the export must report that item honestly rather than silently omit it.

## Privacy and audit

Document contents, filenames and user labels are private financial information.

Never place in logs, analytics, monitoring or audit metadata:

- file bytes;
- extracted/OCR text;
- filename or document label;
- MIME-derived content;
- transaction narration;
- merchant history;
- amounts or balances;
- Property address;
- account/BSB/card/customer identifiers;
- private object URL;
- provider token, callback payload or secret.

Safe audit metadata is limited to entity ID, action and fixed reason code.

Do not accept real finance documents through public support or feedback channels.

## OCR and AI

OCR, document extraction and AI analysis are not authorised.

Any later proposal must separately define:

- opt-in;
- minimum data sent;
- provider, region, retention and training posture;
- cost;
- confidence and user review;
- deletion/export;
- no silent financial mutation;
- no tax or financial advice.

## Schema and migration order

Phase 11 metadata requires an additive sixth migration after:

1. Phase 6 bulk operations;
2. Phase 7 transfer links;
3. Phase 7 import undo;
4. Phase 9 advanced personal finance;
5. Phase 10 household/accountant collaboration.

The migration must remain unexecuted and protected by a hard-false Phase 11 runtime gate. It may not add a missing-table query to current pages, account export/deletion or Production builds.

## Repository implementation sequence

1. Exact additive Document/DocumentLink schema, SQL, verifier profile and false runtime gate.
2. Owner-scoped metadata/link service with provider abstraction and disabled provider implementation.
3. Disabled/unavailable UI state only if useful; no active upload control.
4. Export/deletion contracts updated without querying the missing tables.
5. Phase 11 exact-head QA and handoff.

## Tests before activation

- runtime gate prevents database/provider access;
- signed-out denial and two-user isolation;
- owner-only metadata/link mutation;
- direct-ID/cross-owner denial;
- link target ownership and lifecycle validation;
- no automatic Phase 10 sharing;
- no file bytes in PostgreSQL;
- no public URL;
- no credential in browser or logs;
- content type/size/name policy;
- callback owner/key revalidation;
- quarantine/available transition safety;
- immediate download revocation;
- deletion retry/partial-failure handling;
- export and account-deletion treatment;
- no missing-table query while disabled;
- no OCR/AI/provider call.

## External/operator decisions before activation

- storage provider;
- account/project/bucket/store and region;
- Preview/Production separation;
- cost/spend limits;
- SDK/package approval;
- OIDC or secret/environment treatment;
- malware scanning/control;
- retention/recovery duration;
- backups and deletion propagation;
- supported content types and user quotas;
- privacy/legal disclosure;
- Production migration;
- real-user upload activation.

## Mandatory stops

Stop before:

- creating or connecting a storage provider;
- purchasing/upgrading a plan;
- adding a provider SDK/package without approval;
- adding a secret/environment variable;
- uploading a real file;
- enabling an upload/download route;
- running Preview or Production migration;
- storing file bytes in PostgreSQL;
- public object access;
- weakening owner checks;
- OCR/AI extraction;
- sharing documents automatically;
- changing financial calculations;
- public launch, TestFlight or App Store action.

## Current confirmation

This contract permits only additive, unexecuted metadata/schema and fail-closed repository service preparation. It does not select or activate a provider, configure credentials, store files, scan content, expose uploads, run migrations or make Phase 11 operational.
