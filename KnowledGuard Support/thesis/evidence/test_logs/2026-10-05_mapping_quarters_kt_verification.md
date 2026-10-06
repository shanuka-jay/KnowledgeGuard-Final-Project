# Mapping, quarterly history and KT verification

Date: 2026-10-05

## Implemented fixes

- Real Q1 shortened export headings and revised questionnaire wording are recognised.
- Reverse Likert answers are mapped without Agree/Disagree substring collisions.
- Explicit 1–10 indicator values are preserved; missing or unknown answers are rejected instead of silently assigning 5.
- Risk records use the assessment quarter rather than the calculation date's quarter. Latest-score consumers prioritise the quarter.
- KT sign-off requires all five task types and completed prerequisite tasks.
- Assessment reductions, the recalculated risk score and plan completion commit in one MongoDB transaction.
- Applied-plan tracking and legacy impact checking prevent the same plan reducing indicators twice.
- Missing assessments or score-persistence failures prevent completion and roll back changes.

## Executed verification

| Suite | Result | Scope |
|---|---|---|
| `backend/test/assessmentMapping.test.js` | 6/6 passed | Real Q1 headers, revised wording, all reverse Likert options, direct indicator scale, invalid inputs, quarterly mappings |
| `backend/test/ktWorkflow.test.js` | 12/12 passed | Quarter persistence, owner checks, full/minor mitigation, repeat protection, prerequisites, authorisation, floors, ML fallback, rollback and tier boundaries; in-memory fixtures |
| `backend/test/ktDatabaseVerification.js --run-isolated` | 7/7 passed | Actual MongoDB persistence and transactions; authenticated assessment validation, plan creation, documentation submission/approval, dual attendance, session evidence/approval, competence rating and sign-off APIs; repeated sign-off blocked and injected persistence failure rolled back |

Total: 25 passing checks. In the authenticated fixture, the validated formula score changed from 8.55 to 6.80; the final score after KT was 6.74 (Medium), using a deterministic ML result of 6.50. Successful KT does not guarantee Low risk: project criticality and tenure remain unchanged.

## Evidence boundaries

- The integration run used fictional accounts in a newly created isolated database. That temporary database was removed after verification; existing application records were not changed.
- Integration ML output and external AI/notification functions were stubbed. These results do not verify live model accuracy, AI service availability, delivered emails or notifications.
- API verification is not browser usability testing or proof of real organisational knowledge retention.
- Existing imported assessments and stored scores were not retroactively remapped or repaired. These fixes apply to future imports/calculations; historical corrections require a separately reviewed migration.
- Full independent employee assessment submission and a complete live browser walkthrough were not part of this integration run.

## Reproduction

From `backend`, with Node and dependencies available:

```text
node test/assessmentMapping.test.js
node test/ktWorkflow.test.js
node test/ktDatabaseVerification.js --run-isolated
```

The isolated database script requires configured `MONGODB_URI`, `JWT_SECRET`, and permission to create/drop its uniquely named temporary database. It does not run seed scripts against the application database.
