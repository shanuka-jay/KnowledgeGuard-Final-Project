# TAM and SUS Academic Guide

To prove that your KnowledgeGuard system is "Usable" and "Useful", you must conduct a final user evaluation using the **System Usability Scale (SUS)** and the **Technology Acceptance Model (TAM)**. 

Because your backend already has CSV import/export routes for these, you just need to create a Google Form with the exact standard academic questions and send it to your testers.

---

## 1. The SUS Survey (System Usability Scale)
SUS is the global academic standard for proving a software interface is easy to use. 
**Instructions for your testers:** *"Please rate the following 10 statements on a scale of 1 to 5 (1 = Strongly Disagree, 5 = Strongly Agree) after using KnowledgeGuard."*

### The 10 Exact Academic Questions:
1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

**How to Score SUS in your Thesis:**
*(Your backend export automatically calculates this for you!)*
The final SUS score is out of 100. 
*   **< 50:** Unacceptable 
*   **50 - 70:** Marginal / Okay
*   **> 70:** Acceptable (Good)
*   **> 85:** Excellent

---

## 2. The TAM Survey (Technology Acceptance Model)
While SUS proves the system is *easy to use*, TAM proves that the system is *actually useful for HR departments*. 

**Instructions for your testers:** *"Please rate the following statements on a scale of 1 to 5 (1 = Strongly Disagree, 5 = Strongly Agree)."*

### The TAM Questions:
**Perceived Usefulness (PU):**
1. Using KnowledgeGuard improves the identification of knowledge loss risks.
2. KnowledgeGuard supports better Knowledge Transfer (KT) planning decisions.
3. Overall, KnowledgeGuard would be highly useful in an organization.

**Perceived Ease of Use (PEOU):**
1. The risk scoring system in KnowledgeGuard is easy to understand.
2. It is easy to complete a Knowledge Transfer (KT) task within the system.
3. The overall workflow (Assessment -> Risk Score -> KT Plan) is clear.

**Behavioral Intention to Use (Adoption):**
1. I would strongly recommend using this system for knowledge-risk monitoring in a real company.

---

## How to Execute This for Your Thesis
1. **The Test:** Have 5 friends (or your professor) log into the KnowledgeGuard demo using the Admin or Manager buttons. Ask them to click around, view a profile, and look at the AI KT plans.
2. **The Survey:** Give them a Google Form with the SUS and TAM questions above.
3. **The Import:** Use your Admin Dashboard's `import/surveys` CSV upload feature to import their results. 
4. **The Thesis Graphs:** Go to your backend's `/api/import-export/export/sus` route. It will give you a CSV with the final calculated scores out of 100. 
5. Put those numbers into Excel, make two beautiful Bar Charts (One for SUS, one for TAM), and put them in your "Results and Evaluation" chapter!

> **Thesis Defense Tip:** If your SUS score is above 70, you can confidently tell your examiners: *"The empirical SUS score of [Your Score] demonstrates that despite the complex Machine Learning architecture in the backend, the React frontend is highly intuitive and meets the industry standard for usability."*
