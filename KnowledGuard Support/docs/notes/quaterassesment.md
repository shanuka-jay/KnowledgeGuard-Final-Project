# Quarterly Assessments and Indicator Mapping

KnowledgeGuard calculates an employee's risk score by relying on five specific indicators: **Expertise Uniqueness (EU)**, **Documentation Gap (DG)**, **Project Criticality (PC)**, **Collaboration Dependency (CD)**, and **Tenure**. 

To collect this data across time without asking the exact same questions every time, the system uses quarterly assessments (surveys) that map directly back to these core indicators.

## How It Works

1. **The Assessment Dictionary (`googleFormsParser.js`)**: 
   The backend maintains a `multiQuarterDictionary` that maps different textual survey questions directly to the underlying indicators. For example, the system might ask:
   * **Q1 Question:** *"How many people can complete your complex deliverables without calling you?"* (Maps to **Expertise Uniqueness**).
   * **Q2 Question:** *"In a high-pressure emergency, how ready is the documentation?"* (Maps to **Documentation Gap**).
   * **Q3 Question:** *"How many active tasks or teams depend on your knowledge each week?"* (Maps to **Collaboration Dependency**).

2. **Parsing and Scoring**:
   When HR uploads the quarterly survey responses (via CSV export from Google Forms), the `mapGoogleAssessmentRow()` function parses the text answers. 
   * It translates human-readable answers into a strict 1-10 scale.
   * *Example:* If an employee answers "mostly documented", it maps to a `2` (Low risk). If they answer "mental experience", it maps to a `10` (Critical risk).

3. **Handling Tenure Automatically**:
   You will notice that **Tenure** is never asked in the survey. That is because Tenure is automatically calculated by the `calculateTenureScore()` function in `scoringEngine.js`. It subtracts the employee's `startDate` in the database from the current date. (e.g. `< 2 years = 2`, `> 10 years = 10`). This prevents employees from manually faking their tenure score.

4. **Generating the `selfScores` payload**:
   Once the parsing is complete, the four parsed scores (EU, DG, PC, CD) are saved into the database as the employee's `selfScores` for that specific quarter.

5. **Manager Validation**:
   In a separate CSV import (or via the dashboard), the manager answers their own parallel survey. The system maps the manager's answers using the exact same parsing rules to generate the `managerScores`.

6. **Triggering the Scoring Engine**:
   Finally, the system calls `calculateAndSaveRiskScore(userId, assessmentId)`. This function takes the newly mapped `selfScores`, the `managerScores`, and the auto-calculated `Tenure`, runs the 30/50/20 weighted math, calls the ML endpoint, and produces the final risk score and tier for that quarter.
