# KnowledgeGuard Data Collection With Google Forms

This guide explains how to collect thesis data through Google Forms and import it into KnowledgeGuard.

## Why Google Forms Are Used

Google Forms are useful when participants do not log in to the prototype directly. They also match the original proposal direction because data can be collected externally and imported into the DSS.

KnowledgeGuard supports three Google Forms data flows:

1. Employee knowledge-risk assessment
2. Manager validation assessment
3. SUS/TAM system evaluation survey

## Form 1: Employee Knowledge-Risk Assessment

Purpose:

- Collect employee responses for knowledge-loss risk calculation.
- Avoid direct questions such as "Are you high risk?"
- Use indirect questions that map to hidden indicators.

Download template:

```text
Data Collection & Export -> Employee Assessment Form Template
```

The form should collect:

- Employee email
- Backup coverage
- Help frequency
- Documentation readiness
- Project impact
- Handover difficulty
- Knowledge location
- Dependency spread
- Business criticality

When imported, the system maps these answers into:

- Expertise Uniqueness
- Documentation Gap
- Project Criticality
- Collaboration Dependency

Tenure is not collected in Google Forms. It is calculated automatically from the employee start date stored in KnowledgeGuard.

## Form 2: Manager Validation

Purpose:

- Collect manager judgement for the same employee and quarter.
- Compare employee self-score with manager validation.
- Improve confidence in the final score.

Download template:

```text
Data Collection & Export -> Manager Validation Form Template
```

The form should collect:

- Employee email
- Manager email
- Manager rating for Expertise Uniqueness
- Manager rating for Documentation Gap
- Manager rating for Project Criticality
- Manager rating for Collaboration Dependency
- Manager notes

Important:

- The employee assessment must be imported first.
- Manager validation import then updates the matching assessment for the same period.

## Form 3: SUS/TAM System Evaluation

Purpose:

- Collect evaluation evidence for the thesis.
- SUS measures usability.
- TAM measures perceived usefulness, perceived ease of use, and adoption intention.

Download template:

```text
Data Collection & Export -> SUS/TAM Evaluation Form Template
```

You may create separate Google Forms for SUS and TAM, or one combined form. If using one combined form, export the responses as CSV and import it through:

```text
Import Google Forms CSV -> SUS/TAM evaluation responses
```

## Import Steps

1. Open the Google Form responses tab.
2. Export responses as CSV.
3. Open KnowledgeGuard.
4. Go to `Data Collection & Export`.
5. Select the correct form type.
6. Enter the assessment period, for example `2026-Q2`.
7. Upload the CSV.
8. Check the imported/skipped count.

## Export for Thesis

After importing data, use these exports:

- `All Risk Scores CSV` for score distribution.
- `Raw Assessments CSV` for self-score and manager validation data.
- `Anonymised Research Dataset` for appendix-safe participant data.
- `SUS Responses CSV` for usability analysis.
- `TAM Responses CSV` for acceptance analysis.

## Recommended Thesis Wording

Use wording like this:

> Data were collected using Google Forms and imported into KnowledgeGuard as CSV files. Employee assessment responses were mapped to hidden knowledge-risk indicators to reduce direct self-rating bias. Manager validation responses were imported separately to compare system-generated risk with managerial judgement. SUS and TAM forms were used to collect usability and acceptance evidence. Exported datasets were anonymised before analysis.

## Limitations

- The Google Forms workflow is semi-automated because responses are imported through CSV.
- It does not use Google OAuth or automatic live synchronisation.
- This is acceptable for the thesis prototype because the research objective is to evaluate the DSS artifact and its workflow, not to build a production Google Workspace integration.
