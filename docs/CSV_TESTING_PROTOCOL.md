# CSV Testing Protocol

SpendGrove’s CSV import capability is central to the product. Client-provided bank CSVs are sensitive and must be handled carefully.

## Sample types

| Sample type | Permitted use | Handling rule |
|---|---|---|
| Real client-provided CSV | Temporary local parser testing only | Never commit, upload to third parties or log raw rows. Store only in `sample-data/private-local/`. |
| Redacted fixture | Regression tests after sanitisation | Remove or fictionalise private fields, names and sensitive descriptions. |
| Synthetic fixture | Default committed fixtures and sample downloads | Use fictional Australian transactions only. |
| Loan CSV | Parser/reconciliation development | Treat as sensitive and ensure no double counting. |

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
- paste real rows into PR descriptions;
- expose real rows in screenshots;
- upload real files to third-party services;
- log raw CSV rows;
- use real data to create public fixtures without redaction/synthetic rewriting.

## Privacy scan requirements

The import workflow must detect and exclude:

- BSB;
- account number;
- account name;
- card number or card fragment;
- customer ID;
- loan account number;
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

Do not include real names, real BSBs, real account numbers or real transaction details.

## CSV test report

For parser/import PRs, provide a CSV test report with:

- files tested;
- synthetic/redacted/private-local status;
- account type;
- bank/profile detected;
- private fields found;
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
- reminder not to send screenshots showing real private transactions unless explicitly redacted.
