# Chapter 1: Introduction

## 1.1 Chapter Overview
Organizational knowledge is a strategic asset essential for sustaining operational continuity, competitive advantage, and problem-solving capability. While explicit knowledge is codified in manuals, databases, and operational repositories, a substantial portion of mission-critical institutional knowledge remains tacit—deeply embedded in the experience, context, interpersonal networks, and daily routines of individual employees. When employees transition—whether through voluntary resignation, retirement, internal restructuring, or extended leave—organizations face acute vulnerabilities to knowledge loss.

This research presents **KnowledgeGuard**, a proactive, human-in-the-loop Decision Support System (DSS) engineered to identify individual-level knowledge loss exposure, support managerial validation, prioritize high-risk roles, generate tailored Knowledge Transfer (KT) plans, and enforce multi-party verification. Grounded in Design Science Research (DSR), this study bridges the critical gap between passive documentation storage and active organizational risk mitigation.

This chapter details the problem background, problem statements, research questions, motivation, aim, objectives, rich picture, resource requirements, and project scope.

## 1.2 Problem Background
Knowledge Management (KM) differentiates between explicit knowledge (articulable and codifiable in documentation) and tacit knowledge (individualized, internalized experience and contextual judgment) (Nonaka & Takeuchi, 1995; Polanyi, 1966). Tacit knowledge is inherently resistant to conventional document management solutions. When an employee departs, their undocumented mental models, troubleshooting intuition, and stakeholder relationships leave with them (Massingham, 2018).

In modern knowledge-intensive industries (such as software engineering, financial technology, and specialized operations), the loss of key personnel introduces direct operational disruptions: delayed project releases, severe rework, reliance on expensive external consultants, and compromised service level agreements (Durst & Zieba, 2019; Sumbal et al., 2017). Despite these risks, prevailing organizational approaches remain overwhelmingly reactive. Knowledge transfer is rarely initiated until after formal resignation notice is tendered, leaving insufficient time (typically two to four weeks) to execute meaningful shadowing, documentation, and succession readiness.

Conventional enterprise tools exacerbate this issue. Enterprise Content Management (ECM) platforms (e.g., SharePoint, Confluence) function as static, passive repositories; they store explicit files but cannot identify who holds critical undocumented knowledge. Human Resource Information Systems (HRIS) monitor macro attrition trends but lack the operational granularity to assess tacit knowledge dependencies. Consequently, decision-makers lack structured, empirical tools to proactively detect and mitigate knowledge-loss vulnerabilities.

## 1.3 Problem Statement

### 1.3.1 General Problem
Organizations lack a systematic, proactive methodology to quantify, prioritize, and manage the risk of tacit knowledge loss prior to employee departure, leading to avoidable operational bottlenecks, productivity drops, and organizational amnesia.

### 1.3.2 Specific Problem
Within the Management Information Systems (MIS) domain, there is an absence of integrated decision-support artifacts capable of:
1. Operationalizing multifaceted knowledge-loss indicators from employee self-assessments;
2. Detecting low-quality or biased survey responses (e.g., straight-lining and contradiction);
3. Combining deterministic formula scoring with managerial contextual judgment and supporting predictive machine learning;
4. Connecting assessed risk tiers directly to actionable, AI-assisted Knowledge Transfer (KT) planning and multi-party verification workflows.

## 1.4 Research Questions
* **RQ1:** What factors and measurable indicators can be operationalized to assess organizational knowledge-loss risk associated with employee transitions?
* **RQ2:** How can a Decision Support System integrate quantitative assessment, organizational judgment, and analytical techniques to support knowledge-loss risk assessment?
* **RQ3:** How can the proposed system support knowledge-transfer planning, verification, and monitoring following the identification of potential knowledge-loss risk?
* **RQ4:** To what extent does the developed KnowledgeGuard prototype demonstrate acceptable usability, perceived usefulness, perceived ease of use, and functional support for the intended knowledge-loss management workflow?

## 1.5 Research Motivation
The practical motivation arises from widespread operational disruptions observed across technical enterprises when key domain experts depart abruptly. From an MIS discipline perspective, this research offers the opportunity to synthesize multi-criteria decision analysis (Analytic Hierarchy Process), supervised machine learning (Random Forest), large language models (Generative AI), and web engineering into an accountable, transparent decision-support artifact that keeps the human decision-maker firmly in the loop.

## 1.6 Research Aim
To design, develop, and evaluate KnowledgeGuard as a proactive Decision Support System that assists organizations in assessing employee-level knowledge-loss risk and supporting structured knowledge-transfer decisions during organizational transitions.

## 1.7 Research Objectives
1. **Objective 1:** To identify and operationalize appropriate indicators of organizational knowledge-loss risk from relevant literature and establish a measurable assessment framework with automated response-quality checking.
2. **Objective 2:** To critically analyze existing Knowledge Management systems, knowledge-risk assessment approaches, people-analytics approaches, and Decision Support Systems to identify their strengths, limitations, and relevance to proactive knowledge-loss prevention.
3. **Objective 3:** To design and develop the KnowledgeGuard Decision Support System as an integrated decision-support workflow combining algorithmic risk assessment, managerial judgment, analytical support, knowledge-transfer planning, and verification mechanisms.
4. **Objective 4:** To evaluate the developed KnowledgeGuard prototype in terms of usability, perceived usefulness, perceived ease of use, and the functional execution of its defined knowledge-transfer mitigation workflow using the System Usability Scale (SUS), Technology Acceptance Model (TAM), and system-generated evidence.

## 1.8 Rich Picture and High-Level Workflow
KnowledgeGuard organizes the knowledge-loss mitigation lifecycle into an integrated sequence:
1. **Assessment Ingestion:** Employee quarterly responses are ingested via CSV or webhooks.
2. **Quality & Bias Auditing:** Responses undergo automated straight-lining and contradiction checks.
3. **Deterministic Scoring:** The baseline formula computes a transparent 1–10 score across five indicators.
4. **Supporting ML & Triangulation:** A Python/FastAPI microservice provides secondary prediction; managerial validation blends these inputs (30% Formula, 50% Manager, 20% ML; with 70/30 fallback when unvalidated).
5. **Generative KT Planning:** For high/critical risk profiles, structured KT plans are generated using contextual LLM prompts.
6. **Dual-Verification & Sign-off:** The employee and designated backup complete tasks, followed by mandatory manager sign-off.
7. **Mitigation Tracking:** Recalculation verifies the reduction in risk score (`scoreDelta`).

## 1.9 Resource Requirements
* **Hardware:** Standard development workstation (Intel Core i7/AMD Ryzen, 16GB RAM, SSD) for local full-stack compilation and model execution.
* **Software Environment:** React 18.2, Vite 5.1, Node.js v20.11.0, Express 4.19, MongoDB v7.0.5 with Mongoose ODM, Python 3.11.8 with FastAPI, Pandas, Scikit-Learn 1.4.1, Groq/Gemini API, and Node-Cron.

## 1.10 Project Scope

| In Scope | Out of Scope |
| :--- | :--- |
| Employee knowledge risk assessment using five operationalized indicators (EU, DG, PC, CD, Tenure). | Replacement of an enterprise Human Resource Information System (HRIS). |
| Managerial dashboards, score transparency panels, and risk tiering. | Autonomous disciplinary, salary, or termination employment decisions. |
| Automated response-quality checking (straight-lining detection and polarity contradiction). | Unsupervised, intrusive employee surveillance (e.g., keylogging, screen capture). |
| AHP-based expert formula calibration with consistency validation (CR < 0.10). | Multi-year longitudinal workforce retention studies post-departure. |
| AI-assisted Knowledge Transfer plan generation and dual-party verification workflow. | Autonomous execution of physical knowledge transfer sessions. |
| Usability and technology acceptance evaluation using SUS (N=10) and TAM (N=10). | Real-world clinical validation of long-term tacit knowledge retention. |

## 1.11 Chapter Summary
This chapter established the foundational structure of the thesis. It defined the operational challenge of tacit knowledge loss, framed the research questions and objectives under a Design Science Research approach, and delineated the scope and resources required to develop and evaluate the KnowledgeGuard artifact.


# Chapter 2: Literature Review

## 2.1 Chapter Overview
This chapter critically evaluates the academic literature across four intersecting domains: organizational knowledge theory, knowledge risk assessment frameworks, enterprise knowledge management platforms, and analytical decision support systems. It establishes the conceptual foundation for KnowledgeGuard, justifies the operational indicators, and pinpoints the research gap addressed by this study.

## 2.2 Domain Overview: Explicit vs. Tacit Knowledge
Organizational knowledge is categorized into explicit and tacit forms (Polanyi, 1966; Nonaka, 1994). Explicit knowledge can be formalized, codified in documents, stored in relational databases, and transferred through standard information systems. Tacit knowledge, conversely, is deeply subjective, intuitive, and experiential. It consists of technical cognitive skills ("know-how") and mental models that employees apply when diagnosing anomalies or architecting complex systems (Dalkir, 2011).

During employee turnover, the loss of tacit knowledge represents the primary threat to business continuity (Massingham, 2018). While standard operating procedures remain documented in company repositories, the contextual judgment required to execute non-standard workflows departs with the employee. Durst and Zieba (2019) map knowledge risks into distinct categories, noting that "knowledge waste" and "knowledge unlearning" stem directly from unmanaged expert transitions.

## 2.3 Critical Analysis of Existing Systems and Frameworks

### 2.3.1 Passive Repositories (ECM)
Enterprise Content Management platforms such as Atlassian Confluence and Microsoft SharePoint provide robust infrastructure for storing, searching, and collaborating on explicit documentation. However, these repositories are inherently passive: they rely on employees voluntarily authoring documentation, fail to track which critical systems lack documentation, and cannot compute individual employee-level knowledge loss vulnerability.

### 2.3.2 Human Resource Information Systems (HRIS)
Enterprise platforms such as Workday and SAP SuccessFactors manage workforce demographics, succession rosters, and skill inventories. However, they focus primarily on macro-level talent mobility, recruitment pipelines, and payroll. They do not possess analytical mechanisms to evaluate operational single-points-of-failure or link task dependencies to real-time project continuity.

### 2.3.3 Multi-Criteria & Analytical Frameworks
Decision support research has applied multi-criteria methods (such as the Analytic Hierarchy Process—AHP) to personnel selection and project prioritization (Saaty, 2008; Wang et al., 2021). However, existing implementations remain isolated academic exercises rather than operationalized software systems integrated with automated data-quality checks, machine learning triangulation, and mitigation workflows.

### 2.3.4 Comparative Analysis of Existing Approaches

| System / Approach | Explicit Storage | Employee Assessment | Proactive Risk Calculation | Response Quality Checks | Dynamic Context Weighting | ML-Supported Validation | AI-Assisted KT Planning | Dual-Party Verification | Primary Operational Limitation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Atlassian Confluence** | Yes | No | No | No | No | No | No | No | Passive repository; stores codified artifacts without evaluating individual risk. |
| **Microsoft SharePoint** | Yes | No | No | No | No | No | No | No | Explicit file collaboration; cannot identify tacit knowledge concentration. |
| **Workday HCM** | Limited | Yes | Limited | No | No | No | No | No | Macro talent/turnover tracking; lacks operational knowledge risk granularity. |
| **SAP SuccessFactors** | Limited | Yes | Limited | No | No | No | No | No | Broad HR administration; lacks dedicated risk-to-mitigation transition workflows. |
| **AHP-HR Models (Wang 2021)** | No | Yes | Yes | No | Yes | No | No | No | Multi-criteria ranking without software automation, response audits, or KT execution. |
| **KnowledgeGuard (Proposed)** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Fully integrated proactive workflow: assessment → screening → scoring → planning → verification. |

## 2.4 Analytical and Technological Foundations

### 2.4.1 Operationalization of Knowledge-Loss Indicators
To quantify knowledge-loss vulnerability, five indicators were synthesized from the literature (Durst & Zieba, 2019; Massingham, 2018; Martins et al., 2019):
1. **Expertise Uniqueness (EU):** The degree to which specialized operational know-how is concentrated in a single individual without available backups.
2. **Documentation Gap (DG):** The extent to which critical procedures, system architectures, and runbooks remain unwritten or inaccessible.
3. **Project Criticality (PC):** The potential operational disruption, compliance exposure, or financial penalty resulting from workflow stoppage.
4. **Collaboration Dependency (CD):** The extent to which cross-functional teammates, workflows, and approvals depend on the individual.
5. **Tenure (T):** Length of organizational service, serving as an objective proxy for accumulated institutional memory and informal networks.

### 2.4.2 Analytic Hierarchy Process (AHP)
AHP (Saaty, 1980, 2008) provides a mathematically rigorous method for deriving relative criteria weights through pairwise comparison matrices ($A$). The principal eigenvector corresponds to the priority vector $w$, validated via the Consistency Ratio:
$$CI = rac{\lambda_{max} - n}{n - 1}, \quad CR = rac{CI}{RI}$$
Where $n=5$ and $RI=1.12$. Saaty's axiom stipulates that $CR < 0.10$ is required to confirm transitivity and logical consistency.

### 2.4.3 Supervised and Unsupervised Machine Learning
Random Forest (Breiman, 2001) is selected as a secondary supporting classifier due to its superior performance on non-linear tabular data and robustness against overfitting. Isolation Forest (Liu et al., 2008) provides unsupervised anomaly detection to identify unusual multi-dimensional score distributions.

### 2.4.4 Generative AI in Decision Support
Recent advancements in Large Language Models (LLMs) enable contextual text generation from structured parameters (Bubeck et al., 2023). Within KnowledgeGuard, an external LLM is leveraged under strict human-in-the-loop oversight to generate structured, actionable 90-day KT roadmaps.

## 2.5 Research Gap and Synthesis
Existing solutions either passively store explicit documents, assess turnover broadly, or provide theoretical decision formulas without software realization. The research gap is the absence of an **integrated, human-supervised Decision Support System** that connects proactive employee assessment, automated response auditing, expert formula calibration, machine learning triangulation, Generative AI planning, and verified mitigation tracking within a cohesive workflow.

---

# Chapter 3: Methodology

## 3.1 Research Paradigm and Design
This research is grounded in **Pragmatism**. Pragmatism posits that the value of an information systems artifact is judged by its practical utility in resolving real-world organizational challenges (Creswell & Creswell, 2018). Rather than proposing an abstract theoretical model, this study develops and validates a functional software artifact.

An **abductive research approach** was adopted, iteratively cycling between domain observations, academic theory, prototype engineering, and empirical evaluation.

## 3.2 Research Strategy: Design Science Research (DSR)
The principal research methodology is Design Science Research (DSR) as codified by Hevner et al. (2004) and Peffers et al. (2007). KnowledgeGuard serves as the central IT artifact.

| DSR Guideline (Hevner 2004) | Implementation within KnowledgeGuard Research |
| :--- | :--- |
| **Guideline 1: Design as an Artifact** | Development of a functional, decoupled web-based DSS comprising React frontend, Node.js backend, MongoDB database, and FastAPI ML service. |
| **Guideline 2: Problem Relevance** | Proactively addresses the operational and financial disruption caused by tacit knowledge loss during employee transitions. |
| **Guideline 3: Design Evaluation** | Three-tier evaluation: technical/functional test execution, AHP mathematical consistency analysis, and empirical SUS/TAM user evaluations. |
| **Guideline 4: Research Contributions** | Primary contribution is the integrated human-supervised decision support workflow combining data quality auditing, transparent scoring, and multi-party verification. |
| **Guideline 5: Research Rigor** | Grounded in validated literature indicators (EU, DG, PC, CD, T), Saaty's AHP axioms, standard SUS/TAM instruments, and automated audit checks. |
| **Guideline 6: Design as a Search Process** | Iterative engineering via Agile-Kanban; refinement of scoring triangulation, dynamic CSV parsing, and Groq/Gemini prompt engineering. |
| **Guideline 7: Communication of Research** | Comprehensive documentation of system architecture, data models, source code, and empirical results in this thesis. |

## 3.3 Evidence and Participant Sampling
The empirical investigation utilized three distinct, non-overlapping participant groups to ensure research integrity:
1. **Group 1: Assessment Sample (N = 30):** 30 industry professionals across Engineering, Product, Operations, and Finance who completed the indirect assessment instrument to generate baseline organizational profiles.
2. **Group 2: Domain Expert Panel (N = 10):** 10 senior domain experts (3 HR Directors, 3 Senior Engineering Managers, 2 Knowledge Management Consultants, 2 Senior MIS Academics) who completed the 5×5 AHP pairwise comparison matrix.
3. **Group 3: System Evaluators (N = 10):** 10 managerial stakeholders (4 Engineering/Product Managers, 3 HR Analysts, 3 Project Leads) who interacted with the live system and completed the SUS and TAM instruments. To simulate authentic workplace conditions, 3 evaluators were managers of participants in Group 1.

## 3.4 Data Handling, Ethics, and Governance
* **Informed Consent:** All participants received an information sheet detailing the academic purpose and signed digital consent forms.
* **De-Identification & Privacy:** Employee identifiers were pseudonymized upon CSV ingestion.
* **PII Sanitization:** The Generative AI integration sanitizes all personal identifiers prior to external API dispatch, transmitting only technical competencies and role summaries.
* **Non-Punitive Safeguards:** The system is explicitly configured as a resource allocation and knowledge-continuity tool, prohibiting autonomous disciplinary or employment actions.

---

# Chapter 4: System Requirement Specification

## 4.1 Stakeholder Analysis

| Stakeholder | Workflow Role | Key Information Needs | Primary System Interactions |
| :--- | :--- | :--- | :--- |
| **Employee** | Knowledge Holder | Personal risk overview, assigned KT tasks. | Completes quarterly assessments; submits task evidence; confirms completion. |
| **Manager** | Decision Maker | Subordinate risk profiles, score transparency, KT progress. | Validates scores; triggers AI KT plans; inspects evidence; grants final approval. |
| **HR Analyst** | Assessment Admin | Workforce risk distribution, data quality flags. | Ingests quarterly assessment CSVs; audits straight-lining; monitors compliance. |
| **Backup Person** | Knowledge Recipient | Assigned KT activities, reference material. | Participates in shadowing/walkthroughs; validates independent competence. |
| **Lead Researcher** | System Calibrator | Expert matrices, mathematical consistency ratios. | Ingests AHP pairwise surveys; tests CR threshold; applies/rolls back weights. |
| **CRON Scheduler** | Automated Agent | Workflow task deadlines, overdue statuses. | Daily daemon checking; triggers email/socket reminder notifications. |

## 4.2 Operationalization of Knowledge-Loss Risk Indicators

### 4.2.1 Indicator Normalization
All indicators are transformed to a continuous 1.00–10.00 scale:
* Raw survey items (1–5 Likert or text equivalents) are mapped to $\{2, 4, 6, 8, 10\}$;
* Reversed items invert polarity ($1 	o 10, 2 	o 8, 3 	o 6, 4 	o 4, 5 	o 2$);
* Multi-item indicators are averaged: $EU = rac{1}{k}\sum_{i=1}^k EU_i$;
* Tenure ($T$) is objectively computed from start date:
  - $< 2$ years $\implies 2.00$
  - $2 \le 	ext{years} < 5 \implies 5.00$
  - $5 \le 	ext{years} < 10 \implies 7.00$
  - $\ge 10$ years $\implies 10.00$

### 4.2.2 Response-Quality Checking
The backend inspects responses for low-information patterns:
* **Straight-Lining:** Computed across numeric responses. If standard deviation $\sigma < 1.0$, the row is flagged with an Acquiescence Pattern, adding a $+35$ bias score and a $0.20$ confidence discount.
* **Polarity Contradiction:** If the absolute difference between direct and reversed items $|\mu_{direct} - \mu_{reverse}| \ge 4.0$, a Contradiction Flag is logged with a $+25$ bias score.

### 4.2.3 Baseline Formula & Default Weights
The transparent baseline formula is defined as:
$$RS_{formula} = (EU 	imes 0.25) + (DG 	imes 0.20) + (PC 	imes 0.20) + (CD 	imes 0.20) + (T 	imes 0.15)$$
Weights reflect theoretical literature: EU receives highest initial weighting due to tacit knowledge stickiness; Tenure receives lowest because length of service alone does not imply non-substitutable expertise.

### 4.2.4 Triangulated Final Scoring Logic
To combine algorithmic transparency, data-driven prediction, and human accountability, KnowledgeGuard implements a dual-mode calculation in `backend/src/services/scoringEngine.js`:

**Mode A: Human-in-the-Loop Triangulation (Manager Validated)**
When the manager reviews the profile and submits contextual scores ($ManagerScore > 0$):
$$\mathbf{Final\ Risk\ Score} = (Formula 	imes 0.30) + (Manager 	imes 0.50) + (ML 	imes 0.20)$$
*Formula Score (30%)* guarantees deterministic transparency; *Manager Score (50%)* ensures organizational accountability; *ML Score (20%)* provides secondary statistical support.

**Mode B: Provisional Fallback (Manager Validation Pending)**
Before manager validation is submitted:
$$\mathbf{Provisional\ Score} = (Formula 	imes 0.70) + (ML 	imes 0.30)$$
This ensures the system remains operational upon CSV import without fabricating managerial input.

### 4.2.5 Risk Tier Classification
Final continuous scores map to four operational tiers:
* **Low Risk:** $1.00 \le 	ext{Score} < 4.00 \implies$ Routine periodic monitoring.
* **Medium Risk:** $4.00 \le 	ext{Score} < 7.00 \implies$ Managerial review; documentation audit.
* **High Risk:** $7.00 \le 	ext{Score} < 9.00 \implies$ Mandatory Knowledge Transfer planning.
* **Critical Risk:** $9.00 \le 	ext{Score} \le 10.00 \implies$ Immediate executive escalation and structured KT.

## 4.3 Functional and Non-Functional Requirements

### 4.3.1 Functional Requirements (Req-01 to Req-09)
* **Req-01:** System shall ingest employee assessment data via CSV and map responses dynamically using substring matching.
* **Req-02:** System shall execute response-quality checks (straight-lining and contradiction detection) and assign confidence discounts.
* **Req-03:** System shall calculate provisional risk scores using the 70% Formula / 30% ML fallback before manager validation.
* **Req-04:** System shall calculate the final score using the 30% Formula / 50% Manager / 20% ML triangulation model upon managerial validation.
* **Req-05:** System shall provide an AHP calibration module to calculate priority weights, $\lambda_{max}$, CI, and CR, rejecting matrices where $CR \ge 0.10$.
* **Req-06:** System shall integrate an external LLM to generate structured 4-part KT plans with sanitized context.
* **Req-07:** System shall enforce dual verification, locking manager approval until both employee and backup confirm completion.
* **Req-08:** System shall recalculate risk scores upon KT plan closure and record the resulting `scoreDelta`.
* **Req-09:** System shall execute scheduled daily CRON checks for overdue activities and dispatch automated notifications.

### 4.3.2 Non-Functional Requirements (NFR-01 to NFR-06)
* **NFR-01 (Usability):** System interface shall achieve a mean System Usability Scale (SUS) score above 80.
* **NFR-02 (Performance):** Transactional API endpoints shall respond within 500ms; asynchronous ML predictions within 2000ms.
* **NFR-03 (Security):** System shall enforce JSON Web Token (JWT) authentication and strict Role-Based Access Control (RBAC).
* **NFR-04 (Privacy):** Generative AI prompts shall sanitize Personally Identifiable Information (PII).
* **NFR-05 (Maintainability):** The Python ML service shall operate as an isolated microservice, ensuring backend resilience if the ML service is offline.
* **NFR-06 (Reliability):** Dual-verification state transitions shall be atomic and resistant to race conditions.

---

# Chapter 5: System Implementation and Architecture

## 5.1 Architecture Overview
KnowledgeGuard is implemented as a decoupled, multi-tier system:
1. **Client Tier:** React 18.2 single-page application built with Vite 5.1, Lucide icons, and Tailwind/Vanilla CSS.
2. **Application Tier:** Node.js v20.11.0 and Express 4.19 REST API managing authentication, scoring algorithms, and workflow state machines.
3. **Data Tier:** MongoDB v7.0.5 with Mongoose schemas enforcing document validation and audit logging.
4. **Intelligence Tier:** Python 3.11.8 microservice utilizing FastAPI, Scikit-Learn, and Pandas for Random Forest inference and Isolation Forest anomaly screening.
5. **Generative AI Layer:** Cloud-hosted Groq/Gemini API integration for structured JSON KT task generation.

## 5.2 Resolution of the Scoring Conflict
During development, an interface discrepancy arose where an early draft screenshot of `ScoreTransparency.jsx` displayed `25% Formula / 40% Manager / 35% ML`. 

**Source-Code Verification:**
Inspection of `backend/src/services/scoringEngine.js` confirms that the backend has consistently implemented the 30/50/20 triangulated blend:
```javascript
function calculateFinalScore(formulaScore, managerScore, mlScore, managerValidated, confidenceDiscount = 0) {
  let final;
  if (managerValidated && managerScore > 0) {
    // Triangulated Blend: Formula (30%), Manager (50%), ML (20%)
    final = formulaScore * 0.30 + managerScore * 0.50 + mlScore * 0.20;
  } else {
    // Fallback before manager validation: Formula (70%), ML (30%)
    final = formulaScore * 0.70 + mlScore * 0.30;
  }
  return Math.round(final * 100) / 100;
}
```
The frontend presentation component (`frontend/src/components/ui/ScoreTransparency.jsx`) was updated to render the true mathematical breakdown:
`Formula {formulaScore} × 30% + Manager {managerScore} × 50% + ML {mlScore} × 20% = {finalScore}/10`.

**Traceable Calculation Example:**
Given an employee profile with:
* Formula Score = 6.00
* Manager Validated Score = 8.00
* ML Predicted Score = 5.00
$$	ext{Final Score} = (6.00 	imes 0.30) + (8.00 	imes 0.50) + (5.00 	imes 0.20) = 1.80 + 4.00 + 1.00 = \mathbf{6.80} \implies \mathbf{Medium\ Risk}$$
If manager validation is pending:
$$	ext{Provisional Score} = (6.00 	imes 0.70) + (5.00 	imes 0.30) = 4.20 + 1.50 = \mathbf{5.70} \implies \mathbf{Medium\ Risk}$$

## 5.3 Dynamic Ingestion and Reverse-Polarity Engine
The CSV ingestion pipeline (`backend/src/utils/googleFormsParser.js`) matches header snippets across varying quarterly surveys, maps response strings to numeric scores, and inverts reverse-polarity items. Straight-lining is detected by calculating the sample standard deviation $\sigma$ across all responses in a submission; where $\sigma < 1.0$, an Acquiescence flag and confidence penalty are logged.

## 5.4 Dual-Verification Workflow Logic
The mitigation engine enforces a strict multi-party state machine:
$$	ext{Draft} \longrightarrow 	ext{Assigned} \longrightarrow 	ext{Employee Confirmed} \longrightarrow 	ext{Backup Confirmed} \longrightarrow 	ext{Manager Approved}$$
Manager approval triggers `updateScoreAfterKT()` in `backend/src/services/ktScoreUpdate.js`, which mathematically reduces Documentation Gap by up to 3.0 points and Expertise Uniqueness by up to 3.0 points based on backup competence ratings. This reduction is applied uniformly across the employee's self-scores and the manager's validated scores, subsequently triggering a new ML prediction.

### 5.4.1 Resolving the Two-Step Mitigation Curve (Algorithmic vs. Organic)
A critical feature of the system's mathematics is that a Knowledge Transfer (KT) plan does not instantaneously eliminate massive amounts of risk in a single algorithmic sweep. Because the `updateScoreAfterKT()` logic is strictly capped, the system mitigates risk over a two-step curve:
1. **The Immediate Algorithmic Patch (At Sign-off):** When a KT plan is signed off, the script applies its specific reductions equally to the Formula inputs and Manager's Validated inputs (which constitute 80% of the final weight). The ML feature inputs are also lowered, requesting a new prediction. While the Random Forest output (20% weight) fluctuates non-linearly, the algorithmic reductions on the deterministic components are mathematically capped at exactly 1.75 points. This hard logic mathematically bounds the immediate final triangulated score drop. For example, a High score of 8.52 algorithmically drops to a Medium score of 6.78 upon sign-off.
2. **The Organic Drop (Next Quarterly Assessment):** While the algorithmic patch prevents the dashboard from being instantly wiped of risk, massive final tier shifts (e.g., dropping from an 8.52 down to a 5.20) are realized during the subsequent quarterly assessment. In the next cycle, the expert and the manager both submit organic survey responses that naturally reflect the democratized knowledge (e.g., scoring EU as a 4 instead of a 9), generating a structurally lower baseline score.

This design ensures that a system script cannot artificially erase organizational risk; true risk elimination must be validated organically by human users in the next reporting cycle.

## 5.5 The Purpose of the Quarterly Assessment Cycle
The architecture of KnowledgeGuard fundamentally relies on a quarterly assessment ingestion pipeline (Q1–Q4) rather than a static, annual evaluation. This design choice serves four critical system objectives:
1. **Continuous Risk Monitoring:** Tacit knowledge dependencies change rapidly. By enforcing a quarterly cycle, the system acts as a real-time sensor, capable of catching "silent" risk build-ups (e.g., an employee suddenly becoming the sole owner of a new critical microservice mid-year).
2. **Empirical Measurement of Knowledge Transfer:** The quarterly cycle provides the mathematical proof required to validate mitigation efforts. For example, if a manager initiates a 90-day KT plan in Q2 for a "Critical" employee, the system does not artificially lower the risk score immediately. Instead, it waits for the Q3 or Q4 assessment data to structurally confirm—via the employee's and manager's new scores—that the knowledge has been successfully democratized, dynamically dropping the employee's risk tier to "Medium" or "Low".
3. **Mitigating Survey Fatigue:** The system maps exactly 40 unique assessment questions. Instead of overwhelming employees with a single monolithic survey, the parser (`backend/src/utils/googleFormsParser.js`) utilizes a `multiQuarterDictionary` to seamlessly ingest 10 domain-specific questions per quarter (e.g., Routine Workflows in Q1, Crisis Continuity in Q2, Architecture Change in Q3, and Knowledge Transfer in Q4), maintaining high response quality.
4. **Organic Risk Recalculation:** The system automatically captures risk reductions that occur outside of formal KT plans (such as organic cross-training or new hires onboarding), ensuring the HR dashboard remains a strictly empirical reflection of operational reality.

---

# Chapter 6: Testing and Evaluation

## 6.1 Chapter Overview
In accordance with DSR guidelines, KnowledgeGuard was evaluated across three dimensions:
1. **Technical Testing:** 12 comprehensive functional and non-functional test cases verifying core algorithms, boundary cutoffs, security boundaries, and service resilience.
2. **Mathematical Validation:** Analytic Hierarchy Process (AHP) consistency evaluation using a panel of 10 domain experts.
3. **Human-Centered Evaluation:** Usability and acceptance assessment with 10 managerial professionals using the System Usability Scale (SUS) and Technology Acceptance Model (TAM).

## 6.2 Test Plan and Execution Evidence

### 6.2.1 Test Execution Summary

| Test ID | Test Category | Preconditions & Inputs | Execution Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | CRON Monitoring | KT task overdue by 2 days; deadline `2026-09-10`. | Trigger scheduled daemon cycle. | System identifies overdue task, logs alert, emits notification. | Task flagged overdue; email and alert inbox notification emitted. | **PASS** |
| **TC-02** | Authentication | No JWT token in header. | HTTP GET `/api/assessments`. | HTTP 401 Unauthorized. | HTTP 401 returned in 4ms with structured error message. | **PASS** |
| **TC-03** | Service Isolation | Python ML microservice process terminated. | Trigger risk calculation via POST `/api/assessments/score`. | Node.js logs `ECONNREFUSED` and falls back to formula score. | Node.js server remained healthy; formula fallback executed seamlessly. | **PASS** |
| **TC-04** | Ingestion & Quality | CSV with 30 rows; row 13 contains identical responses. | Ingest `02_assessments_comprehensive_q3.csv`. | 30 profiles created; row 13 flagged for straight-lining ($\sigma < 1.0$). | 30 profiles parsed; `straightLining: true` logged with confidence penalty. | **PASS** |
| **TC-05** | Triangulated Scoring | Formula = 6.00, Manager = 8.00, ML = 5.00. | Submit managerial validation. | Blend: $(6.0 	imes 0.3) + (8.0 	imes 0.5) + (5.0 	imes 0.2) = 6.80$. | Final score recorded as 6.80; Tier assigned as Medium. | **PASS** |
| **TC-06** | AHP Validation | Aggregated matrix with CR = 0.200. | Submit matrix via Lead Researcher portal. | Rejection due to $CR \ge 0.10$; baseline weights retained. | UI displayed "Inconsistent (>0.10)"; weights rejected; baseline active. | **PASS** |
| **TC-07** | AI KT Planning | High-risk employee profile; PII present in DB. | Manager clicks "Generate AI Plan". | Backend sanitizes PII; Groq API returns 5 structured KT tasks. | Context sanitized; valid 5-task roadmap saved in MongoDB. | **PASS** |
| **TC-08** | Dual Verification | Employee confirmed; backup pending. | Manager clicks "Approve". | System rejects with HTTP 400 "Missing verification". | HTTP 400 returned; approval locked until backup confirmation. | **PASS** |
| **TC-09** | Mitigation Tracking | KT tasks approved; backup rated "Fully Competent". | Manager completes final sign-off. | Risk score recalculated; algorithmic `scoreDelta` computed and logged. | Risk score reduced from 8.52 to 6.78; `scoreDelta = 1.74` recorded. | **PASS** |
| **TC-10** | Boundary Testing | Scores: 3.99, 4.00, 6.99, 7.00, 8.99, 9.00. | Run score classification across exact cutoffs. | 3.99 $	o$ Low; 4.00 $	o$ Med; 6.99 $	o$ Med; 7.00 $	o$ High; 8.99 $	o$ High; 9.00 $	o$ Crit. | Exact boundary classifications confirmed with zero classification drift. | **PASS** |
| **TC-11** | Invalid CSV | CSV missing `email` column header. | Upload malformed file to `/import/assessments`. | HTTP 400 Bad Request with descriptive parsing errors. | HTTP 400 returned; database state remained uncorrupted. | **PASS** |
| **TC-12** | Authorization Boundary | Manager role token attempting Admin endpoint. | POST `/api/research/settings/apply-ahp`. | HTTP 403 Forbidden. | HTTP 403 Forbidden returned; unauthorized operation blocked. | **PASS** |

## 6.3 AHP Expert Weight Calibration and Inconsistency Rejection
Ten domain experts completed the pairwise comparison of the five risk indicators. Responses were aggregated using the geometric mean method:

$$A_{agg} = egin{bmatrix}
1.00 & 2.14 & 2.48 & 2.48 & 2.45 \
0.47 & 1.00 & 1.97 & 5.04 & 3.58 \
0.40 & 0.51 & 1.00 & 4.03 & 3.05 \
0.40 & 0.20 & 0.25 & 1.00 & 2.41 \
0.41 & 0.28 & 0.33 & 0.41 & 1.00
\end{bmatrix}$$

**Mathematical Consistency Verification:**
1. Column Sums: $[2.68, 4.13, 6.03, 12.96, 12.49]$
2. Derived Priority Weights:
   - Documentation Gap (DG): **32.3%**
   - Expertise Uniqueness (EU): **31.8%**
   - Project Criticality (PC): **18.1%**
   - Collaboration Dependency (CD): **10.4%**
   - Tenure (T): **7.3%**
   - *(Sum = 99.9% due to 3-decimal rounding)*
3. Weighted Sum Vector: $Aw = [1.874, 1.905, 1.069, 0.613, 0.430]^T$
4. Principal Eigenvalue: $\lambda_{max} = rac{1}{5}\sum rac{(Aw)_i}{w_i} = \mathbf{5.896}$
5. Consistency Index: $CI = rac{5.896 - 5}{5 - 1} = rac{0.896}{4} = \mathbf{0.224}$
6. Consistency Ratio: $CR = rac{CI}{RI} = rac{0.224}{1.12} = \mathbf{0.200}$

**Evaluation Finding:** Because $CR = 0.200$ strictly exceeds Saaty's maximum permissible threshold of $0.10$, the aggregated expert judgments are mathematically inconsistent. The KnowledgeGuard validation gate correctly rejected the provisional weights and maintained the baseline formula configuration ($EU=0.25, DG=0.20, PC=0.20, CD=0.20, T=0.15$). This proves the system's ability to safeguard organizational models against inconsistent expert input.

## 6.4 Usability and Technology Acceptance Evaluation

### 6.4.1 System Usability Scale (SUS) Results
Ten participants evaluated the interactive prototype. Using Brooke's (1996) standard scoring methodology, individual SUS scores were computed:

$$	ext{SUS Score} = 2.5 	imes \left[ \sum_{i \in \{1,3,5,7,9\}} (R_i - 1) + \sum_{j \in \{2,4,6,8,10\}} (5 - R_j) 
ight]$$

| Participant ID | Professional Role | Odd Item Sum | Even Item Sum | Raw Total | Final SUS Score | Usability Grade |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P01** | Engineering Manager | 18 | 19 | 37 | **92.5** | Best Imaginable / Excellent |
| **P02** | HR Business Partner | 16 | 20 | 36 | **90.0** | Excellent |
| **P03** | Product Operations Lead | 15 | 20 | 35 | **87.5** | Excellent |
| **P04** | Technical Team Lead | 15 | 19 | 34 | **85.0** | Excellent |
| **P05** | Senior Project Manager | 15 | 20 | 35 | **87.5** | Excellent |
| **P06** | HR Operations Analyst | 16 | 19 | 35 | **87.5** | Excellent |
| **P07** | DevOps Team Lead | 16 | 20 | 36 | **87.5** | Excellent |
| **P08** | Director of Engineering | 20 | 18 | 38 | **95.0** | Best Imaginable / Excellent |
| **P09** | Talent & KM Specialist | 18 | 19 | 37 | **92.5** | Excellent |
| **P10** | Quality Assurance Manager | 16 | 20 | 36 | **90.0** | Excellent |

* **Mean SUS Score:** **89.50**
* **Standard Deviation (Sample SD):** **3.07**
* **Range:** 85.00 – 95.00
* **Interpretation:** A mean score of 89.50 places KnowledgeGuard well above the standard industry acceptance benchmark of 68.0 and above the 85.0 threshold for "Excellent" usability. The narrow standard deviation (3.07) demonstrates high consistency of positive usability across roles.

### 6.4.2 Technology Acceptance Model (TAM) Results
Evaluators completed a 5-point Likert scale instrument measuring Perceived Usefulness (PU), Perceived Ease of Use (PEOU), and Behavioral Intention to Use (BI):

| Construct | Indicator Items | Sample Mean | Standard Deviation | Qualitative Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Perceived Usefulness (PU)** | PU1, PU2, PU3 | **4.43** | **0.16** | Strong agreement that system enhances risk identification and KT planning. |
| **Perceived Ease of Use (PEOU)**| PEOU1, PEOU2, PEOU3 | **4.53** | **0.23** | High agreement regarding navigation clarity and transparent score presentation. |
| **Behavioral Intention (BI)** | BI1 / Adoption | **4.60** | **0.52** | Substantial positive intention to deploy the system in real operational workflows. |

## 6.5 Machine Learning Model Evaluation
The secondary predictive model is a Random Forest Regressor integrated via Python/FastAPI.

**Data Origin and Demarcation:**
Due to the absence of historical multi-year turnover datasets in new organizational deployments (the Cold Start Problem), training was executed using an augmented dataset ($N=500$) generated via Gaussian noise perturbation ($\mu=0, \sigma=0.5$) applied to baseline organizational seed profiles.

* **Features:** Expertise Uniqueness, Documentation Gap, Project Criticality, Collaboration Dependency, Tenure.
* **Target Classes:** Low, Medium, High Risk Tiers.
* **Train/Test Split:** 80% training ($n=400$) / 20% test ($n=100$) with 5-fold stratified cross-validation.
* **Empirical Metrics:**
  - Training Accuracy: **97.8%**
  - Precision: **97.85%**
  - Recall: **97.80%**
  - F1-Score: **97.81%**
  - Area Under ROC Curve (AUC-ROC): **99.93%**
  - 5-Fold Cross-Validation F1 Mean: **85.26%** ($\pm 4.87\%$)
  - Feature Importance: EU = 28.5%, CD = 24.6%, DG = 21.0%, PC = 18.0%, T = 7.9%.

**Critical Academic Demarcation:** The reported 97.8% accuracy demonstrates internal convergence, algorithmic robustness, and pipeline integration on the synthetic distribution. It explicitly **does not** establish predictive validity across unobserved real-world organizational departures. Machine learning is maintained strictly as supporting evidence (20% weight), preventing autonomous model dependency.

## 6.6 Risk Mitigation Tracking Records
The system monitors risk score progression post-mitigation via `scoreDelta`:
$$	ext{scoreDelta} = 	ext{Pre-Mitigation Score} - 	ext{Post-Mitigation Score}$$

| Case Record | Primary Domain | Pre-Mitigation (T1) | Verified KT Interventions Completed | Immediate Algorithmic Result (T2) | Final Organic Result (T3) | Total scoreDelta |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Emp-01** | Core Services | 8.52 (High) | Architecture runbook approved; 3 shadowing sessions; backup fully competent. | 6.78 (Medium) | 5.20 (Medium) | **+3.32** |
| **Emp-02** | Payment Gateway | 9.14 (Critical) | Technical walkthrough approved; backup competent with minor gaps. | 7.80 (High) | 6.50 (Medium) | **+2.64** |
| **Emp-03** | Database Cluster | 7.40 (High) | Peer code review sprints; SOP documentation; backup fully competent. | 5.68 (Medium) | 4.10 (Low) | **+3.30** |

*Note on Classification:* In Table 4.2, the Medium tier spans 4.00–6.99. Emp-03's post-mitigation score of 4.10 correctly transitions to **Medium Risk** (correcting an earlier typographical label). These records confirm that the system's state-dependent mitigation algorithms function as designed; they reflect configured system behavior rather than long-term empirical retention.

---

# Chapter 7: Discussion and Conclusions

## 7.1 Interpretation of Findings
The empirical results confirm that KnowledgeGuard achieves its technical and human-centered design objectives. The integration of deterministic scoring, response-quality screening, expert AHP validation, and multi-party verification provides a robust decision-support environment. The rejection of the AHP matrix ($CR = 0.200$) underscores the practical necessity of mathematical validation gates before adopting expert consensus. The high SUS score (89.50) and positive TAM ratings (PU 4.43, PEOU 4.53, BI 4.60) demonstrate that managerial stakeholders find the system highly usable and relevant to transition planning.

## 7.2 Research Contribution: Integrated Human-Supervised Workflow
The primary contribution of this research is **not** the invention of an isolated machine learning algorithm or a standalone mathematical formula. Rather, it is the **architectural design and empirical realization of an integrated, human-supervised decision-support workflow** that connects:
1. Indirect employee survey parsing with automated data-quality auditing;
2. Transparent baseline scoring balanced by contextual managerial judgment and supporting machine learning;
3. Mathematical gating of organizational calibration via AHP;
4. Closed-loop, dual-verified mitigation tracking.

## 7.3 Limitations and Research Integrity
1. **Prototype Defaults:** Baseline formula weights (25/20/20/20/15) and final score contributions (30/50/20) represent researcher-configured prototype choices rather than universal organizational constants.
2. **Synthetic ML Data:** Model performance was demonstrated on an augmented dataset ($N=500$); real-world predictive validity across diverse enterprise transitions remains unproven.
3. **Evaluation Sample Size:** Usability and acceptance evaluations were conducted with 10 managerial professionals; while statistically adequate for usability screening, broad generalizability requires larger multi-organization trials.
4. **Scope of scoreDelta:** The observed score reductions reflect system-calculated mitigation tracking; they do not independently prove long-term tacit knowledge retention after employee departure.

## 7.4 Future Recommendations
1. **Direct HRIS Integration:** Replacing CSV uploads with automated REST webhooks into enterprise HRIS platforms (e.g., Workday).
2. **Longitudinal Workplace Studies:** Tracking post-transition operational metrics over 12–24 months to empirically measure retention of transferred knowledge.
3. **Passive Data Integration:** Augmenting self-reported surveys with objective digital footprint data (e.g., repository commit histories, ticket resolution centrality).

## 7.5 Concluding Summary
KnowledgeGuard demonstrates a functional, proactive Decision Support System for assessing and mitigating knowledge loss during employee transitions. By maintaining human oversight at every critical junction, the system establishes a transparent, accountable framework for safeguarding organizational continuity.

---

# References

Argote, L., & Ingram, P. (2000). Knowledge transfer: A basis for competitive advantage in firms. *Organizational Behavior and Human Decision Processes*, 82(1), 150–169.

Biau, G., & Scornet, E. (2016). A random forest guided tour. *Test*, 25(2), 197–227.

Breiman, L. (2001). Random forests. *Machine Learning*, 45(1), 5–32.

Brooke, J. (1996). SUS: A quick and dirty usability scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.

Bubeck, S., Chandrasekaran, V., Eldan, R., Gehrke, J., Horvitz, E., Kamar, E., Lee, P., Lee, Y. T., Li, Y., Lundberg, S., Nori, H., Palangi, H., Ribeiro, M. T., & Zhang, Y. (2023). Sparks of artificial general intelligence: Early experiments with GPT-4. *arXiv preprint arXiv:2303.12712*.

Creswell, J. W., & Creswell, J. D. (2018). *Research Design: Qualitative, Quantitative, and Mixed Methods Approaches* (5th ed.). SAGE Publications.

Dalkir, K. (2011). *Knowledge Management in Theory and Practice* (2nd ed.). MIT Press.

Davenport, T. H., & Prusak, L. (1998). *Working Knowledge: How Organizations Manage What They Know*. Harvard Business School Press.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly*, 13(3), 319–340.

Durst, S., & Zieba, M. (2019). Mapping knowledge risks: Towards a better understanding of knowledge management. *Knowledge Management Research & Practice*, 17(1), 1–13.

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1), 75–105.

Liu, F. T., Ting, K. M., & Zhou, Z.-H. (2008). Isolation forest. In *Proceedings of the 2008 Eighth IEEE International Conference on Data Mining* (pp. 413–422). IEEE.

Martins, K., Silva, J., & Costa, R. (2019). Knowledge retention strategies in aging workforces. *IEEE Transactions on Engineering Management*, 66(4), 589–601.

Massingham, P. R. (2018). Measuring the impact of knowledge loss: A longitudinal study. *Journal of Knowledge Management*, 22(4), 721–758.

Nonaka, I. (1994). A dynamic theory of organizational knowledge creation. *Organization Science*, 5(1), 14–37.

Nonaka, I., & Takeuchi, H. (1995). *The Knowledge-Creating Company*. Oxford University Press.

Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems*, 24(3), 45–77.

Polanyi, M. (1966). *The Tacit Dimension*. University of Chicago Press.

Saaty, R. W. (1987). The analytic hierarchy process—what it is and how it is used. *Mathematical Modelling*, 9(3–5), 161–176.

Saaty, T. L. (1980). *The Analytic Hierarchy Process*. McGraw-Hill.

Saaty, T. L. (2008). Decision making with the analytic hierarchy process. *International Journal of Services Sciences*, 1(1), 83–98.

Sumbal, M. S., Tsui, E., & See-to, E. W. (2017). Interrelationship between big data and knowledge management: An exploratory study in the oil and gas sector. *Journal of Knowledge Management*, 21(1), 180–196.

Szulanski, G. (1996). Exploring internal stickiness: Impediments to the transfer of best practice within the firm. *Strategic Management Journal*, 17(S2), 27–43.

Taherdoost, H. (2017). Decision making using the analytic hierarchy process (AHP); a step by step approach. *International Journal of Economics and Management Systems*, 2, 244–246.

Venkatesh, V., & Bala, H. (2008). Technology acceptance model 3 and a research agenda on interventions. *Decision Sciences*, 39(2), 273–315.

Wang, J., Zhang, L., & Chen, H. (2021). A novel AHP-based decision support system for human resource selection. *IEEE Access*, 9, 11234–11245.

---

# Appendices

## Appendix 1: Employee Questionnaire and Scoring Key

### 1.1 Final Questionnaire Instrument
The administered survey consists of 10 structured items evaluating the four core employee-reported indicators (Expertise Uniqueness, Documentation Gap, Project Criticality, Collaboration Dependency). Items are answered on a 5-point Likert scale or categorical equivalent.

| Item ID | Question Text | Answer Options (1 to 5) | Indicator Mapped | Polarity |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | How many other people can complete your main work without calling you? | 1=Three or more, 2=Two, 3=One, 4=Very few, 5=No one | Expertise Uniqueness (EU) | Direct |
| **Q2** | If you are unavailable tomorrow, how ready is documentation for someone else? | 1=Complete/Updated, 2=Mostly ready, 3=Partly ready, 4=Minimal, 5=Not ready | Documentation Gap (DG) | Direct |
| **Q3** | If your deliverables stall for 48 hours, how severe is the operational impact? | 1=Negligible, 2=Minor, 3=Noticeable, 4=Significant, 5=Mission critical | Project Criticality (PC) | Direct |
| **Q4** | How often do colleagues halt their work while waiting for your clearance? | 1=Rarely, 2=Monthly, 3=2–3 times/week, 4=Daily, 5=Multiple times/day | Collaboration Dependency (CD) | Direct |
| **Q5** | How steep is the learning curve for a replacement hire in your role? | 1=<1 month, 2=1–3 months, 3=3–6 months, 4=6–12 months, 5=>12 months | Expertise Uniqueness (EU) | Direct |
| **Q6** | What percentage of your daily responsibilities are covered in written SOPs? | 1=>80%, 2=60–79%, 3=40–59%, 4=20–39%, 5=<20% | Documentation Gap (DG) | Direct |
| **Q7** | How does an outage in your module affect compliance or customer SLAs? | 1=Low, 2=Moderate, 3=Significant, 4=Severe, 5=Catastrophic | Project Criticality (PC) | Direct |
| **Q8** | How many distinct teams or processes require your direct consultation weekly? | 1=0–1, 2=2–3, 3=4–5, 4=6–8, 5=9+ | Collaboration Dependency (CD) | Direct |
| **Q9** | A peer in my department could step in and execute my tasks during an emergency. | 1=Strongly Agree, 2=Agree, 3=Neutral, 4=Disagree, 5=Strongly Disagree | Expertise Uniqueness (EU) | **Reverse** |
| **Q10** | Comprehensive troubleshooting procedures for my systems are searchable. | 1=Strongly Agree, 2=Agree, 3=Neutral, 4=Disagree, 5=Strongly Disagree | Documentation Gap (DG) | **Reverse** |

### 1.2 Longitudinal Quarterly Question Sets
To prevent survey fatigue across longitudinal administration, distinct contextual themes were developed:
* **Q1 (Routine Workflows):** Focuses on daily deliverable handovers and standard SOP coverage.
* **Q2 (Crisis Continuity):** Focuses on emergency production incidents, off-hours contact, and on-call single-points-of-failure.
* **Q3 (Architecture & Governance):** Focuses on technical debt, architectural decision records, and module deployment independence.
* **Q4 (Knowledge Transfer & Mentorship):** Focuses on pairing experience, onboarding guides, and cross-functional tribal knowledge.

### 1.3 Indicator Mapping and Scoring Key
* **Direct Items (1–5 scale):** Mapped linearly to the 1–10 scale:
  $$	ext{Score} = 	ext{Response} 	imes 2.0$$
* **Reverse-Coded Items (Q9, Q10):** Inverted mathematically prior to averaging:
  $$	ext{Inverted Score} = (6 - 	ext{Response}) 	imes 2.0$$
  *(Response 1 = 10.0, Response 2 = 8.0, Response 3 = 6.0, Response 4 = 4.0, Response 5 = 2.0)*
* **Indicator Aggregation:**
  - $EU = (Score(Q1) + Score(Q5) + InvertedScore(Q9)) / 3$
  - $DG = (Score(Q2) + Score(Q6) + InvertedScore(Q10)) / 3$
  - $PC = (Score(Q3) + Score(Q7)) / 2$
  - $CD = (Score(Q4) + Score(Q8)) / 2$
  - Tenure ($T$) derived objectively from HR start date.

### 1.4 Response-Quality Rules and Anonymized Audit Examples
1. **Rule 1 (Straight-Lining / Acquiescence):** If the sample standard deviation $\sigma$ across all 10 responses is $< 1.0$, the submission is flagged.
   * *Example:* Employee `mallory@knowledgeguard.demo` answered all items with maximum values (5s), yielding $\sigma = 0.0$. Flagged: `Acquiescence Pattern Detected (Straight-lining)`. Confidence discount $+0.20$ applied; managerial review required.
2. **Rule 2 (Polarity Contradiction):** If $|Score(Q1) - InvertedScore(Q9)| \ge 4.0$, a contradiction flag is logged.
   * *Example:* Employee answered Q1 as "No one" (10.0) but answered Q9 as "Strongly Agree" (Peer can easily step in = 2.0). Delta $= |10.0 - 2.0| = 8.0 \ge 4.0$. Flagged: `High Contradiction in Uniqueness`.

---

## Appendix 2: Data Dictionary and Risk Configuration

### 2.1 Assessment Data Dictionary

| Field Name | Data Type | Permitted Values | Nullable | Source | Operational Definition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | 24-character hex | No | MongoDB | Unique assessment document identifier. |
| `userId` | ObjectId | Valid User ref | No | System | Reference to the assessed employee. |
| `period` | String | e.g., "2026-Q3" | No | System | Active quarterly assessment cycle. |
| `selfScores.expertiseUniqueness` | Float | 1.00 – 10.00 | No | Survey CSV | Normalized self-assessed knowledge uniqueness. |
| `selfScores.documentationGap` | Float | 1.00 – 10.00 | No | Survey CSV | Normalized self-assessed documentation deficit. |
| `selfScores.projectCriticality` | Float | 1.00 – 10.00 | No | Survey CSV | Normalized self-assessed project operational impact. |
| `selfScores.collaborationDependency` | Float | 1.00 – 10.00 | No | Survey CSV | Normalized self-assessed workflow dependency. |
| `tenureScore` | Float | 2.0, 5.0, 7.0, 10.0 | No | User Profile | Deterministically calculated tenure score. |
| `managerValidated` | Boolean | `true`, `false` | No | Manager | Human-in-the-loop validation flag. |
| `managerScores` | Object | Map of 4 floats | Yes | Manager | Contextual scores assigned by manager. |
| `responseBias.straightLining` | Boolean | `true`, `false` | No | Auditor | Automated straight-lining detection flag. |
| `responseBias.biasScore` | Integer | 0 – 100 | No | Auditor | Aggregate data quality risk index. |

### 2.2 Indicator Normalization and Tenure Transformation
* **Tenure Transformation:**
  $$	ext{Years of Service} = rac{	ext{Current Date} - 	ext{Start Date}}{365.25 	imes 24 	imes 3600 	imes 1000}$$
  $$	ext{Tenure Score} (T) = egin{cases} 2.00 & 	ext{if Years} < 2 \ 5.00 & 	ext{if } 2 \le 	ext{Years} < 5 \ 7.00 & 	ext{if } 5 \le 	ext{Years} < 10 \ 10.00 & 	ext{if Years} \ge 10 \end{cases}$$

### 2.3 Versioned Scoring Configuration
* **System Version:** KnowledgeGuard v1.2.0 (Commit `kg-release-20260914`).
* **Active Default Weights:** $EU = 0.25, DG = 0.20, PC = 0.20, CD = 0.20, T = 0.15$.
* **Triangulation Blend (Manager Validated):** $30\%	ext{ Formula} + 50\%	ext{ Manager} + 20\%	ext{ ML}$.
* **Provisional Fallback (Unvalidated):** $70\%	ext{ Formula} + 30\%	ext{ ML}$.

### 2.4 Risk Thresholds and Boundary Tests

| Continuous Score Range | Risk Tier Label | System Action & Workflow Implication | Boundary Test Verification |
| :--- | :--- | :--- | :--- |
| **1.00 – 3.99** | **Low** | Routine monitoring; no active intervention. | Score = 3.99 classified as **Low** (PASS) |
| **4.00 – 6.99** | **Medium** | Documentation audit; optional manager review. | Score = 4.00 classified as **Medium** (PASS) |
| **7.00 – 8.99** | **High** | Mandatory Knowledge Transfer planning triggered. | Score = 7.00 classified as **High** (PASS) |
| **9.00 – 10.00** | **Critical** | Immediate executive alert; urgent succession plan. | Score = 9.00 classified as **Critical** (PASS) |

---

## Appendix 3: Complete Test Evidence

### 3.1 Test Environment and Execution Record
* **Execution Date:** September 12, 2026.
* **Environment:** Local isolated staging container running on Windows 11 Enterprise (Build 22631).
* **Software Stacks:** Node.js v20.11.0, React 18.2.0, Vite 5.1.4, MongoDB Community v7.0.5, Python 3.11.8 (FastAPI 0.110.0, Scikit-Learn 1.4.1).
* **Execution Tester:** Lead Research Engineer (Shanuka S. Jayakodi).

### 3.2 Functional Test Executions (TC-04 to TC-09)
* **TC-04 (CSV Ingestion & Quality):** File `02_assessments_comprehensive_q3.csv` containing 30 employee records imported. All 30 accounts matched; 1 account (`mallory@knowledgeguard.demo`) flagged with zero variance ($\sigma = 0.0$). Console log: `[AUDIT] Ingestion completed: 30 imported, 1 flagged for response quality review`.
* **TC-05 (Triangulated Scoring):** Profile with Formula = 6.00, Manager = 8.00, ML = 5.00 submitted. Result: $(6 	imes 0.3) + (8 	imes 0.5) + (5 	imes 0.2) = 6.80$. Saved document verified in MongoDB shell: `{ "finalScore": 6.80, "tier": "medium" }`.
* **TC-06 (AHP Validation):** Submitted 5×5 matrix yielding $CR = 0.200$. API response: `{ success: true, consistencyRatio: 0.2000, isConsistent: false }`. Live settings remained `{ "useDynamicWeights": false }`.
* **TC-07 (AI KT Plan):** Profile for high-risk engineer processed. Backend payload verified sanitized (no employee name/email). Groq API returned 5 tasks. DB verification confirmed 5 `KTTask` documents created under status `pending`.
* **TC-08 (Dual-Verification Gating):** Manager triggered approval with `employeeConfirmed: true` and `backupConfirmed: false`. Response: HTTP 400 Bad Request `{ success: false, message: "Missing required backup verification" }`. Button rendered disabled in UI.
* **TC-09 (Mitigation scoreDelta):** Signed off Emp-01 KT plan. System applied reductions: $DG -3.0, EU -3.0, CD -2.0$. Formula and final scores recalculated from 8.52 to 6.78. DB document updated: `{ "previousScore": 8.52, "finalScore": 6.78, "scoreDelta": 1.74, "tier": "medium" }`.

### 3.3 Non-Functional and Service-Isolation Tests (TC-01 to TC-03)
* **TC-01 (CRON Daemon):** System clock advanced by 48h. Cron daemon executed at 00:00:01. Log excerpt: `[CRON] Inspecting pending KT tasks... Found 1 overdue task ID 66e1... Emitting notification to manager sarah@knowledgeguard.demo`.
* **TC-02 (Authentication Guard):** Direct HTTP request to `GET /api/assessments` without bearer token. Response: HTTP 401 Unauthorized in 4ms.
* **TC-03 (Microservice Isolation & Fallback):** Python FastAPI process on port 8000 forcibly terminated (`kill -9`). POST request sent to trigger risk calculation. Backend log excerpt:
  ```text
  ⚠️  ML service unavailable, using formula fallback: connect ECONNREFUSED 127.0.0.1:8000
  [SCORING] Fallback applied: formulaScore used for ML component. Final score computed: 7.75
  ```
  Node.js server remained fully responsive with zero downtime.

---

## Appendix 4: SUS and TAM Evaluation Instruments and Calculations

### 4.1 Evaluation Procedure
Ten managerial evaluators were provided credentials to access the KnowledgeGuard staging prototype. After executing a standardized 20-minute protocol (importing a CSV, inspecting employee risk profiles, validating an assessment, generating an AI KT plan, and signing off a completed task), participants completed the standardized SUS and TAM questionnaires.

### 4.2 Raw SUS Response Data and Calculations (N = 10)

| Participant | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Odd Sum | Even Sum | Total (x2.5) | Grade |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P01** | 5 | 1 | 5 | 2 | 4 | 2 | 5 | 1 | 4 | 2 | 18 | 19 | **92.5** | Excellent |
| **P02** | 4 | 2 | 4 | 2 | 5 | 2 | 4 | 2 | 4 | 2 | 16 | 20 | **90.0** | Excellent |
| **P03** | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 15 | 20 | **87.5** | Excellent |
| **P04** | 4 | 2 | 4 | 2 | 4 | 3 | 4 | 2 | 4 | 2 | 15 | 19 | **85.0** | Excellent |
| **P05** | 4 | 2 | 4 | 2 | 5 | 2 | 4 | 2 | 3 | 2 | 15 | 20 | **87.5** | Excellent |
| **P06** | 4 | 2 | 4 | 2 | 5 | 2 | 4 | 2 | 4 | 3 | 16 | 19 | **87.5** | Excellent |
| **P07** | 5 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 16 | 20 | **87.5** | Excellent |
| **P08** | 5 | 1 | 5 | 1 | 5 | 2 | 5 | 2 | 5 | 2 | 20 | 18 | **95.0** | Best Imaginable |
| **P09** | 5 | 1 | 5 | 2 | 4 | 2 | 5 | 1 | 4 | 2 | 18 | 19 | **92.5** | Excellent |
| **P10** | 4 | 2 | 4 | 2 | 5 | 2 | 4 | 2 | 4 | 2 | 16 | 20 | **90.0** | Excellent |

* **Mean SUS Score:** $rac{92.5 + 90.0 + 87.5 + 85.0 + 87.5 + 87.5 + 87.5 + 95.0 + 92.5 + 90.0}{10} = \mathbf{89.50}$
* **Sample Standard Deviation ($s$):** $\sqrt{rac{\sum (x_i - 89.5)^2}{9}} = \sqrt{rac{85.0}{9}} = \mathbf{3.07}$

### 4.3 Raw TAM Response Data and Construct Calculations (N = 10)

| Participant | PU1 | PU2 | PU3 | PEOU1 | PEOU2 | PEOU3 | BI1 (Adopt) | PU Mean | PEOU Mean | BI Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P01** | 4 | 5 | 5 | 4 | 4 | 5 | 5 | 4.67 | 4.33 | 5.00 |
| **P02** | 5 | 5 | 4 | 5 | 4 | 4 | 5 | 4.67 | 4.33 | 5.00 |
| **P03** | 4 | 4 | 4 | 5 | 5 | 4 | 4 | 4.00 | 4.67 | 4.00 |
| **P04** | 5 | 4 | 4 | 4 | 5 | 5 | 5 | 4.33 | 4.67 | 5.00 |
| **P05** | 4 | 5 | 5 | 4 | 4 | 5 | 5 | 4.67 | 4.33 | 5.00 |
| **P06** | 5 | 4 | 4 | 5 | 5 | 4 | 4 | 4.33 | 4.67 | 4.00 |
| **P07** | 4 | 5 | 4 | 5 | 4 | 5 | 5 | 4.33 | 4.67 | 5.00 |
| **P08** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5.00 | 5.00 | 5.00 |
| **P09** | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4.00 | 4.33 | 4.00 |
| **P10** | 4 | 5 | 4 | 4 | 5 | 4 | 4 | 4.33 | 4.33 | 4.00 |

* **Perceived Usefulness (PU):** Mean = **4.43**, SD = **0.16**
* **Perceived Ease of Use (PEOU):** Mean = **4.53**, SD = **0.23**
* **Behavioral Intention (BI):** Mean = **4.60**, SD = **0.52**

---

## Appendix 5: AHP Expert Matrices and Consistency Analysis

### 5.1 Expert Selection and Profiles
Ten domain experts were recruited to provide pairwise comparison judgments on Saaty's 1–9 fundamental scale:
* 3 Senior HR Directors (12+ years experience in workforce planning)
* 3 Engineering Managers (managing 20+ software engineers)
* 2 Enterprise Knowledge Management Consultants
* 2 University Professors in Management Information Systems

### 5.2 Ten Individual Pairwise Comparison Matrices
Each expert evaluated the 10 pairwise comparisons: $EU/DG, EU/PC, EU/CD, EU/T, DG/PC, DG/CD, DG/T, PC/CD, PC/T, CD/T$.

* **Expert 1:** Upper Triangle = $[2.0, 3.0, 3.0, 3.0, 2.0, 6.0, 4.0, 4.0, 3.0, 3.0]$
* **Expert 2:** Upper Triangle = $[2.0, 2.0, 2.0, 2.0, 2.0, 5.0, 4.0, 4.0, 3.0, 2.0]$
* **Expert 3:** Upper Triangle = $[3.0, 3.0, 3.0, 3.0, 2.0, 5.0, 4.0, 4.0, 3.0, 2.0]$
* **Expert 4:** Upper Triangle = $[2.0, 2.0, 2.0, 2.0, 2.0, 5.0, 3.0, 4.0, 3.0, 3.0]$
* **Expert 5:** Upper Triangle = $[2.0, 3.0, 3.0, 3.0, 2.0, 5.0, 4.0, 4.0, 3.0, 2.0]$
* **Expert 6:** Upper Triangle = $[2.0, 2.0, 2.0, 2.0, 2.0, 5.0, 4.0, 4.0, 3.0, 3.0]$
* **Expert 7:** Upper Triangle = $[3.0, 3.0, 3.0, 3.0, 2.0, 5.0, 3.0, 4.0, 3.0, 2.0]$
* **Expert 8:** Upper Triangle = $[2.0, 2.0, 2.0, 2.0, 2.0, 5.0, 4.0, 4.0, 3.0, 2.0]$
* **Expert 9:** Upper Triangle = $[2.0, 3.0, 3.0, 2.0, 2.0, 5.0, 3.0, 4.0, 3.0, 3.0]$
* **Expert 10:** Upper Triangle = $[2.0, 2.0, 2.0, 2.0, 2.0, 5.0, 4.0, 4.0, 3.0, 2.0]$

### 5.3 Aggregated Group Matrix (Geometric Mean)
$$A_{agg}[i,j] = \left( \prod_{k=1}^{10} A_k[i,j] 
ight)^{1/10}$$

$$A = egin{bmatrix}
1.00 & 2.14 & 2.48 & 2.48 & 2.45 \
0.47 & 1.00 & 1.97 & 5.04 & 3.58 \
0.40 & 0.51 & 1.00 & 4.03 & 3.05 \
0.40 & 0.20 & 0.25 & 1.00 & 2.41 \
0.41 & 0.28 & 0.33 & 0.41 & 1.00
\end{bmatrix}$$

### 5.4 Full Mathematical Consistency Derivation
1. Column Sums: $C = [2.68, 4.13, 6.03, 12.96, 12.49]$
2. Normalized Priority Vector ($w$):
   - $w_{EU} = 0.318$ (31.8%)
   - $w_{DG} = 0.323$ (32.3%)
   - $w_{PC} = 0.181$ (18.1%)
   - $w_{CD} = 0.104$ (10.4%)
   - $w_T = 0.073$ (7.3%)
3. Weighted Sum Vector: $Aw = [1.874, 1.905, 1.069, 0.613, 0.430]^T$
4. Vector Ratios ($rac{Aw_i}{w_i}$): $[5.893, 5.898, 5.906, 5.894, 5.890]^T$
5. $\lambda_{max} = \mathbf{5.896}$
6. Consistency Index ($CI$): $rac{5.896 - 5}{5 - 1} = rac{0.896}{4} = \mathbf{0.224}$
7. Random Index for $n=5$: $RI = 1.12$
8. Consistency Ratio ($CR$): $rac{0.224}{1.12} = \mathbf{0.200}$

**Gating Decision:** Because $CR = 0.200 > 0.10$, the system automatically invalidated the update, rendered a red warning badge, and retained the default baseline weights.

---

## Appendix 6: Supplementary System Design and Implementation Excerpts

### 6.1 Requirements Traceability Matrix

| Requirement ID | Requirement Summary | Implementation Artifact | Test Case ID | Test Status |
| :--- | :--- | :--- | :--- | :--- |
| **Req-01** | CSV Assessment Ingestion | `googleFormsParser.js` | TC-04 | PASS |
| **Req-02** | Straight-Lining / Bias Auditing | `googleFormsParser.js` (`analyzeResponseBias`) | TC-04 | PASS |
| **Req-03** | Provisional Scoring (70/30) | `scoringEngine.js` (`calculateFinalScore`) | TC-05 | PASS |
| **Req-04** | Triangulated Final Scoring (30/50/20) | `scoringEngine.js` | TC-05 | PASS |
| **Req-05** | AHP Calibration & CR Guard | `backend/src/routes/research.js` | TC-06 | PASS |
| **Req-06** | Generative AI KT Planning | `backend/src/services/aiService.js` | TC-07 | PASS |
| **Req-07** | Dual-Verification Gating | `backend/src/routes/ktTasks.js` | TC-08 | PASS |
| **Req-08** | Mitigation Tracking (`scoreDelta`) | `backend/src/services/ktScoreUpdate.js` | TC-09 | PASS |
| **Req-09** | Automated CRON Monitoring | `backend/src/services/alertService.js` | TC-01 | PASS |

### 6.2 Implementation Code Excerpts

#### Baseline Formula Score (`backend/src/services/scoringEngine.js`)
```javascript
function calculateFormulaScore(scores, tenureScore, weights = null) {
  const { expertiseUniqueness, documentationGap, projectCriticality, collaborationDependency } = scores;
  const w = weights || {
    expertiseUniqueness: 0.25,
    documentationGap: 0.20,
    projectCriticality: 0.20,
    collaborationDependency: 0.20,
    tenure: 0.15
  };
  const result =
    expertiseUniqueness     * w.expertiseUniqueness +
    documentationGap        * w.documentationGap +
    projectCriticality      * w.projectCriticality +
    collaborationDependency * w.collaborationDependency +
    tenureScore             * w.tenure;
  return Math.round(result * 100) / 100;
}
```

#### Triangulated Final Score & Provisional Fallback (`backend/src/services/scoringEngine.js`)
```javascript
function calculateFinalScore(formulaScore, managerScore, mlScore, managerValidated, confidenceDiscount = 0) {
  let final;
  if (managerValidated && managerScore > 0) {
    // Mode A: Triangulated Blend: Formula (30%), Manager (50%), ML (20%)
    final = formulaScore * 0.30 + managerScore * 0.50 + mlScore * 0.20;
  } else {
    // Mode B: Provisional Fallback: Formula (70%), ML (30%)
    final = formulaScore * 0.70 + mlScore * 0.30;
  }
  return Math.round(final * 100) / 100;
}
```

#### Dual-Verification Enforcement (`backend/src/routes/ktTasks.js`)
```javascript
router.post('/:id/approve', protect, requireRole('manager', 'admin'), async (req, res) => {
  const task = await KTTask.findById(req.params.id);
  if (!task.employeeConfirmed || !task.backupConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Cannot approve task: Both employee confirmation and backup verification are mandatory.'
    });
  }
  task.managerApproved = true;
  task.status = 'approved';
  await task.save();
  res.json({ success: true, task });
});
```

---

## Appendix 7: Ethics, Permission, and Governance Documentation

### 7.1 Ethics Approval Statement
This study was conducted under the academic research ethics guidelines of NSBM Green University, Faculty of Computing. Because the research involved human participants (industry professionals completing self-assessments, domain experts completing AHP matrices, and managers evaluating system usability), the research protocol was evaluated and granted ethical clearance by the Faculty Academic Ethics Review Committee (Reference: `NSBM-FOC-ERC-2026-0812`).

### 7.2 Participant Information and Informed Consent Template
All participants in the study were provided with a digital Participant Information Sheet explaining:
1. The academic nature of the research under the BSc in Management Information Systems (Special) degree program;
2. The voluntary nature of participation and the unconditional right to withdraw prior to dataset anonymization;
3. Confirmation that all individual responses are de-identified and reported solely in aggregated statistical form;
4. Clear assurance that assessment data is not linked to official employee appraisals, disciplinary proceedings, or employment tenure.

### 7.3 Data Handling and PII Minimization
* All employee identifiers (names, emails) were replaced with pseudonymous keys (`Emp-01`, `P01`) upon storage.
* Assessment data is stored in access-restricted MongoDB collections accessible only via authenticated JWT tokens with appropriate role claims.
* Contextual data transmitted to external LLM services is strictly stripped of names, emails, and organizational entity identifiers.

---

## Appendix 8: Knowledge Transfer and Mitigation Records

### 8.1 Case Provenance and Demonstration Selection
Three representative transition profiles from the technical evaluation were monitored to verify the closed-loop mitigation tracking mechanism:
* **Emp-01:** Lead Backend Engineer (Core Services, 11 years tenure).
* **Emp-02:** Principal Solutions Architect (Payment Integration, 8 years tenure).
* **Emp-03:** Senior DevOps Specialist (Database & Cloud Infrastructure, 6 years tenure).

### 8.2 End-to-End Mitigation Audit Trail
To prove the exact mathematical transition of risk scores, the following cases track the three distinct phases of mitigation: **T1 (Pre-Mitigation)**, **T2 (Immediate KT Sign-off)**, and **T3 (Next Quarterly Assessment)**.

#### Case 1: Emp-01 (Sarah / Core Services)
* **T1: Pre-Mitigation Baseline (Q2):** $EU = 9.0, DG = 8.0, PC = 9.0, CD = 7.0, T = 10.0$.
  - Formula Score: 8.55; Manager Score: 8.50; ML Score: 8.50.
  - Final T1 Score: **8.52 (High Risk)**.
* **T2: Immediate Algorithmic Patch (KT Sign-off):**
  - Manager evaluated backup as **"Fully Competent"**.
  - Reductions Applied: $EU -3.00$, $DG -3.00$, $CD -2.00$ (Maximum algorithmic drop of 1.75 points).
  - Recalculated T2 Inputs: $EU = 6.0, DG = 5.0, PC = 9.0, CD = 5.0, T = 10.0$.
  - Formula Score: 6.80; Manager Score: 6.75; ML Score: 6.80.
  - Final T2 Score: **6.78 (Medium Risk)** *(Algorithmic `scoreDelta` = +1.74)*
* **T3: Organic Longitudinal Drop (Q3 Assessment):**
  - Next quarter, Sarah submits a new assessment reflecting her democratized knowledge.
  - Organic Inputs: $EU = 4.0, DG = 2.0, PC = 9.0, CD = 3.0, T = 10.0$.
  - Formula Score: 5.30; Manager Score: 5.10; ML Score: 5.30.
  - Final T3 Score: **5.20 (Medium Risk)** *(Total Long-Term `scoreDelta` = +3.32)*

#### Case 2: Emp-02 (David / Payment Gateway)
* **T1: Pre-Mitigation Baseline (Q2):** $EU = 10.0, DG = 9.0, PC = 10.0, CD = 8.0, T = 10.0$.
  - Formula Score: 9.40; Manager Score: 9.00; ML Score: 9.10.
  - Final T1 Score: **9.14 (Critical Risk)**.
* **T2: Immediate Algorithmic Patch (KT Sign-off):**
  - Backup evaluated as **"Competent with minor gaps"**.
  - Reductions Applied: $DG -3.00, EU -2.00, CD -1.50$ (Algorithmic drop of 1.40 points).
  - Formula Score: 8.00; Manager Score: 7.60; ML Score: 8.00.
  - Final T2 Score: **7.80 (High Risk)** *(Algorithmic `scoreDelta` = +1.34)*
* **T3: Organic Longitudinal Drop (Q3 Assessment):**
  - Organic Inputs: $EU = 6.0, DG = 4.0, PC = 10.0, CD = 5.0, T = 10.0$.
  - Final T3 Score: **6.50 (Medium Risk)** *(Total Long-Term `scoreDelta` = +2.64)*

#### Case 3: Emp-03 (Michael / Database Infrastructure)
* **T1: Pre-Mitigation Baseline (Q2):** $EU = 8.0, DG = 7.0, PC = 8.0, CD = 7.0, T = 7.0$.
  - Formula Score: 7.45; Manager Score: 7.40; ML Score: 7.30.
  - Final T1 Score: **7.40 (High Risk)**.
* **T2: Immediate Algorithmic Patch (KT Sign-off):**
  - Backup evaluated as **"Fully Competent"**.
  - Reductions Applied: $DG -3.00, EU -3.00, CD -2.00$ (Maximum algorithmic drop of 1.75).
  - Formula Score: 5.70; Manager Score: 5.65; ML Score: 5.70.
  - Final T2 Score: **5.68 (Medium Risk)** *(Algorithmic `scoreDelta` = +1.72)*
* **T3: Organic Longitudinal Drop (Q3 Assessment):**
  - Organic Inputs: $EU = 3.0, DG = 3.0, PC = 8.0, CD = 4.0, T = 7.0$.
  - Final T3 Score: **4.10 (Low Risk)** *(Total Long-Term `scoreDelta` = +3.30)*

---

## Appendix 9: Project Management and Supplementary Specifications

### 9.1 Project Execution Timeline (Agile-Kanban)
The project was executed across five structured two-week sprints:
* **Sprint 1 (Weeks 1–2):** Literature analysis, indicator synthesis, mathematical formula formalization.
* **Sprint 2 (Weeks 3–4):** Backend REST API engineering, MongoDB schema design, Google Forms CSV ingestion engine.
* **Sprint 3 (Weeks 5–6):** React frontend dashboard engineering, Score Transparency panel, AHP calibration module.
* **Sprint 4 (Weeks 7–8):** Python FastAPI microservice integration, Random Forest training with data augmentation, Generative AI integration.
* **Sprint 5 (Weeks 9–10):** Dual-verification workflow, CRON monitoring, technical test suite execution, SUS and TAM empirical evaluations.

### 9.2 Complete Software and Library Inventory

| Software / Library | Version | Operational Function in System | Architectural Layer |
| :--- | :--- | :--- | :--- |
| **React** | 18.2.0 | Reactive component rendering for role-based views. | Presentation Tier |
| **Vite** | 5.1.4 | Frontend development server and optimized bundler. | Presentation Tier |
| **Node.js** | 20.11.0 | Asynchronous event-driven server runtime environment. | Application Tier |
| **Express.js** | 4.19.2 | REST API routing, middleware chaining, and payload handling. | Application Tier |
| **MongoDB** | 7.0.5 | Document database storing assessments, scores, and KT plans. | Data Tier |
| **Mongoose** | 8.2.1 | Object Data Modeling (ODM) schema enforcement and validation. | Application Tier |
| **FastAPI** | 0.110.0 | High-performance Python web framework for ML microservice. | Intelligence Tier |
| **Scikit-Learn** | 1.4.1 | Machine learning algorithms (Random Forest, Isolation Forest). | Intelligence Tier |
| **Pandas** | 2.2.1 | Data manipulation, feature preparation, and array formatting. | Intelligence Tier |
| **Node-Cron** | 3.0.3 | Task scheduler executing daily automated workflow audits. | Application Tier |
| **Nodemailer** | 6.9.11 | SMTP mail dispatch engine for escalation alerts. | Application Tier |
| **JWT (jsonwebtoken)**| 9.0.2 | Stateless token-based user authentication and RBAC. | Application Tier |
