ABSTRACT

Employee transitions can disrupt important work when specialized knowledge is concentrated in one person and suitable documentation or backup staff are unavailable. This study developed KnowledgeGuard, a web-based decision support prototype for assessing knowledge-loss risk and coordinating knowledge transfer. Following a design science approach, the system assesses expertise uniqueness, documentation gap, project criticality, collaboration dependency, and tenure. It combines an indicator-based score with manager assessment and a supporting machine-learning score. Managers can initiate a structured knowledge-transfer plan for cases classified as high or critical risk.

The prototype was demonstrated using 30 anonymised standalone assessment responses collected from colleagues employed in industry, together with a separate generated Q1-Q4 dataset for quarterly workflow testing. Ten collected expert-comparison responses were used to examine the proposed indicator weights. Their aggregated comparisons produced a consistency ratio of 0.2000, above the specified 0.10 threshold; the proposed replacement weights were not accepted. Ten collected system-evaluation responses yielded a mean System Usability Scale score of 89.50 (SD = 3.07). Mean ratings for perceived usefulness, perceived ease of use, and behavioural intention were 4.43, 4.53, and 4.60, respectively. These results indicate positive perceived usability and acceptance among the evaluators.

KnowledgeGuard demonstrates how risk assessment can be linked to managed knowledge-transfer activities. The generated assessments are not observations from a real organization, and the evaluation does not establish predictive accuracy or lasting knowledge retention. Organizational assessments over time are needed to evaluate those outcomes.

1 INTRODUCTION

1.1 Chapter overview

This chapter introduces the problem of knowledge loss during employee transitions and explains why an assessment linked to knowledge-transfer action is needed. It presents the problem, research gap, questions, significance, scope, and proposed solution.

1.2 Background

Organizations depend on knowledge held in documents, systems, work routines, and employees’ experience. Some knowledge can be recorded as instructions. Other knowledge develops through practice and judgement and may be difficult to express fully in a document. The distinction between explicit and tacit knowledge helps explain why access to documentation does not always enable another employee to perform a specialist’s work [1].

Resignation, retirement, role change, or extended absence can create a continuity risk. Its importance depends on the knowledge involved, the available documentation, the work supported by the employee, and whether another person can take over the relevant tasks. Organizational knowledge transfer requires knowledge to become usable by other people, beyond merely storing information [2].

A systematic review of 74 studies distinguished knowledge-loss drivers, effects, and mitigation, finding that much published work addresses losses already under way [3]. Recent case studies also link disruption to weak sharing of personal knowledge and show that job shadowing can form part of retention practice [4]. These findings justify looking for exposed work before a transition and specifying who will receive and practise the knowledge; they do not establish the prevalence of this problem in the demonstration dataset.

KnowledgeGuard is a decision support prototype designed to identify cases requiring attention, present assessment information for manager review, and coordinate action involving a knowledge holder and a backup employee. Its risk score summarizes defined indicators. It does not directly measure the probability of departure or actual future knowledge loss.

1.3 Problem statement

Organizations may struggle to identify which employee transitions require urgent knowledge-transfer preparation. Relevant information can be spread across employees, managers, documents, and operational processes. A manager may know that an employee is important yet lack a consistent way to assess why the employee’s absence would cause difficulty or whether a backup is ready.

Specialized expertise may be concentrated in one person while instructions remain incomplete. Project importance, dependency, and replaceability can vary independently. An assessment must therefore consider more than tenure or departure status. Automated scoring can apply the same rules across cases, but a manager may know circumstances absent from recorded responses. Identifying a risk is also only the start: a response requires transfer activities and an assessment of backup competence.

Research on knowledge loss identifies workforce transitions, limited knowledge sharing, and inadequate retention practices as sources of organizational exposure [3], [4]. These findings support the need for a structured assessment linked to transfer preparation.

The central problem is how a decision support system can help identify employee-level knowledge-loss risk and support structured knowledge-transfer decisions during organizational transitions.

1.4 Research gap

Existing research explains knowledge-loss risks and identifies retention practices, including documentation, knowledge sharing, and job shadowing [3], [4], [6]. However, these findings do not by themselves demonstrate how an employee-level assessment can be connected to manager review, assigned transfer activities, and documented backup competence within one evaluated application. This study investigates that integration through the KnowledgeGuard prototype.

The study addresses this design and integration opportunity. It does not claim to invent a theory of knowledge transfer or establish that no existing product has similar functions. Its contribution is the design, implementation, and limited evaluation of KnowledgeGuard as a particular response to the defined problem.

In design science, a working artefact and its evaluation need to be described clearly [5]. Here the artefact is the implemented assessment-to-transfer workflow; the design insight concerns how to link explainable indicators, review, and assigned transfer tasks under explicit evidence limits.

The gap is practical and evaluative as well as technical. Research identifies useful transfer mechanisms but shows that sector and work context shape retention [6]; a generic score therefore needs local testing. This project tests whether the activities can be joined into a traceable prototype, while leaving outcome validation for a future organizational study.

1.5 Research questions

The main research question is: How can a decision support system help identify employee-level knowledge-loss risk and support structured knowledge-transfer decisions during organizational transitions?

RQ1. How can literature-informed indicators of employee-level knowledge-loss risk be operationalized in a structured prototype assessment?

RQ2. How can indicator-based assessment, manager judgement, and supporting machine-learning analysis be integrated into a decision support workflow?

RQ3. How can the system support the planning, completion, and review of knowledge-transfer activities after a high-risk case is identified?

RQ4. How usable and acceptable is the prototype to its evaluators, and which aspects of its intended workflow can be demonstrated through testing?

1.6 Research motivation and significance

The practical motivation is to help managers identify important knowledge dependencies before a transition disrupts work. A structured assessment can make the reasons for prioritization visible; a linked transfer plan can direct attention to documentation, observation, discussion, and practice. The system remains a support for human judgement rather than an autonomous employment decision.

The research significance lies in examining whether established methods can be connected into one auditable workflow. Design science research supports building and evaluating an information-system artefact in response to a practical problem [5]. The value demonstrated in this study concerns the prototype and its evaluated functions; it is not evidence of long-term organizational impact.

1.7 Scope

KnowledgeGuard assesses employee-level knowledge-loss risk using five indicators: expertise uniqueness, documentation gap, project criticality, collaboration dependency, and tenure. These dimensions define the study boundary; their theoretical basis and measurement are explained in Chapters 3 and 4. The prototype combines an indicator-based score, manager judgement, and a supporting machine-learning score. It supports knowledge-transfer planning for employees classified as high or critical risk, including assigned activities, knowledge-holder and backup confirmations, managerial approval, and review through a later separately imported assessment.

The study covers prototype development and evaluation using 30 anonymised standalone assessment responses from colleagues employed in industry, a separate generated Q1-Q4 dataset for workflow testing, 10 expert pairwise-comparison responses, and 10 system-evaluation responses. The prototype was deployed online to provide evaluator access.

The colleague responses do not constitute a representative organizational sample, and the generated Q1-Q4 dataset does not represent observations of real employees over four quarters. Online deployment provided access for evaluation but did not constitute a partner-organization field study. The evaluation therefore addresses prototype functionality, usability, and perceived acceptance; it does not establish independent real-world predictive accuracy, lasting knowledge retention, or an actual reduction in organizational knowledge loss. Risk classifications support managerial review and knowledge-transfer prioritization. Further organizational evaluation would be required to assess sustained transfer outcomes.

Table 1.1: Scope and evidence boundaries

Included in this study

Outside the demonstrated evidence

Prototype assessment and manager-reviewed KT workflow

Deployment or observed outcomes in a partner organization

Standalone colleague responses and a separate generated Q1-Q4 test dataset

A real four-quarter cohort or observed retention over time

Collected expert comparisons and usability responses

Validated indicator weights or population-wide acceptance

Scoring and functional demonstration

Independent prediction of departures or knowledge loss

1.8 Overview of the proposed solution

The workflow begins with structured assessment responses, which are processed into indicator scores and risk information for managerial review. A case needing attention may lead to a plan involving the knowledge holder, backup, and manager. The plan organizes documentation, shadowing, a structured interview, backup competence assessment, and final sign-off. Later assessments can support review of changes in calculated risk. Figure 1.1 summarizes the assessment, managerial review, knowledge-transfer, and reassessment workflow.

[INSERT FIGURE 1.1: Rich picture showing assessment source; HR user, manager, knowledge holder, backup; risk review; knowledge-transfer tasks; and monitoring. Insert the final figure above the caption.]

Figure 1.1: Overview of the proposed KnowledgeGuard workflow.

1.9 Chapter summary

This chapter defined the knowledge-loss problem, the study’s design contribution, four research questions, and the boundaries of the prototype evaluation. Chapter 2 states the objectives, and Chapter 3 reviews the research informing the assessment and transfer workflow.

2 OBJECTIVES

2.1 General objective or aim

The general objective of this study was to design, develop, and evaluate KnowledgeGuard, a decision support prototype that assesses employee-level knowledge-loss risk during organizational transitions and supports structured knowledge-transfer decisions.

The intended contribution was an accountable decision-support workflow rather than an autonomous personnel-decision tool. KnowledgeGuard was therefore designed to make its assessment inputs and risk information visible to a manager, link eligible cases to knowledge-transfer activities, and retain a record of review and approval. The evaluation asks whether this prototype workflow can be implemented and demonstrated within the available evidence setting; it does not claim to establish that the system predicts employee departure or eliminates organizational knowledge loss.

2.2 Specific objectives

O1. To identify and define measurable indicators of knowledge-loss risk and develop a structured assessment method that checks the quality of assessment responses.

O2. To examine relevant knowledge-management, risk-assessment, and decision-support research and use it to inform the design of the prototype.

O3. To design and implement an integrated workflow that combines indicator-based scoring, manager assessment, supporting machine-learning analysis, risk classification, and knowledge-transfer planning and review.

O4. To evaluate the prototype’s assessment and knowledge-transfer functions through testing, and to assess perceived usability and acceptance using system-evaluation responses.

Table 2.1: Objective-to-evidence alignment

Objective

Method

Evidence reported in Chapter 5

O1 Indicators and assessment

Define five indicators; map survey items; check expert comparison consistency

Indicator mapping, calculated scores, AHP outcome

O2 Literature and design basis

Review knowledge-loss evidence and related systems

Synthesis and justified design choices

O3 Integrated prototype

Implement scoring, validation and five KT stages

System outputs and functional scenarios

O4 Evaluation

Run tests; calculate SUS and acceptance summaries

Recorded test outcomes and questionnaire summaries

2.3 How the objectives guide the thesis

The objectives provide the thread that links the thesis chapters. Chapter 3 supplies the research basis for the indicators, analytical methods and transfer workflow. Chapter 4 explains how the prototype and evaluation were designed. Chapter 5 reports the evidence available for each objective, and Chapter 6 interprets how far that evidence answers the research questions. This alignment prevents a feature from being treated as a research contribution unless it is supported by a stated method and result.

2.4 Chapter summary

This chapter defined the aim and four specific objectives of the study and linked each objective to its method and expected evidence. Chapter 3 reviews the concepts, prior systems and technical approaches that provide the rationale for the prototype design.

3 LITERATURE REVIEW

3.1 Chapter overview

This chapter reviews the literature and concepts that inform KnowledgeGuard, a decision-support prototype for identifying employee-level knowledge-loss risk and supporting knowledge-transfer planning. It begins with organizational knowledge and the risk created when important knowledge is concentrated in individual employees. It then considers the limits of existing repositories, self-reported assessments, and approaches that identify risk without supporting knowledge transfer.

The review next examines the design basis for KnowledgeGuard: the five indicators, transparent weighted scoring, Analytic Hierarchy Process (AHP), response-quality checks, supporting machine learning, generative-AI assistance, and knowledge-transfer activities. It concludes by defining the integration and evaluation gap addressed by the prototype.

3.2 Conceptual map of the literature

The literature follows a progression from the general concept of organizational knowledge towards the specific decision-support workflow addressed by KnowledgeGuard. Organizational knowledge establishes the domain; tacit knowledge explains why documentation alone may be insufficient; employee transitions create potential exposure; and the identified limitations justify an integrated assessment-to-transfer workflow.

[INSERT FIGURE 3.1: Black-and-white conceptual flow diagram. Arrange eight rectangular boxes vertically with downward arrows: (1) Organizational knowledge; (2) Explicit and tacit knowledge; (3) Employee transitions and knowledge-loss exposure; (4) Limitations of repositories, self-assessments and isolated transfer processes; (5) KnowledgeGuard design choices: indicators, transparent scoring, AHP, response checks, ML and AI assistance; (6) Manager-reviewed knowledge-transfer workflow; (7) Functional testing, SUS and TAM; (8) Prototype-level contribution and evidence limits. Use short labels, no decorative icons, no colour, and keep all text within page boundaries.]

Figure 3.1: Conceptual map of the literature informing KnowledgeGuard.

3.3 Domain concepts and theories

Organizational knowledge includes recorded information and experience used in everyday work. Nonaka distinguishes explicit knowledge, which can be expressed formally, from tacit knowledge, which is closely tied to practice [1]. An organization may retain documents yet lose the contextual understanding needed to resolve unusual cases. Knowledge transfer requires another person to acquire and use relevant knowledge, beyond making material available [2].

Knowledge-loss exposure may increase when important work depends on one employee, knowledge is difficult to replace, and documentation is incomplete. Durst and Zieba organize knowledge risks across human, technological, and operational concerns [7]. This supports examining the employee’s knowledge together with the work and processes it affects. KnowledgeGuard’s five indicators are prototype operationalizations, not universal measurements whose exact weights are established by those studies.

A manufacturing case study of departing knowledge workers assessed the likelihood of loss, the critical knowledge areas, and their relevance to future work [8]. This provides a useful comparison with KnowledgeGuard’s emphasis on unique expertise and project consequences. Its authors warn that the framework’s application outside the studied industry requires care; the present indicators therefore remain locally testable definitions, not an adopted universal instrument.

These distinctions affect the choice of intervention. Written instructions can make explicit knowledge easier to locate, but a receiving employee may also need to observe decisions, ask questions about exceptions, and practise the task. A knowledge-transfer plan should therefore account for both the availability of material and the recipient’s ability to use it. The study treats backup competence as a separate review step instead of assuming that a signed document proves transfer.

The five indicators describe related but different sources of exposure. Expertise uniqueness asks whether another employee can supply comparable skill; documentation gap concerns the availability of usable records; project criticality concerns the consequences for important work; and collaboration dependency asks how strongly others rely on the knowledge holder. Tenure is a contextual characteristic, not evidence on its own that a person is irreplaceable. Treating these concepts separately makes it possible to explain why two employees receive different priority and which part of a case a transfer plan can plausibly change. These particular definitions are the study’s operational choices and must be assessed in a real organizational setting.

The selection follows several strands of evidence rather than a published five-factor standard. Research on turnover-related knowledge loss draws attention to the importance and uniqueness of knowledge that may leave with a person [9], [10]. Work on explicit and tacit knowledge explains why incomplete documentation matters [1]. Research on knowledge transfer shows why dependency on people and their ability to pass on work deserve attention [2]. Longitudinal research documents operational consequences when valuable knowledge is lost, supporting consideration of project impact [11]. Tenure provides possible context about experience, but duration of employment alone cannot establish unique or critical expertise. Thus, the literature motivates examining these dimensions; it does not validate this exact five-indicator instrument or its percentages.

A further distinction is between risk exposure and realized loss. A high score expresses concern under the chosen assessment rules; it is neither a measured probability of resignation nor proof that an organization has lost knowledge. Actual loss and continuity involve observing what happens to work after a transition. Massingham’s longitudinal organizational study examined such impacts using repeated evidence from a single public-sector setting [11]. This makes longitudinal evaluation a valuable comparison for KnowledgeGuard: its generated four-quarter demonstration can exercise the workflow but cannot supply observed organizational outcomes.

Studies in manufacturing and banking illustrate how work and organizational context affect knowledge retention [6], [8]. Neither provides a universal employee-level scale.

3.4 Existing studies, systems or frameworks

3.4.1 Repositories, related systems and a risk framework

Five named approaches cover different parts of the problem. SharePoint supports collaborative file storage and versioning [12]; Confluence organizes shared pages, attachments, and recorded decisions [13]. ServiceNow Knowledge Management adds configurable workflows and manager approval for publishing knowledge articles [14]. These functions could support documentation and review, but vendor documentation alone cannot establish how a customized employee risk-assessment process would operate in any of these products.

APQC’s Knowledge Loss Risk Matrix explicitly prioritizes knowledge areas for documentation or transfer [15]. Its detailed matrix is members-only, limiting comparison to the public description. SAP SuccessFactors Career and Talent Development supports identifying potential successors and assessing readiness [16], addressing personnel continuity from a different angle. KnowledgeGuard implements imported employee-level indicators, manager validation, assigned KT activities, backup practice, and score recalculation in one prototype. The comparison describes distinct documented purposes; it is not a hands-on benchmark or a claim of unique functionality.

The unit of analysis matters in this comparison. APQC describes a knowledge-area prioritization tool, whereas SAP records potential successors to roles. ServiceNow governs an article’s publication state. KnowledgeGuard records an employee assessment, a chosen receiving employee, and progress through transfer tasks. These systems could be combined or configured differently by an organization. No price, speed, accuracy, or completeness comparison was conducted; the table identifies the nearest documented capability and the untested boundary of each comparison.

3.4.2 Assessment tools and response quality

Survey input quality also matters. Ward and Meade recommend prevention, screening, and transparent reporting when addressing careless responses [17]. Repeating an answer across items may merit review, but does not prove dishonesty or invalidity on its own. The prototype’s low-variation cut-off is a local screening rule, not an established diagnostic test for employee honesty. KnowledgeGuard therefore presents potentially rushed, contradictory, or self-enhancing answer patterns as review flags; it does not label an employee as dishonest and manager review remains required.

3.4.3 From risk identification to knowledge transfer

Galan reviewed 91 empirical studies of knowledge loss associated with organizational member turnover [9]. The synthesis shows that effects depend on characteristics of departing members and on the knowledge they take with them. This supports assessing particular knowledge dependencies instead of assigning equal risk to all transitions, although it does not validate KnowledgeGuard’s indicator weights.

In the second part of that review, identification of vulnerable knowledge is linked to preventive and coping measures [10]. Igoa-Iraola and Díez survey transfer procedures during generational change [18]. These studies help select possible transfer activities and motivate testing the proposed workflow; they do not establish that KnowledgeGuard’s five-task sequence is effective in another workplace.

Biron, Turgeman-Lupo, and Zaid-Dominik examined matched responses from 81 retiring employees, supervisors, and successors before and after departure [19]. They found a positive association between knowledge-continuity behaviour and usefulness of received knowledge, particularly with more transformational supervisors. Their study supports involving managers and successors in a transfer process. It also shows why recording completion is different from measuring whether a successor can use knowledge later.

Iftikhar and Rashid studied three Pakistani public-transport projects through interviews and project documents and identified time pressure, weak personal knowledge sharing, and memory decay among contributors to loss [4]. Their reported retention practices include externalization and job shadowing, which support a two-person transfer activity alongside documentation. Sumbal and colleagues interviewed managers in Pakistani banks and identified social and organizational contextual factors [6]. Their banking findings warn against assuming that a process tested with generated records will transfer unchanged to every workplace.

Daghfous and colleagues find that knowledge-loss research often emphasizes mitigation after loss starts [3]. This supports early attention but offers no validated weights for KnowledgeGuard. Transfer research identifies observation, practice, and recipient involvement alongside documentation [19], [18]. A repository alone cannot demonstrate that a backup can perform the work, so the prototype includes a competence review. Its five-stage sequence still needs evaluation in a real organization.

3.4.4 Comparative synthesis

The reviewed evidence serves different purposes: syntheses identify patterns [9], [18]; cases show local practices [4], [6]; longitudinal work examines change [11]. None converts a generated quarterly test sequence into observed organizational results.

Longitudinal observation can examine actual consequences [11], and successor research supports assessing usefulness to a recipient [19]. The prototype currently checks recorded workflow and scores. Table 3.1 compares named approaches by documented or implemented scope, without claiming a product benchmark.

A defensible comparison thus has two levels. At the functional level, the prototype can be checked for importing scores, enforcing its eligibility rule, and recording manager-reviewed tasks. At the outcome level, one would need organizational measures such as successful backup task completion after a transition, repeated assessments, and the quality of documentation in use. None of the cited product descriptions supplies those outcome observations for this project.

Table 3.1: Named systems and frameworks compared with KnowledgeGuard

Example

Documented or implemented focus

Relationship to this study

SharePoint

Collaborative file storage and versioning

Possible home for KT documents; no product test conducted

Confluence

Organized pages, attachments and decisions

Possible home for KT notes; no product test conducted

ServiceNow KM

Article approval and publishing workflows

Related manager approval; different assessed object

APQC matrix

Prioritizes knowledge areas exposed to loss

Comparable prioritization idea; detailed matrix unavailable publicly

SAP SuccessFactors

Successor planning and readiness insights

Related backup planning; product not tested

KnowledgeGuard

Employee indicator assessment and reviewed KT tasks

Integrated workflow implemented; organizational impact unvalidated

Table 3.2: How the reviewed evidence informs the design

Evidence

Useful finding

Boundary for KnowledgeGuard

Galan (2023) reviews

Turnover can remove valuable personal knowledge

Does not validate the five weights

Massingham (2018)

Observed impact can be examined over time

Generated quarters are not field observations

Igoa-Iraola and Díez (2024)

Transfer calls for procedures and receiving staff

No proof that these exact five tasks work

Biron and colleagues (2024)

Successor and supervisor participation matters

Sign-off cannot prove lasting competence

Ward and Meade (2023)

Survey quality benefits from screening

Low variation is a review flag, not proof of bias

3.5 Technical approaches

3.5.1 Weighted assessment and expert calibration

A weighted indicator formula is transparent but depends on the relevance of selected variables and weights. KnowledgeGuard starts with predefined weights. Saaty’s Analytic Hierarchy Process (AHP) offers pairwise comparisons to derive proposed priorities and a consistency check for those judgements [20]. In this project, AHP concerns possible weight calibration rather than being recalculated for each employee. The interface blocks submission of an inconsistent matrix, and the supplied backend route recalculates consistency from the submitted matrix before applying new weights. A rejected request leaves the weights already configured in place.

Other multicriteria techniques can order alternatives once criteria and preferences have been specified, but that is a different question from how these five criteria were weighted. AHP is suitable here because it asks experts to compare criteria in pairs and tests whether the resulting judgements meet a stated consistency rule [20]. The fixed weights still require justification as design assumptions. A consistency ratio assesses the internal coherence of pairwise judgements; even a ratio below the threshold would not by itself establish that the selected weights predict organizational outcomes.

3.5.2 Supporting machine learning

Breiman’s Random Forest combines decision trees to make predictions [21]. KnowledgeGuard uses a Random Forest classifier as a supporting component for structured indicator data. In the supplied implementation, default training profiles are synthetic and their risk-tier labels are derived from the baseline formula. A model evaluated against these labels measures reproduction of configured patterns; it does not independently predict organizational knowledge loss.

This limitation matters when interpreting apparently strong classification metrics. A classifier trained on labels calculated from the same five inputs may learn to reproduce the rule used to generate those labels. It has not thereby discovered an independent relationship between those inputs and employee departure, service disruption, or retained expertise. Assessment of predictive validity would require separately observed, appropriately labelled organizational outcomes and a defensible evaluation split.

Isolation Forest identifies observations that are relatively easy to isolate from others [22]. KnowledgeGuard exposes it for anomaly analysis on submitted histories of risk scores. An unusual pattern prompts review; it does not identify the cause of the change. Detection of low-variation answers within a questionnaire is a separate statistical check.

The Node.js quality check examines responses within one survey [17]; the weighted formula summarizes the five indicators; the classifier supplies a supporting output; and Isolation Forest checks score history. A low-variation survey and an unusual historical risk score therefore call for different kinds of review.

3.5.3 Generative AI, knowledge transfer and artefact evaluation

KnowledgeGuard uses generative AI to provide plain-language risk explanations, suggest structured interview questions, generate improvement suggestions, and support manager queries about team risk. These functions are assistance, not automatic decisions. A knowledge-management framework proposes generative AI as an aid to acquiring and sharing knowledge but identifies privacy and sector-specific limits [23]. Its manufacturing scenarios are not evidence that KnowledgeGuard’s generated questions are accurate in another domain. Interview prompts and suggestions are discussion aids: participants conduct the transfer and the manager assesses the backup. Generated output must be reviewed because it may be incomplete, inaccurate, or contextually unsuitable. An approved task is a workflow record rather than independent evidence of lasting retention.

The KT stages combine explicit documentation with shadowing, an interview, and backup practice [1], [2], [18]. Manager sign-off documents workflow completion; the quality and durability of transferred knowledge still require field evaluation.

Research on generational knowledge transfer supports observation and interaction between knowledge holders and recipients [18]. KnowledgeGuard’s shadowing and interview stages respond to that need, but a digital confirmation cannot determine whether the interaction conveyed enough knowledge. The validation task supplies a closer test of backup capability, still limited to the observed practice run.

Design science evaluation considers the performance of a developed artefact against its problem [5]. Brooke’s ten-item System Usability Scale (SUS) measures perceived usability [24]. Davis’s Technology Acceptance Model (TAM) addresses perceived usefulness and ease of use as acceptance-related constructs [25]. These instruments complement functional tests, but responses from a small evaluation group cannot establish organization-wide acceptance or actual mitigation.

Design science emphasizes evaluation of an artefact in relation to its stated problem [5]. This guides the separation of Chapter 4’s methods from Chapter 5’s observed outputs. The mean SUS result from ten evaluators is presented descriptively without a population-level usability claim.

3.6 Research gap and implications for this work

The literature indicates that individual knowledge dependencies warrant assessment [1], [7], [9]; response quality and weighting require explicit choices [17], [20]; and transfer needs recipients, context, and review [2], [19]. Existing categories of tool contribute separate capabilities. This study investigates their integration within one prototype that connects assessment, manager review, and knowledge-transfer activity.

The research gap is therefore an integration and evaluation opportunity, not a claim that no similar technology exists. KnowledgeGuard brings together employee-level assessment, transparent scoring, response-quality review, manager validation, supporting ML, AI-assisted planning, backup involvement, and recorded sign-off in one prototype workflow.

The reviewed work does not provide one established, externally validated set of weights for KnowledgeGuard’s exact five indicators, nor does it establish that a prototype score change after task approval equals retained organizational knowledge. These are therefore limits of the contribution, not gaps filled simply by adding machine learning. The present study asks whether an integrated workflow can be built and used in the available evaluation setting. Field calibration of weights, independent outcome labels, and observation of backups over several assessments remain necessary to test effectiveness.

3.7 Chapter summary

This chapter established the conceptual basis for employee-level knowledge-loss assessment, reviewed limitations of existing approaches, and justified the analytical and evaluation methods used in KnowledgeGuard. It also clarified that response-quality flags do not detect lies, ML provides supporting analysis rather than autonomous decisions, and recorded workflow completion does not prove lasting knowledge retention. Chapter 4 explains how the system was designed, implemented, and evaluated within the available test setting.

4 METHODOLOGY

4.1 Research design

This study used design science research to develop and evaluate a decision support artefact addressing a defined organizational problem [5]. The unit of design was KnowledgeGuard: an application that turns assessment responses into reviewable risk information and links selected cases to knowledge-transfer activities. The work followed problem identification, review of relevant research, requirements definition, construction, and evaluation. Iterative changes to the interface and processing logic were made during development. This method is appropriate because the research question concerns how a working system can support an assessment and response workflow, rather than testing a general causal theory of employee turnover.

Functional tests check whether the implemented workflow follows its rules; questionnaire responses describe perceived usability. Neither shows that knowledge was retained following an actual employee transition. Generated assessments therefore demonstrate operation, not field effectiveness.

4.2 Data, participants and stakeholders

Three kinds of input were used. First, 30 anonymised standalone assessment responses were collected from colleagues employed in industry. Each response contained ten questionnaire items covering backup coverage, difficulty of transferring work, documentation, work criticality, and dependency, with direct and reverse-worded items. These convenience responses were used to demonstrate how assessment answers map to the four survey-derived indicators. Each colleague also manually supplied an employment start date solely for the prototype calculation of tenure. The prototype did not obtain this field automatically because it was not integrated with an organizational HR information system. These were individual colleague responses, not employee records supplied by an organization, and they are not treated as representative of an industry workforce.

Separately, a generated Q1-Q4 dataset was constructed as controlled test scenarios to test quarterly imports, score-history behaviour, manager validation, and the knowledge-transfer workflow. This dataset does not contain the colleague responses, is not a prospective cohort, and cannot be treated as follow-up measurement of any colleague.

Second, a pairwise-comparison questionnaire supplied ten responses for examining the relative importance of the five indicators. Third, ten working professionals with experience in HR, team management, technical work, or organizational processes used the deployed prototype and completed the System Usability Scale (SUS) and acceptance items. Exact evaluator role counts and organization affiliations were not recorded. These groups serve different purposes and are not assumed to represent the same people or a probability sample of organizational employees. The findings are therefore reported as descriptive responses from the available evaluators, without claims of representativeness.

Table 4.1: Data sources and permitted interpretation

Source

Quantity or period

Purpose and status

Standalone colleague assessment CSV and manually supplied start dates

30 anonymised colleague responses

Real prototype input for mapping, scores and tenure calculation

Separate quarterly test scenarios

Q1–Q4

Controlled test sequence for workflow demonstration; separate from colleague responses

Expert pairwise comparisons

10 collected responses

AHP consistency and proposed weights

System-evaluation forms

10 collected responses

Descriptive SUS and acceptance ratings

The intended application stakeholders were employees providing assessment information, managers validating cases and overseeing transfer, HR or research staff inspecting results, and a nominated backup employee participating in transfer. Their application roles are distinct from the contributors to the two research questionnaires. Source CSV files, question wording, and an appropriately de-identified account of the evaluation instruments can be placed in the appendices so that the analysis can be followed without publishing personal identifiers.

Table 4.2: Stakeholders and their role in the workflow

Actor

Main responsibility

Evidence or decision

Employee

Provide assessment answers and knowledge resources

Mapped responses and task submissions

Manager

Validate risk and assess backup competence

Validated scores, approvals and sign-off

Backup employee

Observe, discuss and practise the work

Confirmations and practice evidence

HR or research user

Import responses and review risk information

Assessment records and dashboard summaries

4.3 Requirements and analysis

Requirements were drawn from the practical risk-and-response problem, literature reviewed in Chapter 3, and the available project specification and implementation. The assessment needed to accept a structured CSV, map responses to four survey-based indicators, derive tenure from a stored start date, expose response-quality warnings, and retain a traceable score and tier. Because manager context is absent from the survey, the system also needed a recorded validation step. A further requirement was to protect the scoring configuration against inconsistent expert comparisons. The supplied implementation checks the submitted matrix again in the API before changing the configured weights.

The intervention requirements were to restrict creation of a knowledge-transfer (KT) plan to high- or critical-risk holders, nominate a viable backup, record evidence and confirmations, assess backup competence, and require final approval before recalculating risk. The interface compares the selected holder’s knowledge tags with candidate tags, pre-populates the relevant knowledge areas, and presents candidates with greater tag overlap first. Tag overlap is a recommendation aid rather than a compulsory compatibility rule. The implementation checks that the knowledge holder and backup are distinct employee accounts, that the assigned manager’s team restriction applies, and that a backup already classified as high or critical is not selected. The backend independently rejects a high- or critical-risk backup even if a client request bypasses the interface. Where no backup score exists, the present implementation does not treat the absence of a score as a high-risk classification; this is a limitation of the check rather than proof of backup suitability.

Each requirement has a corresponding observation for evaluation: a recognized CSV should produce mapped indicators; the AHP interface should disable application of inconsistent judgements; an ineligible holder or high-risk backup should be rejected; and an unfinished KT task should prevent sign-off. The direct API route must also be tested with an inconsistent matrix to confirm its rejection response and unchanged settings. The user roles and permitted actions identify where authorization checks matter. Screenshots can illustrate a state, but the result should be supported by a recorded input, expected outcome, and observed system response.

Nonfunctional priorities included access by role, legible reasons for a score, graceful handling of an unavailable ML service, and records that permit a manager to inspect progress. These are design requirements; Chapter 5 reports what was actually tested. The extensive original use cases, detailed screen flows, and test-case scripts belong in appendices when needed. The following sections give the implemented design and the evaluation methods needed to interpret its results.

Table 4.3: Key requirements and observable checks

Requirement

Intended behaviour

Proposed check

R1 Assessment import

Map CSV answers to four indicators; derive tenure

Inspect mapped row and formula

R2 Manager review

Record validated input and combine three scores

Recalculate a known example

R3 Weight control

Reject inconsistent comparisons in UI and API

Check disabled Apply action and API 400; confirm settings unchanged

R4 KT eligibility

Allow high or critical holder and viable backup

Try eligible and ineligible cases

R5 KT completion

Require evidence, confirmations and competence review

Attempt premature sign-off

R6 Service resilience

Retain scoring when ML request fails

Simulate service unavailability

A representative use case begins when an authorized user imports a questionnaire CSV, checks mapping and quality warnings, and opens an employee’s score for a manager. After validation, an eligible case permits nomination of a backup and creation of a KT plan. The expert submits resources and joins shadowing and interview activities; the backup demonstrates the task; the manager checks the evidence and closes the plan. A separate import is required to create a later-quarter assessment. This order distinguishes assessment, intervention, and reassessment and guides the test scenarios in Section 4.6.

4.4 Proposed design

4.4.1 Components and data flow

KnowledgeGuard comprises a React/Vite interface, a Node.js/Express application layer, MongoDB accessed through Mongoose, and a separate Python/FastAPI service. The backend coordinates imports, authentication and role checks, scoring, KT tasks, and communication with the ML and generative-AI services. This separation allows the assessment workflow to remain under application control even when a supporting service is unavailable. Assessment, risk-score, employee, KT-plan, and KT-task records connect an imported response with later review and action.

[INSERT FIGURE 4.1: KnowledgeGuard deployment and data-flow architecture, showing React/Vite interface, Node.js/Express backend, MongoDB, Python/FastAPI ML service, and the external generative-AI service. Draw arrows for CSV import, prediction, and KT-question generation. Insert the figure above the caption.]

Figure 4.1: KnowledgeGuard architecture and principal data flows.

Figure 4.1 shows the separation between the user interface, application layer, data store, ML service, and generative-AI service. The Node.js/Express backend coordinates access to these components and keeps scoring, authorization, and KT workflow rules under application control. This architecture supports transparent risk processing while allowing the application to use fallback behaviour when an external supporting service is unavailable.

[INSERT FIGURE 4.2: Data model showing User, Assessment, RiskScore, KTPlan and KTTask, their key relationships, and where manager validation and task evidence are stored. Use the verified schema in the application and insert the figure above the caption.]

Figure 4.2: Main entities and relationships in KnowledgeGuard.

Figure 4.2 represents the principal records that provide traceability from assessment input to knowledge-transfer evidence. An assessment is associated with an employee and produces risk information that can be reviewed by a manager. An eligible employee may then be associated with a KT plan and its task records, which retain confirmations, evidence, competence review, and sign-off status. The diagram is a conceptual class/data-model view; it does not imply a relational database design or expose implementation-only fields.

4.4.2 From survey answer to indicator

The parser maps each recognized questionnaire option to a score, using a higher value for greater reported exposure, and groups the resulting values by indicator. The four survey-based indicators are expertise uniqueness (EU), documentation gap (DG), project criticality (PC), and collaboration dependency (CD). The fifth indicator, tenure (T), uses service-length bands calculated from the stored start date rather than the survey answer. The defined default formula is F = 0.25(EU) + 0.20(DG) + 0.20(PC) + 0.20(CD) + 0.15(T).

Table 4.4 records the meaning, source, and provisional weight of each component. These definitions describe assessment inputs rather than independent measures of a future loss event.

Table 4.4: KnowledgeGuard indicators and initial weights

Indicator

What the score represents

Source

Weight

EU

Few alternative holders of specialist work

Mapped employee survey

0.25

DG

Inadequate documentation for essential tasks

Mapped employee survey

0.20

PC

Consequences for important project work

Mapped employee survey

0.20

CD

Other work depends on the holder

Mapped employee survey

0.20

T

Service length according to stored start date

Calculated from personnel record

0.15

The initial allocation makes expertise uniqueness the largest component (0.25), reflecting the project’s focus on knowledge that is difficult to replace [9], [10]. Documentation gap, project criticality, and collaboration dependency each receive 0.20: documented knowledge, the consequences of loss, and transfer between people are all relevant [1], [2], [11], but the cited research does not establish that one of these three should dominate the others. Tenure receives 0.15 as contextual information; years of service alone do not establish that a person holds critical or irreplaceable knowledge. The weights add to 1.00 and keep the formula on its input scale. These particular percentages are a transparent design judgement, not a published or empirically validated optimum. AHP was used to assess a proposed alternative; under the predefined rule, an inconsistent comparison matrix cannot replace the weights already configured. Chapter 5 reports whether the collected comparisons met that rule.

For example, the Q1 question about how many colleagues can complete an employee’s complex deliverables contributes to expertise uniqueness. An answer indicating that nobody else can do so maps to a high indicator value; an answer indicating several capable colleagues maps to a lower value. Questions vary across the generated quarters, but the parser assigns the recognized answers to the same four indicator categories. This design enables a repeated assessment while changing the wording and work context of individual questions. The generated demonstration cannot by itself establish that the quarterly questionnaires measure these concepts equivalently in an organization.

For Q1-style responses, the parser examines variation across mapped items and checks direct against reverse-worded items. Fewer than four mapped responses do not trigger its standard-deviation check. Where the mapped scores have a standard deviation below 1.0, the system flags a straight-lining pattern and adjusts its confidence handling. A warning invites scrutiny; it is not a determination that an employee gave dishonest responses. The confidence discount is not directly subtracted from the numerical final score in the supplied scoring function.

The system offers Analytic Hierarchy Process (AHP) calibration of its five indicator weights [20]. It aggregates ten pairwise comparison columns by geometric mean, builds a reciprocal 5 × 5 matrix, normalizes columns, and averages rows to obtain proposed weights. It estimates lambda_max, then calculates CI = (lambda_max − 5)/4 and CR = CI/1.12. The user interface enables application only when CR < 0.10. The supplied API route receives the comparison matrix, recalculates its weights and CR, and returns HTTP 400 if the calculated CR is at least 0.10. Rejection leaves the existing settings in place; those settings may be predefined or previously applied dynamic weights. Chapter 5 should report this control as tested only when an executed API request and the unchanged stored settings are available. Consistency does not establish predictive validity.

4.4.3 Combining the three scores

Once an assessment is available, the backend computes F from employee-derived inputs. A manager-validated indicator set yields a separate manager formula score M. The FastAPI endpoint returns a supporting score L using a Random Forest classifier trained, by default, on 500 synthetic profiles labelled by the predefined formula [21]. Its class probabilities are converted to a numerical score using tier midpoints. After manager validation, the final score is R = 0.30F + 0.50M + 0.20L. Before validation, R = 0.70F + 0.30L. If the ML request fails, F substitutes for L, while a validated manager score still retains its 50% contribution. Numerical results are rounded and assigned low (up to 5.0), medium (above 5.0 to 7.5), high (above 7.5 to 9.0), or critical (above 9.0). These are prioritization tiers; they do not represent measured probabilities of departure.

Table 4.5: Configured operational risk tiers

Tier

Final score R

Workflow interpretation

Low

R ≤ 5.0

Record assessment and review as needed

Medium

5.0 < R ≤ 7.5

Review exposure and supporting evidence

High

7.5 < R ≤ 9.0

Eligible holder for KT planning

Critical

R > 9.0

Eligible holder for KT planning

A worked test case illustrates the arithmetic. With EU = 9, DG = 8, PC = 9, CD = 7, and T = 10, the default formula gives F = 0.25(9) + 0.20(8) + 0.20(9) + 0.20(7) + 0.15(10) = 8.55. The saved default model contains low, medium and high classes only, so its configured probability-weighted score cannot exceed the high-tier midpoint of 6.50. Using a manager score of 8.50 and the maximum currently possible ML score of 6.50 gives R = 0.30(8.55) + 0.50(8.50) + 0.20(6.50) = 8.115, rounded to 8.12 (high). This is an arithmetic demonstration using the current model's stated output boundary, not a captured organizational prediction. Chapter 5 reports the outputs actually supported by its demonstration evidence.

The Python service also offers Isolation Forest analysis of a supplied score history when at least three points are available [22]. This checks whether the latest score is unusual relative to the submitted series. It differs from the Node.js check for low-variation answers within one questionnaire, and it cannot identify why a score changed. Historical data in the present demonstration do not constitute longitudinal evidence from an organization.

4.4.4 From risk review to knowledge transfer

For an eligible high- or critical-risk holder, the manager can create a KT plan with a backup employee, knowledge areas, priority, and deadline. The interface uses the holder’s knowledge tags to pre-populate knowledge areas and rank potential backups by shared tags. A manager may still select an eligible candidate with no overlap, so the tag comparison supports rather than proves suitability. Both the interface and backend prevent a high- or critical-risk employee from being assigned as backup. The backend requests interview questions from an external language-model service and uses default questions if that request fails. Five task records are then created: documentation; shadowing with participant confirmations; a structured interview; independent backup practice with a manager competence rating; and final manager sign-off. The sign-off route checks that all preceding tasks are marked complete before closing the plan. A task record reports workflow completion; it does not verify long-term retention.

The five stages have different evidentiary roles. Documentation links a usable resource; shadowing records observation and the participants’ confirmations; the structured interview records the expert’s responses to prompts; validation asks the backup to perform work independently and records a manager rating; sign-off confirms the preceding stages have been completed. Each stage is assigned a deadline. This sequence deliberately combines explicit material with opportunities to surface tacit practice [1], [4]. The record of approval is a procedural control; organizational effectiveness would require following the backup’s later work.

At sign-off, the KT update reads the approved evidence and competence rating. It can reduce DG by up to 3 points according to the proportion of approved documentation tasks, EU by 0–3 points according to backup competence, and CD by up to 2 points when both shadowing and interview are approved and the competence mapping permits a reduction. The code applies reductions to employee indicator scores and, if available, to validated manager scores, bounded below by 1. PC and tenure remain unchanged. The weighted formula component can consequently fall by at most 0.25(3) + 0.20(3) + 0.20(2) = 1.75 points before bounds; this is not a guaranteed cap on the final blended score because its manager and ML components are recalculated too. No later-quarter assessment is generated automatically by sign-off.

4.5 Development and implementation procedure

Development began with an external questionnaire and the CSV import path, followed by response mapping and scoring. The application layer then integrated manager review and risk presentation. A separate service was introduced for classifier training, prediction, and anomaly analysis. Finally, the intervention workflow joined risk eligibility checks, AI-supported interview prompts, task evidence, participant confirmations, competence validation, sign-off, and recalculation. The current application stores scores and task state so the workflow can be inspected in successive steps.

Implementation decisions followed the project scope. Google Forms supplied questionnaire collection; the application consumed a CSV export rather than hosting a general survey builder. The risk formula and response checks remained in Node.js so that ordinary assessment processing did not require model inference. The Python service handled supporting ML output. Because the default classifier learns labels produced by the same formula used in the application, its output cannot be presented as independent predictive evidence. The generative service proposes interview questions, while participants supply the actual knowledge and a manager judges the backup’s performance.

4.6 Evaluation plan

Evaluation was organized against the four objectives. For O1, the inspection checks whether the collected colleague responses import, map to the intended indicators, produce tenure-based formula scores and quality warnings, and whether the AHP interface disables application when expert judgements are inconsistent. The evaluation should include a real direct API request with CR at or above 0.10, followed by a read of the settings to establish that no weights changed. The separate generated Q1-Q4 test dataset checks repeated import and score-history behaviour without representing organizational follow-up of the colleagues. The expert exercise aggregates ten collected comparison responses and reports proposed weights together with the unrounded and displayed consistency ratio. The predefined criterion is CR < 0.10; the result and its consequences are reported in Chapter 5.

Table 4.6: Evaluation measures and evidence required

Aspect

Measure or observation

Evidence to present

Assessment processing

Mapped inputs, scores, warning state

De-identified test inputs and outputs

AHP calibration

Weights, CI and CR; CR < 0.10 interface rule

Comparison output and interface response

KT controls

Eligibility, task states, sign-off and scoreDelta

Test cases with expected and observed response

Usability

Individual SUS scores; mean and sample SD

Ten scored questionnaires

Acceptance

Mean usefulness, ease and intention ratings

Item-level scale and n for each construct

For O2, the literature review compares the assessment and KT design with knowledge-loss and decision-support research. Its outcome is the justified selection of indicators and a stated design gap rather than a numerical performance claim. For O3, functional scenarios examine manager validation, score blending, service fallback, high/critical KT eligibility, backup constraints, task evidence and confirmations, approval gates, and the sign-off recalculation. Each scenario should specify its starting record, input or action, expected result, and observed result. A short traceability table in Chapter 5 should map each objective to the evidence actually available; detailed individual test cases may be supplied in an appendix.

For O4, ten system-evaluation questionnaires are scored with the standard ten SUS items [24]. Odd-numbered items contribute response minus 1, even-numbered items contribute 5 minus response, and the summed contribution is multiplied by 2.5 to obtain an individual 0–100 score. The mean and sample standard deviation summarize the ten individual scores. Acceptance items are summarized separately as mean Likert responses for perceived usefulness, perceived ease of use, and behavioural intention, reflecting constructs related to the Technology Acceptance Model [25]. Descriptive summaries are appropriate for this small convenience evaluation; they do not justify population estimates or a claim that the system was adopted by an organization.

Before completing the questionnaire, evaluators received the deployed-system link and the Google Form link through WhatsApp. They used the prototype independently to log in, view the dashboard and an employee risk profile, review manager validation, review or create a KT plan, and view AHP validation. They then completed the SUS and acceptance items. The three acceptance constructs remain separate from SUS and from functional correctness. Reporting the number of returned questionnaires beside each mean lets the reader judge the descriptive scope. The evaluation did not include a commercial-platform comparison or a controlled task-time study.

A KT example may compare the stored score before and immediately after sign-off and report scoreDelta as final score minus the previous score. Thus a hypothetical decrease from 8.50 to 7.00 is stored as −1.50, not +1.50. A later-quarter score in the generated four-quarter demonstration requires a separately imported assessment and must be labelled simulated. These outputs test the implemented arithmetic and records, not an observed decrease in actual disruption or knowledge loss. No independently labelled organizational departure or retention outcomes were available for validation of classifier accuracy. Nonfunctional evaluation can report only the access-control, error-handling, response-time, or other checks for which actual test records exist; unmeasured qualities are not claimed as established results.

4.7 Ethics and project management

The study used 30 anonymised standalone responses from colleagues employed in industry, together with manually supplied start dates for tenure calculation, and a separate generated Q1-Q4 test dataset rather than a partner organization’s employee file. The separately collected AHP and system-evaluation responses should be reported in aggregate, and any appendix containing CSV extracts or screenshots should omit email addresses and other identifiers. An employee-related risk tier can affect how a manager sees a person; KnowledgeGuard therefore presents it as decision support for knowledge-transfer preparation, not as evidence for dismissal, promotion, or an individual’s likelihood of resigning. Access checks assign functions by role. External AI input should be limited to the information needed to formulate interview questions; its generated suggestions require human review.

The project used an iterative development workflow described as Agile-Kanban to coordinate implementation and refinement. This practice did not constitute a controlled experiment. The questionnaire files contain responses but do not document participant recruitment, consent, or institutional ethics approval. Those procedures must be checked against the researcher’s records before submission; no organizational deployment or formal ethics approval is claimed on the basis of the available evidence.

4.8 Chapter summary

The methodology connects a design science study to available test data, expert comparisons, application code, technical scenarios, and evaluator responses. It specifies the scoring and transfer procedures while setting limits on what the evidence can establish. Chapter 5 reports the corresponding artefact and evaluation results.

REFERENCES

[1] I. Nonaka, “A dynamic theory of organizational knowledge creation,” Organization Science, vol. 5, no. 1, pp. 14–37, 1994, doi: 10.1287/orsc.5.1.14.

[2] L. Argote and P. Ingram, “Knowledge transfer: A basis for competitive advantage in firms,” Organizational Behavior and Human Decision Processes, vol. 82, no. 1, pp. 150–169, 2000, doi: 10.1006/obhd.2000.2893.

[3] A. Daghfous, N. T. Amer, O. Belkhodja, L. C. Angell, and T. Zoubi, “Managing knowledge loss: A systematic literature review and future research directions,” Journal of Enterprise Information Management, vol. 36, no. 4, pp. 1008–1031, 2023, doi: 10.1108/JEIM-05-2022-0171.

[4] R. Iftikhar and M. Rashid, “Knowledge loss and retention in interorganizational projects: Evidence from public transportation projects from Pakistan,” International Journal of Managing Projects in Business, vol. 18, no. 2, pp. 241–264, 2025, doi: 10.1108/IJMPB-09-2024-0210.

[5] A. R. Hevner, S. T. March, J. Park, and S. Ram, “Design science in information systems research,” MIS Quarterly, vol. 28, no. 1, pp. 75–106, 2004, doi: 10.2307/25148625.

[6] M. S. Sumbal, A. Ključnikov, S. Durst, A. Ferraris, and L. Saeed, “Do you want to retain your relevant knowledge? The role of contextual factors in the banking sector,” Journal of Knowledge Management, vol. 27, no. 9, pp. 2414–2433, 2023, doi: 10.1108/JKM-02-2022-0128.

[7] S. Durst and M. Zieba, “Mapping knowledge risks: Towards a better understanding of knowledge management,” Knowledge Management Research & Practice, vol. 17, no. 1, pp. 1–13, 2019, doi: 10.1080/14778238.2018.1538603.

[8] M. S. Sumbal, E. Tsui, S. Durst, M. Shujahat, I. Irfan, and S. M. Ali, “A framework to retain the knowledge of departing knowledge workers in the manufacturing industry,” VINE Journal of Information and Knowledge Management Systems, vol. 50, no. 4, pp. 631–651, 2020, doi: 10.1108/VJIKMS-06-2019-0086.

[9] N. Galan, “Knowledge loss induced by organizational member turnover: A review of empirical literature, synthesis and future research directions (Part I),” The Learning Organization, vol. 30, no. 2, pp. 117–136, 2023, doi: 10.1108/TLO-09-2022-0107.

[10] N. Galan, “Knowledge loss induced by organizational member turnover: A review of empirical literature, synthesis and future research directions (Part II),” The Learning Organization, vol. 30, no. 2, pp. 137–161, 2023, doi: 10.1108/TLO-09-2022-0108.

[11] P. R. Massingham, “Measuring the impact of knowledge loss: A longitudinal study,” Journal of Knowledge Management, vol. 22, no. 4, pp. 721–758, 2018, doi: 10.1108/JKM-08-2016-0338.

[12] Microsoft, “Intro to file collaboration in Microsoft 365, powered by SharePoint,” Microsoft Learn, 2025. [Online]. Available: https://learn.microsoft.com/en-us/sharepoint/intro-to-file-collaboration. [Accessed: Sep. 24, 2026].

[13] Atlassian, “Use labels to organize content and attachments,” Confluence Cloud Support, n.d. [Online]. Available: https://support.atlassian.com/confluence-cloud/docs/use-labels-to-organize-your-content/. [Accessed: Sep. 24, 2026].

[14] ServiceNow, “Knowledge workflows,” ServiceNow Platform Documentation, Xanadu release, Aug. 1, 2024. [Online]. Available: https://www.servicenow.com/docs/r/xanadu/servicenow-platform/knowledge-management/r_KnowledgeWorkflows.html. [Accessed: Sep. 24, 2026].

[15] APQC, “APQC’s Knowledge Loss Risk Matrix,” Sep. 17, 2025. [Online]. Available: https://www.apqc.org/resource-library/resource-listing/apqcs-knowledge-loss-risk-matrix. [Accessed: Sep. 24, 2026].

[16] SAP, “SAP SuccessFactors Career and Talent Development,” 2026. [Online]. Available: https://www.sap.com/products/hcm/career-talent-development.html. [Accessed: Sep. 24, 2026].

[17] M. K. Ward and A. W. Meade, “Dealing with careless responding in survey data: Prevention, identification, and recommended best practices,” Annual Review of Psychology, vol. 74, pp. 577–596, 2023, doi: 10.1146/annurev-psych-040422-045007.

[18] E. Igoa-Iraola and F. Díez, “Procedures for transferring organizational knowledge during generational change: A systematic review,” Heliyon, vol. 10, no. 5, art. e27092, 2024, doi: 10.1016/j.heliyon.2024.e27092.

[19] M. Biron, K. Turgeman-Lupo, and O. Zaid-Dominik, “Contextualizing the usefulness of knowledge received from retiring employees: Leader behaviour and organisational culture,” Knowledge Management Research & Practice, vol. 22, no. 6, pp. 620–631, 2024, doi: 10.1080/14778238.2023.2297060.

[20] T. L. Saaty, “Decision making with the analytic hierarchy process,” International Journal of Services Sciences, vol. 1, no. 1, pp. 83–98, 2008, doi: 10.1504/IJSSCI.2008.017590.

[21] L. Breiman, “Random forests,” Machine Learning, vol. 45, no. 1, pp. 5–32, 2001, doi: 10.1023/A:1010933404324.

[22] F. T. Liu, K. M. Ting, and Z.-H. Zhou, “Isolation forest,” in Proceedings of the 2008 Eighth IEEE International Conference on Data Mining, Pisa, Italy, 2008, pp. 413–422, doi: 10.1109/ICDM.2008.17.

[23] Q. He and Z. Yang, “Generative AI-driven knowledge management in manufacturing firms: A five-stage framework for dynamic knowledge optimization and digital innovation,” Journal of Knowledge Management, vol. 30, no. 4, pp. 1447–1467, 2026, doi: 10.1108/JKM-03-2025-0418.

[24] J. Brooke, “SUS: A quick and dirty usability scale,” in Usability Evaluation in Industry, P. W. Jordan, B. Thomas, B. A. Weerdmeester, and I. L. McClelland, Eds. London, U.K.: Taylor & Francis, 1996, pp. 189–194.

[25] F. D. Davis, “Perceived usefulness, perceived ease of use, and user acceptance of information technology,” MIS Quarterly, vol. 13, no. 3, pp. 319–340, 1989, doi: 10.2307/249008.
