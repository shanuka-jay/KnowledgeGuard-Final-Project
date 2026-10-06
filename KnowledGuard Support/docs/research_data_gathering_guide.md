# Research Data Gathering & Validation Guide

This document is your master checklist for executing the empirical stage of your Design Science Research (DSR) project. It details the exactly what data you need, how to build the Google Forms, and how the data is processed.

---

## 1. Employee Risk Assessment Data (The Core System Input)

**Purpose:** To gather indirect operational data that feeds into your risk formula (`RS = 0.25*EU + ...`).
**Target:** 30–50 participants (friends/classmates acting as employees).

### Google Form Setup
Create a Google Form with the following exact questions and response types:

1. **Email Address** *(Short Answer)*
2. **How many other people can complete your main work without your help?** *(Multiple Choice: Three or more / One or two / No one currently)*
3. **How often do others ask you for help to continue this work?** *(Multiple Choice: Rarely / Sometimes / Very often)*
4. **If you are unavailable tomorrow, how ready is the documentation for someone else to follow?** *(Multiple Choice: Complete and updated / Partly ready / Not ready)*
5. **If this work stops for one week, how serious is the operational impact?** *(Multiple Choice: Low / Moderate / Severe)*
6. **How difficult would it be to train a backup person for your main responsibilities?** *(Multiple Choice: Easy / Moderate / Very difficult)*
7. **Where is most of the knowledge needed for this work currently stored?** *(Multiple Choice: Shared documents/system / Mixed / Mostly in my experience)*
8. **How many active tasks, people, or teams depend on your knowledge each week?** *(Multiple Choice: Very few / Several / Many)*
9. **How important is your main work to service continuity, compliance, revenue, or customer delivery?** *(Multiple Choice: Low / Important / Mission critical)*

### Processing & System Feeding
1. **Prepare Dummy Accounts:** In KnowledgeGuard (as Admin), create fake employee accounts (e.g., `emp1@test.com` to `emp30@test.com`) with randomized start dates. This proves you are storing "Tenure" separately, as promised in your PDF.
2. **Modify the CSV:** Download the Google Form responses as a CSV. In Excel, replace your friends' real emails with the dummy emails (`emp1@test.com`, etc.).
3. **Import:** Log in as HR -> **Research Data Hub** -> **Import Assessment CSV**.
4. **Result:** The system maps the text answers to numerical scores (1-10), averages them, pulls Tenure from the database, runs the formula, pings the ML service, and populates the Manager Dashboard.

---

## 2. Risk Formula Validation Data (AHP)

**Purpose:** To mathematically prove to your grading panel that your formula weights (0.25 for EU, 0.15 for Tenure, etc.) are valid based on expert opinion.
**Target:** 3–5 real managers or supervisors.

### Google Form Setup (Pairwise Comparison)
Provide these instructions: *"Rate which risk indicator is a greater threat to operational continuity on a scale of 1 to 9 (1 = Equal, 5 = Strongly more important, 9 = Absolutely more important)."*

Use a Linear Scale (1-9) for these 10 questions:
1. **Expertise Uniqueness** vs **Documentation Gap**
2. **Expertise Uniqueness** vs **Project Criticality**
3. **Expertise Uniqueness** vs **Collaboration Dependency**
4. **Expertise Uniqueness** vs **Tenure**
5. **Documentation Gap** vs **Project Criticality**
6. **Documentation Gap** vs **Collaboration Dependency**
7. **Documentation Gap** vs **Tenure**
8. **Project Criticality** vs **Collaboration Dependency**
9. **Project Criticality** vs **Tenure**
10. **Collaboration Dependency** vs **Tenure**

### Processing & System Feeding
* **Do NOT import this into KnowledgeGuard.**
* Calculate the average score for each of the 10 questions.
* Input those 10 averages into a free online **AHP Calculator** (search for "BPMSG AHP Calculator").
* The calculator will output percentage weights (e.g., 26% for EU) and a Consistency Ratio (CR). Take a screenshot and put it directly into your thesis Results chapter to prove your formula is correct!

---

## 3. Manager Judgement Alignment Data

**Purpose:** To prove that when your formula flags an employee as "High Risk", real human managers agree with it.
**Target:** 3–5 real managers.

### Gathering Method A: Live Software Demo (Recommended)
1. Sit with a manager and show them the Manager Dashboard.
2. Have them click on an employee's profile and click **"Validate Score"**.
3. Let them adjust the sliders visually on the screen and save. The system will recalculate the final formula instantly.

### Gathering Method B: Offline CSV (If they can't do a live demo)
Send them a Google Form with these questions:
1. Employee email being validated *(Short Answer)*
2. Manager email *(Short Answer)*
3. Manager rating: expertise uniqueness *(Linear scale 1-10)*
4. Manager rating: documentation gap *(Linear scale 1-10)*
5. Manager rating: project criticality *(Linear scale 1-10)*
6. Manager rating: collaboration dependency *(Linear scale 1-10)*
7. Manager notes for validation *(Paragraph)*

*System Feed:* Download CSV -> HR Dashboard -> **Import Manager Validations**. The system will update the specific employee's score using the manager's offline ratings.

---

## 4. System Evaluation Data (SUS & TAM)

**Purpose:** To measure the usability, usefulness, and acceptance of the KnowledgeGuard software prototype.
**Target:** 5–8 managers/supervisors after they have seen a demo.

### Gathering Method
* **Live In-App Survey (Best!):** Have the managers log in and navigate to the **Survey Center** inside the application. They can fill out the SUS and TAM surveys directly using interactive sliders! The system does the complex reverse-scoring math for you automatically.

* **Offline Google Form (Alternative):**
  1. Participant email *(Short Answer)*
  2. Standard SUS Q1 to Q10 *(Linear scale 1-5)*.
  3. Using KnowledgeGuard improves knowledge-risk identification. *(Linear scale 1-5)*
  4. KnowledgeGuard supports better KT planning decisions. *(Linear scale 1-5)*
  5. KnowledgeGuard would be useful in an organization. *(Linear scale 1-5)*
  6. KnowledgeGuard is easy to understand. *(Linear scale 1-5)*
  7. It is easy to complete the required tasks in KnowledgeGuard. *(Linear scale 1-5)*
  8. The system workflow is clear. *(Linear scale 1-5)*
  9. I would recommend using this system for knowledge-risk monitoring. *(Linear scale 1-5)*

*System Feed:* If using the offline Google Form, download the CSV and import it via the HR Dashboard's **Survey Center**. The system will crunch the numbers and give you the final SUS score out of 100 for your thesis.
