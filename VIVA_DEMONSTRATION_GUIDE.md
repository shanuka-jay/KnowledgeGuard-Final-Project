# KnowledgeGuard Viva Demonstration Guide

## Purpose

This is a **12–15 minute live demonstration** for the KnowledgeGuard final-year research project. It demonstrates the complete research contribution: a human-supervised decision-support workflow that identifies employee-level knowledge-loss risk and coordinates verified knowledge transfer (KT).

**Core message to repeat:** KnowledgeGuard does not predict resignation or make employment decisions. It helps managers identify single-person knowledge dependency, coordinate verified transfer activities, and monitor the resulting risk indicators.

---

## 1. Preparation before the viva

### Environment checklist

Complete these checks before the panel arrives. Do not use your real research database for a live demonstration.

- Use a separate, disposable demo database.
- Start MongoDB as a replica set: final KT sign-off uses a database transaction.
- Start the ML service, backend, and frontend.
- Open `http://localhost:5173` and confirm the login page loads.
- Keep three browser profiles/incognito windows ready: **Manager**, **Knowledge Holder**, and **Backup Employee**.
- Use a prepared high/critical-risk employee and a lower-risk backup in the same manager's team.
- Keep a screenshot or PDF backup of the key screens in case of network, ML, or AI-provider failure.

### Start commands

Open three PowerShell terminals from the project root.

```powershell
# Terminal 1 — ML service
cd ml-service
.\.venv\Scripts\Activate.ps1
$env:ML_API_KEY = 'YOUR_SHARED_RANDOM_SECRET'
python -m uvicorn main:app --reload --port 8000

# Terminal 2 — Backend
cd backend
npm run dev

# Terminal 3 — Frontend
cd frontend
npm run dev
```

For a clean seeded demo database, run once from `backend/`:

```powershell
npm run seed
```

The standard seed creates a manager (`sarah@knowledgeguard.demo`) and employee (`mohamed@knowledgeguard.demo`). It has only one employee, so add/import a suitable backup employee before the KT section. Demo accounts use `Demo1234`.

### Data states to prepare

Prepare two separate cases. This avoids trying to complete every role action while the panel waits.

| Case | Use in the demo | Required state |
|---|---|---|
| A — assessment case | Sections 3–5 | An employee assessment is available for manager validation. |
| B — KT case | Sections 6–9 | A High/Critical knowledge holder, eligible backup, and a plan whose first task is ready to progress. |
| B — completed copy | Section 10 | An identical or earlier plan is already signed off, so the before/after mitigation result can be shown instantly. |

Use synthetic data only. State this clearly: it makes the demonstration repeatable and does not represent collected organisational data.

---

## 2. Opening script — 45 seconds

Say:

> Employee transitions can interrupt critical work when specialised knowledge is held by one person and is not sufficiently documented or shared. My research addresses this as a knowledge-loss continuity problem. KnowledgeGuard is a human-in-the-loop decision-support prototype: it assesses exposure, supports manager validation, creates a structured knowledge-transfer plan for serious cases, and records verified mitigation. It does not predict resignations or automate employment decisions.

Then show the login page and say:

> I will demonstrate the closed loop: assessment, manager review, prioritisation, evidence-based knowledge transfer, final sign-off, and auditable risk recalculation.

---

## 3. Research problem to system mapping — 1 minute

Show the project overview/dashboard or your thesis architecture diagram.

| Thesis / research requirement | Demonstrated system capability | What to say |
|---|---|---|
| Identify knowledge-loss exposure | Quarterly employee assessment and risk score | “The system operationalises knowledge-loss exposure instead of relying on an informal judgement.” |
| Maintain human oversight | Manager validation and notes | “A score is decision support; the manager remains responsible for interpreting it.” |
| Prioritise intervention | Low/Medium/High/Critical tiers | “High and Critical cases are prioritised for structured KT.” |
| Support knowledge transfer | Documentation, shadowing, interview, validation tasks | “The system turns a risk result into accountable actions.” |
| Verify mitigation | Evidence approval, competence rating, sign-off and `scoreDelta` | “Risk cannot be reduced by simply clicking a completion button.” |

Transition:

> I will now show how the assessment becomes a transparent risk profile rather than a black-box decision.

---

## 4. Assessment and risk scoring — 2 minutes

### On screen

1. Log in as the **employee** in Case A.
2. Open **Assessment Status**, **Profile**, or the employee dashboard.
3. Show the latest submitted/imported quarterly assessment and its risk result.
4. Log in as the **manager** and open the employee profile.
5. Show the indicator breakdown, formula score, manager score (when validated), ML support score, final score, tier, and confidence where available.

### Explain the five indicators

| Indicator | Meaning |
|---|---|
| Expertise Uniqueness (EU) | How difficult it is to replace the employee’s specialist knowledge. |
| Documentation Gap (DG) | How much essential knowledge is undocumented or inaccessible. |
| Project Criticality (PC) | Operational importance of the work supported. |
| Collaboration Dependency (CD) | Extent to which colleagues depend on this person. |
| Tenure (T) | Proxy for accumulated organisational context. |

Say:

> The employee does not directly choose a risk tier. Their assessment responses are mapped to these five indicators. The visible breakdown makes the score explainable and gives the manager a practical starting point for review.

### Explain the formula briefly

Show the score transparency panel if available, then say:

> The base formula is: 0.25 times EU, plus 0.20 each for Documentation Gap, Project Criticality, and Collaboration Dependency, plus 0.15 for Tenure. Before validation, the final result blends the formula score at 70% and the ML support score at 30%. After manager validation, it uses formula 30%, manager assessment 50%, and ML support 20%.

Do not spend time calculating live. The point is traceability, not mental arithmetic.

### Important examiner statement

> ML is supporting evidence, not the decision maker. If the ML service is unavailable, the backend safely falls back to the transparent formula score, so the core workflow continues.

---

## 5. Manager validation and prioritisation — 1.5 minutes

### On screen

1. From the Manager dashboard, open **Pending Assessments** or the employee profile.
2. Review/edit indicator values and enter a short manager note.
3. Submit manager validation.
4. Show the recalculated final score and its tier.
5. Open the team/dashboard view to show that High/Critical cases are visible for prioritisation.

### Say

> This is the human-in-the-loop control. The system does not treat self-reporting or AI output as unquestionable truth. The manager reviews the context, records a judgement, and the final score preserves both the formula and manager components for auditability.

If the response-bias panel is visible:

> The system can flag suspicious response patterns for review. It flags data quality concerns; it does not automatically accuse or penalise the employee.

Transition:

> A high score alone has limited value unless it leads to an accountable response. The next section demonstrates that response.

---

## 6. Create a knowledge-transfer plan — 1.5 minutes

### On screen

1. As the manager, open **KT Plan Manager**.
2. Select the High/Critical knowledge holder from Case B.
3. Select the prepared backup employee and key knowledge areas.
4. Set a deadline and priority, then create the plan.
5. Open the newly created plan and its generated task list/interview guide.

### Explain the controls

> The knowledge holder must be High or Critical risk. The backup must be a different employee and cannot themselves be High or Critical risk. For managers, both people must be within their own team. These controls prevent the system from creating an unrealistic transfer arrangement.

Point to the automatically created task chain:

1. Documentation of agreed knowledge areas.
2. Shadowing session.
3. Structured knowledge-transfer interview.
4. Backup practice run and competence validation.
5. Manager sign-off.

Say:

> The AI component assists by generating structured interview questions. If the AI provider is unavailable, the system uses a safe default question set. AI suggestions alone never reduce risk.

---

## 7. Evidence, dual participation, and approval — 2 minutes

### On screen

Use the three prepared browser windows so actions are clear.

1. As **Knowledge Holder**, open KT sessions and submit documentation evidence.
2. As **Knowledge Holder** and **Backup Employee**, confirm shadowing attendance and submit notes/evidence.
3. Repeat for the structured interview.
4. As **Manager**, open the plan and approve the submitted evidence.
5. For the validation task, show the backup practice run and select a competence outcome, ideally **Fully competent**.

### Say

> This is the difference between a task checklist and verified mitigation. Both parties participate in transfer activities, the manager examines the evidence, and the manager evaluates whether the backup can perform the work. If material gaps remain, sign-off should not be used to claim successful mitigation.

If time is limited, say:

> I prepared the remaining evidence state in advance so I can show the completion control and result without spending the viva entering repetitive text.

This is legitimate; never claim actions were live if they were prepared.

---

## 8. Sign-off gate and transactional close — 1 minute

### On screen

1. Return to the Manager plan view.
2. Show the sign-off task before prerequisites are complete, if possible.
3. Show that final sign-off is available only after all other tasks are approved.
4. Click final sign-off for the prepared plan.

### Say

> Final sign-off is a gate, not a cosmetic status change. When sign-off succeeds, the plan status, the indicator updates, and the newly calculated score are committed together in a database transaction. If a critical save fails, the system rolls the operation back rather than leaving partially mitigated records.

> The system also stores the plan ID against the assessment, preventing one plan from applying its reduction twice.

---

## 9. Explain exactly how mitigation changes the score — 1.5 minutes

Open the completed Case B employee profile, latest assessment, or before/after mitigation record.

Say:

> The mitigation engine changes only indicators that knowledge transfer can plausibly reduce. It does not make a critical project less critical, and it does not alter the employee’s tenure.

| Verified condition | Indicator effect |
|---|---|
| Approved documentation tasks | Documentation Gap is reduced by up to 3 points, proportional to the approved documentation work. |
| Backup rated fully competent | Expertise Uniqueness reduces by 3 points. |
| Backup has minor gaps | Expertise Uniqueness reduces by 2 points. |
| Both shadowing and interview are approved, and competence is validated | Collaboration Dependency reduces by up to 2 points. |
| Project Criticality and Tenure | Unchanged: these are factual exposure conditions. |

Then state:

> The score cannot be reduced below the indicator floor of 1. The system recalculates the latest assessment and writes a trace containing the plan, reductions, before/after values, competence outcome, final score, tier, and `scoreDelta`.

Show the `scoreDelta` and say:

> `scoreDelta` is the pre-mitigation score minus the post-mitigation score. It is an auditable record of configured system behaviour, not proof that knowledge will be retained indefinitely.

---

## 10. Monitoring, governance, and research evidence — 1 minute

Show the risk history/trend, HR dashboard, export page, notifications, or researcher/AHP screen—choose the clearest screen available.

Say:

> The final step is monitoring. The manager and HR can review current scores and later quarterly assessments. A lower immediate score is not treated as permanent proof of resilience; the next assessment cycle can confirm whether the risk profile remains lower.

> The prototype also provides role-based access, exportable assessment/risk records, activity/notification events, and research features such as AHP weighting validation and SUS/TAM feedback collection. These support evaluation of the artefact and its governance, rather than claiming operational deployment maturity.

---

## 11. Closing script — 30 seconds

> To conclude, KnowledgeGuard closes the gap between detecting knowledge-loss risk and responding to it. It combines transparent indicator-based assessment, manager judgement, optional ML support, structured knowledge transfer, multi-party evidence, backup competence verification, and an auditable recalculation. Its contribution is a working, human-supervised decision-support workflow—not an automated HR decision or a claim that one completed plan permanently eliminates knowledge-loss risk.

---

## 12. Likely examiner questions and strong answers

### “Why use ML if you already have a formula?”

> The formula provides transparent, policy-driven scoring. ML is only triangulation: it can identify patterns from validated historical data, but it does not override manager judgement. The system continues with formula scoring if ML is unavailable.

### “How do you know the risk score is correct?”

> The score is a decision-support measure, not an objective prediction of departure. Its transparency comes from visible indicators, stated weights, manager validation, and recorded source scores. The research evaluates functional behaviour and perceived usefulness; broader organisational validation needs real longitudinal deployment data.

### “Why does project criticality not reduce after KT?”

> Knowledge transfer improves backup coverage, documentation, and collaboration resilience. It does not change how important the project is to the organisation. Leaving Project Criticality unchanged avoids falsely erasing exposure.

### “Can a manager reduce risk without real transfer?”

> Not through final KT mitigation. The workflow requires task evidence, manager approvals, backup competence validation, and final sign-off. The plan is also protected against being applied twice.

### “What happens if the backup is not competent?”

> The manager records the competence outcome. A not-competent backup receives no expertise or collaboration reduction. Significant gaps give only limited configured reductions; the case should remain under review or continue with further KT.

### “Is the AI making HR decisions?”

> No. AI is optional support for explanations, interview questions, and recommendations. It neither makes employment decisions nor independently lowers the risk score.

### “What are the limitations?”

> This is a research prototype. It uses configured indicators and synthetic/demo data, and its score reductions demonstrate workflow behaviour rather than long-term knowledge retention. It should be tested with real organisational data, governance controls, and repeated assessment cycles before deployment.

---

## 13. Do not overclaim

Avoid these statements:

- “The system predicts who will resign.”
- “AI proves the score is accurate.”
- “A signed-off plan guarantees knowledge has been retained.”
- “The score automatically decides what happens to an employee.”
- “Synthetic-data accuracy proves real organisational performance.”

Use these instead:

- “The system identifies knowledge-loss exposure for managerial review.”
- “ML provides supporting evidence alongside a transparent formula and manager judgement.”
- “Sign-off records verified completion of configured mitigation activities.”
- “The next quarterly assessment helps monitor whether the lower exposure is sustained.”

---

## 14. Emergency fallback plan

If a live component fails, stay calm and narrate the expected behaviour:

| Failure | Safe explanation |
|---|---|
| ML service unavailable | “The backend falls back to the formula score; ML is not a single point of failure.” |
| AI provider unavailable | “The plan uses a predefined interview-question set; AI is assistive, not required for KT.” |
| Email unavailable | “In-app notifications and the workflow records remain available; email is optional.” |
| Internet unavailable | “The core local application and prepared local database demonstration continue; the optional external AI response cannot be shown.” |
| Live data step takes too long | “I will switch to the prepared completed case to show the final auditable result.” |

Keep screenshots of: assessment breakdown, manager validation, created KT plan, evidence approval, competence rating, final sign-off, and before/after `scoreDelta`.
