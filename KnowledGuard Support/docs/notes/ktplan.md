# Knowledge Transfer (KT) Plan Architecture

The Knowledge Transfer (KT) mitigation workflow is the core mechanism that transforms KnowledgeGuard from a passive reporting dashboard into an active risk-reduction system. 

When an employee is identified as a High or Critical risk, managers can initiate a structured KT Plan. The backend (`backend/src/routes/ktPlans.js`) orchestrates this process using a strict state-machine workflow integrated with Generative AI and automated risk recalibration.

## 1. Plan Initiation and Validation
When a manager clicks "Create KT Plan", the backend enforces several strict business logic checks before the plan can even be created:
* **Risk Threshold Validation:** The knowledge holder *must* currently possess a "High" or "Critical" risk score.
* **Backup Viability:** The assigned backup trainee cannot themselves be a "High" or "Critical" risk employee. (You cannot transfer critical knowledge to someone who is already a flight-risk bottleneck).

## 2. Generative AI Task Structuring
Once validated, the backend contacts the `aiService.js` module. It passes the employee's metadata (Department, Skills, and specific Knowledge Tags) to a Cloud LLM (e.g., Groq/Gemini). 
The AI dynamically generates a list of 10 deeply contextual, domain-specific interview questions designed specifically to extract the employee's **tacit** knowledge (e.g., edge cases, unwritten rules, and historical project context). These questions are embedded directly into the KT Plan.

## 3. The 5-Stage Automated Workflow
Creating the plan automatically generates 5 sequential, deadline-driven tasks (`KTTask`) that enforce a multi-party verification process:

1. **Documentation Task:** The expert must write down or link resources for their explicit knowledge.
2. **Shadowing Task:** The backup trainee observes the expert performing their daily duties. Both parties must log into the system and digitally sign off that this occurred.
3. **Structured Interview Task:** The expert and the trainee use the AI-generated questions to conduct a deep-dive interview, extracting the unwritten tacit knowledge.
4. **Validation Task (Practice Run):** The trainee must perform the job independently. The manager reviews their work and gives them a formal "Competence Rating" (e.g., *Fully Competent*, *Needs Minor Support*, *Not Competent*).
5. **Manager Sign-off:** Only when all 4 previous tasks are completed and approved can the manager officially close the KT Plan.

## 4. Empirical Risk Recalibration (The Mathematics)
When the manager completes the final Sign-off, the system triggers the `updateScoreAfterKT()` function located in `backend/src/services/ktScoreUpdate.js`. 

This algorithm does not blindly reduce the overall score; it mathematically recalculates specific AHP indicators based on the exact outcomes of the KT tasks:

**A. Documentation Gap Reduction (Max -3.0 points)**
The system calculates the ratio of approved documentation tasks. If all documentation tasks are approved by the manager, the employee's `Documentation Gap` score is reduced by a maximum of 3.0 points.
* *Formula:* `(docTasksApproved / totalDocTasks) * 3`

**B. Expertise Uniqueness Reduction (Max -3.0 points)**
The reduction in Expertise Uniqueness is entirely dependent on the "Competence Rating" assigned by the manager during the Validation Task (Task 4). The backend applies a strict mapping (`VALIDATION_IMPACT` dictionary):
* **Fully Competent:** -3.0 points
* **Competent with Minor Gaps:** -2.0 points
* **Needs Significant Support:** -1.0 points
* **Not Competent Yet:** -0.0 points

**C. Collaboration Dependency Reduction (Max -2.0 points)**
If the manager formally approves that both the Shadowing and Structured Interview tasks were completed, the Collaboration Dependency score is reduced in tandem with the competence rating (e.g., -2.0 points if the backup is "Fully Competent").

**D. Immutable Factors**
The `updateScoreAfterKT()` explicitly leaves **Project Criticality** and **Tenure** mathematically untouched. This is a critical design choice: a Knowledge Transfer plan mitigates the single-person failure risk, but it does not make the underlying project any less critical to the company, nor does it alter how long the employee has worked there.

**E. Resolving the "Two-Step" Score Drop (Algorithmic vs. Organic)**
Because the maximum algorithmic reduction applied to the formula is mathematically capped at **1.75 points** (0.75 + 0.60 + 0.40), the system operates on a two-step mitigation curve:
1. **The Immediate Algorithmic Patch:** Upon manager sign-off, the script modifies both the employee's Self-Scores and the Manager's Validated Scores. The Python ML service then generates a new prediction based on these lowered inputs. This results in an immediate, hard-capped drop of up to 1.75 points (e.g., dropping a Critical 8.50 to a High 6.75) to instantly reflect the new backup coverage on the HR dashboard.
2. **The Organic Longitudinal Drop:** Massive risk tier shifts (e.g., dropping from an 8.50 Critical down to a 5.20 Medium—a 3.30 drop) are not generated by the artificial KT algorithm. Instead, they are realized organically during the **subsequent quarterly assessment**. In the next quarter, because the knowledge transfer was successful, the employee's and manager's organic survey responses naturally reflect the democratized knowledge (e.g., answering *"My backup can cover for me"* instead of *"Nobody can cover for me"*), generating a structurally lower baseline score without algorithmic interference.

Finally, the backend recalculates the 30% AHP Formula using these newly lowered indicators, permanently updating the employee's final risk tier on the HR Dashboard.
