3 LITERATURE REVIEW

3.1 Chapter overview

This chapter reviews the literature and concepts that inform KnowledgeGuard, a decision-support prototype for identifying employee-level knowledge-loss risk and supporting knowledge-transfer planning. The review begins with organizational knowledge, tacit knowledge, and the risks created when important knowledge is concentrated in individual employees. It then examines the limitations of existing knowledge-management approaches, particularly document repositories, self-reported assessments, and approaches that identify risk without supporting follow-up transfer activities.

The chapter next explains the design basis for KnowledgeGuard: the five risk indicators, transparent weighted scoring, Analytic Hierarchy Process (AHP), response-quality checks, supporting machine learning, generative AI assistance, and knowledge-transfer activities. Finally, it synthesizes the literature to define the research gap addressed by the prototype.

3.2 Domain concepts and theories

The reviewed literature follows a progression from the broad problem of organizational knowledge to the specific decision-support workflow implemented in KnowledgeGuard. Organizational knowledge establishes the domain; tacit knowledge explains why documentation alone may be insufficient; employee transitions create potential exposure; and the identified limitations justify an integrated assessment-to-transfer workflow.

[INSERT FIGURE 3.1: Black-and-white conceptual flow diagram. Arrange eight rectangular boxes vertically with downward arrows: (1) Organizational knowledge; (2) Explicit and tacit knowledge; (3) Employee transitions and knowledge-loss exposure; (4) Limitations of repositories, self-assessments and isolated transfer processes; (5) KnowledgeGuard design choices: indicators, transparent scoring, AHP, response checks, ML and AI assistance; (6) Manager-reviewed knowledge-transfer workflow; (7) Functional testing, SUS and TAM; (8) Prototype-level contribution and evidence limits. Use short labels, no decorative icons, no colour, and keep all text within page boundaries.]

Figure 3.1: Conceptual map of the literature informing KnowledgeGuard.

3.2.1 Organizational knowledge, tacit knowledge and knowledge-loss risk

Organizational knowledge includes documented information, work routines, practical experience, technical skills, judgement, and contextual understanding used to perform work. Knowledge management concerns the creation, capture, sharing, retention, and application of this knowledge.

A central distinction is between explicit and tacit knowledge. Explicit knowledge can be documented and communicated through manuals, procedures, reports, system records, and policies. Tacit knowledge is more closely connected to personal experience, judgement, practical skill, and context [1]. An organization may retain documents after an employee leaves but still lose the ability to solve unusual problems, understand historical decisions, or perform work efficiently.

Employee transitions such as resignation, retirement, internal transfer, promotion, restructuring, or extended absence can create knowledge-loss exposure. The risk may be greater when specialized expertise is concentrated in one person, documentation is incomplete, critical work depends on that person, or colleagues frequently rely on them for support [3], [4], [7]. KnowledgeGuard treats knowledge loss as a proactive assessment and decision-support problem. It does not predict whether an employee will resign; it identifies cases where an absence could create difficulty and where transfer preparation may be appropriate.

A high risk score is not evidence that knowledge has already been lost. It is an indication that the case should be reviewed. Similarly, a completed transfer plan records workflow completion but does not independently prove that a backup employee will retain and apply the knowledge over time.

3.3 Existing studies, systems or frameworks

3.3.1 Repositories versus proactive decision support

Knowledge repositories and collaboration systems, such as SharePoint and Confluence, are valuable for storing documents, sharing information, and maintaining recorded knowledge [12], [13]. ServiceNow Knowledge Management also supports controlled publication and approval of knowledge articles [14]. However, repositories primarily manage knowledge that has already been captured. They do not inherently identify which employee has difficult-to-replace knowledge, determine the operational consequences of that employee's absence, or initiate a knowledge-transfer workflow from a risk assessment.

This does not mean that repository systems are ineffective. They can support KnowledgeGuard by storing documentation created during transfer activities. The limitation is that document storage alone does not provide proactive employee-level risk assessment or confirm that a backup employee can perform the relevant work.

3.3.2 Limitations of self-reported assessment data

Structured assessments, spreadsheets, and survey platforms can collect useful employee-level information. However, self-reported answers may contain response-quality issues, such as limited variation, inconsistent interpretation, or potentially self-enhancing answers. Ward and Meade recommend prevention, screening, and transparent reporting when handling potentially careless survey responses [17].

A straight-lined or contradictory response does not prove dishonesty. It may reflect rushed completion, misunderstanding, unusual work circumstances, or limited differentiation between questions. KnowledgeGuard therefore displays response-quality flags for manager review rather than labelling an employee as dishonest. The prototype uses local rule-based checks for potentially rushed, contradictory, or self-enhancing answer patterns; these checks are not a validated lie-detection method.

3.3.3 The gap between risk identification and mitigation

A risk score alone does not transfer knowledge. Once a potentially high-risk case is identified, a manager must still determine what knowledge requires transfer, who is a suitable backup employee, which activities should be completed, and whether the backup has practised the work.

Research on knowledge transfer supports documentation, observation, interaction, practice, and recipient involvement rather than relying only on static documents [2], [18], [19]. KnowledgeGuard therefore links assessment to a manager-reviewed knowledge-transfer workflow: assessment, risk information, manager review, KT planning, documentation, shadowing, interview, practice, sign-off, and later reassessment.

3.3.4 Comparison with related systems and frameworks

Table 3.1 compares selected systems and frameworks with the specific problem addressed by KnowledgeGuard. This is not a hands-on product benchmark. It compares documented or implemented functions only.

Table 3.1: Related systems and frameworks compared with KnowledgeGuard

Example

Main documented focus

Relationship to KnowledgeGuard

SharePoint

Collaborative file storage and versioning

May store KT documents; no employee risk-assessment workflow evaluated

Confluence

Shared pages, attachments, and team knowledge

May store KT notes and process knowledge; no product test conducted

ServiceNow Knowledge Management

Knowledge-article governance and approval

Related approval capability; different assessed object

APQC Knowledge Loss Risk Matrix

Prioritizing knowledge areas exposed to loss

Comparable prioritization concept; detailed matrix not publicly available

SAP SuccessFactors

Successor identification and readiness

Related continuity and backup planning; product not tested

KnowledgeGuard

Employee-level assessment, manager review, KT tasks, backup practice, and sign-off

Integrated prototype workflow; organizational impact remains unvalidated

The reviewed systems may be configured or combined differently by organizations. KnowledgeGuard does not claim that no other system can provide similar functionality. Its contribution is the implementation and limited evaluation of one focused assessment-to-transfer workflow.

3.4 Technical approaches

3.4.1 Operationalization of knowledge-loss indicators

KnowledgeGuard uses five indicators to represent different dimensions of employee-level knowledge-loss exposure: expertise uniqueness, documentation gap, project criticality, collaboration dependency, and tenure. The first four indicators are derived from structured assessment responses, while tenure is calculated using the employee's recorded start date. The literature supports examining these dimensions, but it does not establish this exact five-indicator model or its fixed percentages as universally valid [1], [2], [9], [10], [11]. Tenure is given lower importance because long service provides context but does not prove irreplaceable or critical knowledge.

Table 3.2 makes the selection logic explicit. The indicators were chosen through synthesis of related evidence rather than adoption of a single validated five-factor instrument. Each indicator represents a different question that a manager may need to consider when deciding whether transfer preparation is warranted. Keeping the indicators separate also helps the system explain why a case requires review and which parts of the exposure a transfer activity can plausibly address.

Table 3.2: Literature basis for the KnowledgeGuard indicators

Indicator

Research rationale

Design implication in KnowledgeGuard

Expertise uniqueness

Knowledge concentrated in one person can be difficult to replace [9], [10]

Assess whether alternative holders can perform comparable work

Documentation gap

Tacit or inaccessible knowledge is difficult for another employee to use [1], [2]

Assess whether essential procedures and context are available in usable form

Project criticality

The consequence of loss depends on the work and services affected [4], [11]

Assess the potential disruption associated with important work

Collaboration dependency

Knowledge transfer and work continuity depend on relationships and reliance on people [2], [3]

Assess how strongly colleagues depend on the holder for support or decisions

Tenure

Length of service may provide context about accumulated experience but does not prove unique expertise [8]

Calculate contextual service-length information with a lower initial weight

The table does not claim that the five factors are exhaustive or universally sufficient. For example, an organization may later need to consider regulatory exposure, customer relationships, role scarcity, succession readiness, or transition likelihood. Those contextual matters can inform manager review and future organization-specific calibration, but they were not added to the baseline formula because the prototype required a small, explainable, consistently available set of inputs.

There is also an important distinction between selection of an indicator and validation of its numerical measurement. Literature can justify considering documentation gap or collaboration dependency, but it cannot automatically validate the exact questionnaire wording, score mapping, thresholds, or relative weight used in this prototype. Chapter 4 therefore describes these operational choices explicitly, while Chapter 5 reports only the evidence available for their implementation and evaluation.

3.4.2 Transparent weighted scoring and AHP

A transparent weighted score was selected because managers should be able to understand why a case receives a particular risk tier. KnowledgeGuard begins with researcher-defined baseline weights and combines the resulting formula score with manager validation and a supporting ML score. The baseline weights are design assumptions rather than universal facts; their exact allocation and the full scoring formula are specified in Chapter 4. Manager assessment has the greatest influence in the validated result because contextual work information may not be fully represented in survey responses.

AHP provides a structured method for deriving possible indicator weights through expert pairwise comparisons and a consistency ratio (CR) to test whether the comparisons are logically coherent [20]. In KnowledgeGuard, AHP considers future calibration of baseline weights; it is not recalculated for every employee assessment. If CR is 0.10 or greater, the proposed weights are rejected and the existing configured weights remain unchanged. A consistent matrix would show coherent expert comparisons, not proof that the weights predict real organizational outcomes.

3.4.3 Supporting machine learning and anomaly review

KnowledgeGuard uses a Random Forest classifier as a supporting machine-learning component. Random Forest combines multiple decision trees to classify structured data [21]. The ML service receives the five indicator values and returns a supporting risk tier and score; it cannot make an autonomous employment decision.

The default model uses synthetic profiles whose risk-tier labels are derived from the baseline formula. Its metrics therefore demonstrate reproduction of configured scoring patterns, not independent prediction of employee departure, service disruption, or knowledge loss. The system can be retrained using real manager-validated records when sufficient data are available, but independent organizational outcome labels would still be necessary to establish predictive validity.

Isolation Forest identifies observations that are relatively unusual within a dataset [22]. In KnowledgeGuard, it flags unusual patterns in an employee's risk-score history when sufficient history exists. An alert prompts review; it does not establish the cause of the change or show that an employee gave false answers.

3.4.4 Generative AI and knowledge-transfer planning

KnowledgeGuard uses an external generative-AI service to provide plain-language risk explanations, suggest knowledge-transfer interview questions, generate improvement suggestions, and support manager queries about team risk. These functions are assistance, not automatic decisions. Generated output must be reviewed because it may be incomplete, inaccurate, or contextually unsuitable [23].

The knowledge-transfer workflow supports documentation, shadowing, a structured interview, backup practice and competence assessment, then final manager sign-off. Knowledge tags help rank potential backup candidates with shared knowledge; this is a recommendation aid, not proof of suitability. The backend also prevents selection of a backup already classified as high or critical risk. Completed work may update only indicators that the activities can plausibly mitigate; a later separately imported assessment is needed to review calculated risk.

3.4.5 Design-science evaluation, SUS and TAM

Design Science Research supports development and evaluation of an information-system artefact intended to address a practical problem [5]. Functional testing evaluates whether KnowledgeGuard performs required actions, such as importing assessments, calculating scores, showing review flags, rejecting inconsistent AHP weights, restricting unsuitable backups, and recording KT progress.

The System Usability Scale (SUS) measures perceived usability [24]. The Technology Acceptance Model (TAM) examines perceived usefulness, perceived ease of use, and behavioural intention [25]. Together, functional tests, SUS, and TAM provide prototype-level evidence; they do not establish organization-wide acceptance, real-world predictive accuracy, or lasting knowledge retention.

3.5 Research gap and implications for this work

The literature shows that organizations may lose valuable knowledge when tacit or specialized expertise is concentrated in individual employees [1], [3], [9]. It also shows that documentation alone may be insufficient, because recipients may need observation, discussion, and practice before they can perform work independently [2], [18], [19].

Existing repositories, assessment tools, and succession approaches address useful parts of the broader problem. However, the reviewed work does not by itself demonstrate an evaluated workflow that connects employee-level assessment, transparent indicator-based scoring, response-quality review, manager validation, supporting ML analysis, AI-assisted planning, backup participation, competence assessment, sign-off, and later reassessment.

The research gap is therefore an integration and evaluation opportunity, not a claim that no similar technology exists. KnowledgeGuard addresses it by implementing these components in one web-based, manager-reviewed decision-support prototype. Its contribution is not a new ML algorithm, universal indicator weights, or proof of organizational knowledge retention. It is the design, implementation, and limited evaluation of an integrated workflow.

3.6 Chapter summary

This chapter reviewed the concepts and literature informing KnowledgeGuard. It explained why employee transitions can create knowledge-loss exposure, why repositories and risk scores alone are insufficient, and why a manager-reviewed transfer workflow is required.

The chapter justified the selected indicators, transparent scoring, AHP, response-quality review, Random Forest, Isolation Forest, generative-AI assistance, and KT stages. It also clarified that response flags do not detect lies, ML provides support rather than autonomous decisions, and workflow completion does not prove long-term knowledge retention. Chapter 4 explains how the system was designed, implemented, and evaluated.
