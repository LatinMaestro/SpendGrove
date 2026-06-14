# Synthetic CSV Fixtures

This folder is for safe, fictional CSV files that may be committed to the repository.

Rules:

- Use fictional transactions only.
- Do not include real names.
- Do not include real BSBs or account numbers.
- Do not include real customer IDs.
- Do not include real card numbers or card fragments.
- Use realistic Australian merchants and dates.
- Never copy row values or filenames from private client CSVs.
- Keep identifiers marked as synthetic and use them only to verify exclusion behaviour.

Current regression coverage includes:

- confirmed headered signed-amount layouts;
- confirmed headered debit/credit layouts;
- generic headered signed-amount layouts;
- generic headered debit/credit layouts;
- headerless signed-amount layouts;
- unknown/manual-mapping layouts;
- inconsistent column counts;
- unsupported non-transaction structures.

Private client CSVs belong only in `sample-data/private-local/` and must never be committed.
