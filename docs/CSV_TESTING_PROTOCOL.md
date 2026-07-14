# CSV Testing Protocol

SpendGrove’s CSV import capability is central to the product. Client-provided bank CSVs are sensitive and must be handled carefully.

## Sample types

| Sample type | Permitted use | Handling rule |
|---|---|---|
| Real client-provided CSV | Temporary local structural/parser testing only | Never commit, upload to third parties, expose filenames/private values or log raw rows. Store only in `sample-data/private-local/` if a temporary workspace location is needed. |
| Redacted fixture | Regression tests after complete fictionalisation/redaction | Remove or fictionalise private fields, names, account identifiers, reference numbers and sensitive descriptions. |
| Synthetic fixture | Default committed fixtures and sample downloads | Use fictional Australian transactions only. |
| Loan-like CSV | Structural parser/reconciliation planning only until loan modules are approved | Treat as sensitive; do not implement loan import outside an approved phase. |

## Folder structure

```text
sample-data/
  synthetic/       # safe committed fictional fixtures
  private-local/   # gitignored temporary private samples only
```

## Private-local rules

Files in `sample-data/private-local/` must not be committed.

The agent must not:

- copy real CSV rows into source code;
- paste real rows into PR descriptions, docs, comments or logs;
- expose real rows, filenames or private values in screenshots;
- upload real files to third-party services;
- log raw CSV rows;
- store raw descriptions;
- store account numbers, BSBs, card fragments, customer IDs, loan references, balances or private identifiers;
- use real data to create public fixtures without complete synthetic rewriting.

## Permitted private CSV inspection

The agent may inspect private CSVs only for safe structural learnings, such as:

- generic account type;
- number of columns;
- headered or headerless shape;
- date column position/format;
- signed amount versus split debit/credit structure;
- presence of private-only columns;
- high-level row count;
- high-level parser warning patterns.

The agent may report only safe aggregate labels, for example:

- `Private CSV A: everyday-account-like, 4 columns, headerless, signed amount, mixed narration column.`
- `Private CSV B: loan-like, split debit/credit, private reference-like column excluded.`

Do not report real filenames, raw values, merchant names, account names, balances, references or identifiers.

## Privacy scan requirements

The import workflow must detect and exclude:

- BSB;
- account number;
- account name;
- card number or card fragment;
- customer ID;
- loan account number;
- long bank reference strings;
- other private bank identifiers.

Detection should use both header patterns and value patterns where practical.

## Synthetic fixture requirements

Synthetic fixtures may include fictional merchants such as:

- Woolworths;
- Coles;
- Aldi;
- Translink;
- BP;
- Uber;
- salary payment;
- OSKO payment;
- Telstra;
- Optus;
- AGL;
- Origin;
- council rates;
- water bill;
- loan repayment;
- credit interest;
- account fee.

Do not include real names, real BSBs, real account numbers, real balances, real filenames or real transaction details.

If private CSV testing reveals a parser gap, create a fictional synthetic fixture that reproduces only the structural issue.

## CSV test report

For parser/import PRs, provide a CSV test report with:

- files tested using safe labels only;
- synthetic/redacted/private-local status;
- generic account type;
- bank/profile detected where safe;
- private field count/type only, not values;
- row count;
- rows parsed;
- rows needing mapping;
- duplicate/merge outcomes;
- import-review issues;
- unsupported format notes;
- fixture updates made.

## User testing instructions

When asking the client to test real CSVs, provide:

- which app screen/workflow to use;
- what file/account types to test;
- what result is expected;
- what issues to record;
- what screenshots are safe or unsafe;
- reminder not to send screenshots showing real private transactions unless explicitly redacted;
- reminder not to commit, upload or paste private CSV content.

## Transaction sign/type integrity checks

Every supported CSV regression must now confirm:

- a strictly positive ordinary imported amount commits as Money in / `INCOME`;
- a strictly negative ordinary imported amount commits as Money out / `EXPENSE`;
- confirmed incoming and outgoing transfers remain `TRANSFER`;
- zero-value rows cannot create ordinary transactions;
- selected, learned and keyword-suggested categories cannot reverse signed direction;
- an incompatible suggestion is ignored and the row remains direction-aware Needs review;
- positive refund descriptions do not turn positive money into expense;
- Import, Skip and Merge outcomes retain their established meanings;
- Merge does not overwrite the existing transaction's direction from a new category;
- no raw narration, filename, account reference or bank identifier enters logs or audit metadata.

Private-bank validation remains structural and local. Record only safe format labels, counts and pass/fail outcomes; do not record transaction values or source text.
