# Thesis Review: Chapters 1–4 Only
**File:** `final submission thesis.md` | Scope: Abstract, Ch.1–4, References

---

## Abstract (Line 1–7)

| What's there | Status |
|---|---|
| Problem statement | ✅ Clear |
| System name and approach | ✅ Clear |
| AHP result (CR = 0.2000, rejected) | ✅ Correctly stated |
| SUS score (89.50, SD = 3.07) | ✅ Stated |
| TAM ratings (4.43, 4.53, 4.60) | ✅ Stated |
| Limitation sentence | ✅ Appropriately cautious |

**Gap:** The abstract mentions the ML component ("supporting machine-learning score") but gives no information about it—no accuracy metric, no mention of synthetic training, nothing. Even one sentence like *"A Random Forest classifier trained on synthetic profiles provides a supporting ML score; its output reproduces the scoring formula rather than independently predicting departure"* would make the abstract more complete and honest.

---

## Chapter 1 – Introduction

### Strengths
- Background is well-grounded in Nonaka [1] and Argote [2].
- Problem statement (Section 1.3) is specific and well-scoped.
- Research gap (Section 1.4) correctly frames it as an integration gap, not a theory gap.
- RQs (Section 1.5) are appropriate and map cleanly to objectives.
- Scope (Section 1.7) is extremely honest about boundaries.
- Table 1.1 (Scope and evidence boundaries) is an excellent addition.

### Gaps

| Gap | Where | Severity |
|---|---|---|
| Figure 1.1 is a placeholder `[INSERT FIGURE 1.1...]` | Line 93 | HIGH — examiner sees a missing figure |
| Section 1.8 describes the workflow but does not mention the five-stage KT plan | Line 91 | LOW — minor omission |
| No mention of the response-quality / bias detection feature in the overview | Line 91 | LOW |

---

## Chapter 2 – Objectives

### Strengths
- Four objectives (O1–O4) are clear and traceable to the RQs.
- Table 2.1 maps objectives to methods and evidence — very useful for an examiner.

### Gaps

| Gap | Where | Severity |
|---|---|---|
| O1 says "check expert comparison consistency" but does not explicitly mention the *system enforces* this via a disabled button and API rejection — it reads as just a manual check | Line 109 | MEDIUM — could make O1 claim stronger |
| No explicit statement that O3 includes the *fallback behaviour* when ML service is unavailable | Line 113 | LOW |

---

## Chapter 3 – Literature Review

### Strengths
- Excellent use of contemporary sources (2023–2024 papers).
- Clearly distinguishes between what the literature *motivates* and what it *validates*.
- Table 3.1 (named systems comparison) is professional and well-scoped.
- Table 3.2 (evidence-to-design mapping) is a clear strength.
- Section 3.4.2 correctly warns about the circular nature of ML trained on its own labels.
- Section 3.4.3 correctly handles the generative AI interview question limit.

### Gaps

| Gap | Where | Severity |
|---|---|---|
| The response-bias detection (straight-lining, self-enhancement) is a genuine design decision but is **not cited against Ward and Meade [17]** — the citation exists for careless responding but is not explicitly connected to the implementation | Line 185 | MEDIUM — connecting them would strengthen the review |
| Isolation Forest (Section 3.4.2) is cited [22] but the threshold choice ("at least 3 data points") is not explained or justified | Line 303 | LOW |
| There is no subsection discussing **role-based access control** as a design requirement informed by the literature or standard practice — it appears later in methodology but has no literature basis stated | — | LOW |
| Table 3.2 lists Biron et al. [19] as informing "Successor and supervisor participation matters" but the KT plan in the system does not have a *supervisor* participation field beyond sign-off — could add one line noting that limitation | Line 279 | LOW |

---

## Chapter 4 – Methodology

### Strengths
- Design science framing (Hevner et al. [5]) is correctly applied.
- Section 4.2 clearly separates generated records from real respondents — excellent academic honesty.
- Tables 4.1–4.6 provide comprehensive traceability.
- Section 4.4.3 gives a worked numerical example (F=8.55, R=8.52) — very strong.
- The score-blending formula (R = 0.30F + 0.50M + 0.20L) and fallback rules are explicitly stated.
- Section 4.4.4 quantifies the maximum score reduction from KT sign-off (≤ 1.75 points) — excellent.
- Sections 4.6 and 4.7 clearly separate ethics from evaluation methodology.

### Gaps

| Gap | Where | Severity |
|---|---|---|
| **Figure 4.1** (architecture diagram) is a placeholder | Line 473 | HIGH |
| **Figure 4.2** (data model/ER diagram) is a placeholder | Line 477 | HIGH |
| **Figure 4.3** (workflow diagram) is a placeholder | Line 593 | HIGH |
| **AHP math is under-described.** Section 4.4.2 correctly describes the procedure (geometric mean → matrix → normalize → average rows → CR) but never shows a single number. The **actual 5×5 consensus matrix or at minimum the 10 geometric mean values** from the collected responses should appear here. The CR = 0.2000 result is stated in the abstract but not derived anywhere in the methodology. | Line 543 | HIGH — this is your key technical contribution |
| The **confidence discount** (Section 4.4.2, line 541) is described but its effect is vague: *"The confidence discount is not directly subtracted from the numerical final score."* If it does not affect the final score, the thesis should explain exactly what it does affect (e.g., a UI warning flag only) or remove the description as misleading. | Line 541 | MEDIUM |
| **R6 (Service resilience)** is in Table 4.3 as a requirement, but Section 4.4.3 describes it as "F substitutes for L" — the methodology section (4.4.3) should reference this as fulfilling R6 explicitly instead of leaving the reader to connect them | Line 547 | LOW |
| **Section 4.5** (Development procedure) is a single paragraph. For a design science study, a brief description of how major implementation iterations occurred (e.g., what changed between versions) would support the claim of iterative design science | Line 597 | MEDIUM |
| The **AHP expert data collection** method (Google Forms, 10 respondents, pairwise scale 1–9) is only mentioned briefly in Section 4.2. There is no description of who the experts were (domain, background, how they were recruited), which is an ethical and methodological requirement | Line 343 | HIGH — missing participant description for AHP respondents |
| Same issue for **SUS/TAM respondents**: Section 4.2 says ten system-evaluation questionnaires were collected, but does not describe who these evaluators were, how they used the system, or what tasks they performed before rating it | Line 343 | HIGH — examiner will ask "who evaluated the system?" |
| **Table 4.3 R3** says "Reject inconsistent comparisons in UI and API" but the methodology (Section 4.3) states the API currently returns HTTP 400 for inconsistent matrices — the thesis should clarify whether this API rejection was actually tested and whether the stored settings were confirmed unchanged | Line 443 | MEDIUM |

---

## References

| Check | Status |
|---|---|
| All 25 references have DOIs or verified URLs | ✅ |
| All references are cited at least once in the text | ✅ (verified [1]–[25]) |
| Reference [23] (He & Yang, 2026) — year 2026 in a 2026 thesis is unusual; double-check this is not a pre-print or that the DOI resolves correctly | ⚠️ Verify |

---

## Priority Fix List (Chapters 1–4 Only)

| # | Action | Impact |
|---|---|---|
| 1 | **Insert Figure 1.1, 4.1, 4.2, 4.3** — create and embed actual diagrams | HIGH |
| 2 | **Add a participant description** for AHP experts and SUS evaluators in Section 4.2 | HIGH |
| 3 | **Show the AHP math derivation** — include the 10 geometric means, the 5×5 matrix, and the full CR=0.2000 step-by-step in Section 4.4.2 | HIGH |
| 4 | **Clarify the confidence discount** — state exactly what it controls (UI warning only?) in Section 4.4.2 | MEDIUM |
| 5 | **Strengthen O1** in Chapter 2 to explicitly state the *system enforces* the AHP consistency rule rather than just "checks" it | MEDIUM |
| 6 | **Connect Ward & Meade [17] explicitly** to the straight-lining and bias detection implementation in Section 3.3.2 | MEDIUM |
| 7 | **Add one sentence to the abstract** about the ML component's synthetic-label limitation | LOW |
| 8 | **Verify reference [23]** (2026 date) | LOW |
