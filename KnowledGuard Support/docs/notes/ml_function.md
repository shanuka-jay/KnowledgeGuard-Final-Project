# The Role and Function of the Machine Learning Service in KnowledgeGuard

The Machine Learning (ML) service is a core component of the KnowledgeGuard Decision Support System (DSS). It operates as a decoupled Python FastAPI microservice, providing predictive analytics, anomaly detection, and feature importance extraction to support managerial decision-making.

## 1. Why Use Machine Learning? (The Problem with Rigid Formulas)
The core Analytic Hierarchy Process (AHP) formula in the Node.js backend is **deterministic and rigid**. It calculates risk by multiplying indicator scores by fixed weights (e.g., Project Criticality × 20%). 

While this deterministic approach provides high transparency, a rigid math formula struggles to recognize **non-linear risk patterns**. For example, if an employee has a very low *Tenure* (they are a new hire) but an extremely high *Expertise Uniqueness* (they brought proprietary knowledge from a competitor), a rigid formula may average those scores out and misclassify them as a "Medium" risk. 

A Machine Learning model trained on historical data, however, recognizes this specific pattern as a **High Risk** anomaly. ML is utilized to catch the invisible, complex patterns that rigid mathematical formulas miss.

## 2. Triangulation and the "Human-in-the-Loop" Philosophy
A critical design philosophy of KnowledgeGuard is that the AI does not make the final decision. In many enterprise systems, AI operates as a "black box" that managers blindly trust, leading to algorithmic bias and accountability issues.

In KnowledgeGuard, the ML Service acts strictly as **Decision Support**. The system uses a method called **Triangulation** to calculate the final risk score by blending three independent inputs:
* **30% comes from the AHP Formula** (Rigid, transparent mathematical baseline)
* **50% comes from the Human Manager** (Contextual judgment and operational reality)
* **20% comes from the ML Service** (Historical pattern recognition)

By constraining the ML model to a 20% weighting, KnowledgeGuard enforces a **"Human-in-the-Loop"** architecture. The artificial intelligence supports and informs the manager, but human judgment (50%) remains the primary driver of the final operational decision.

## 3. How the ML Service Works (The Technical Flow)
The predictive workflow executes in real-time across the decoupled architecture:
1. When an employee submits their quarterly survey, the Node.js backend extracts their 5 core indicator scores: *Expertise Uniqueness, Documentation Gap, Project Criticality, Collaboration Dependency,* and *Tenure*.
2. The backend sends a fast HTTP POST request with these features to the Python ML Service (`/predict`).
3. Inside the Python service, a pre-trained **Random Forest Regressor** analyzes the 5 dimensions, compares them against thousands of historical data points, and outputs a predicted risk score (1.0 to 10.0).
4. The predicted score is returned to the Node.js backend, where it is factored into the final triangulated calculation.

## 4. Advanced Analytical Features
Beyond basic score prediction, the `ml-service` provides two advanced algorithms to support proactive HR management:

### The Isolation Forest Anomaly Detector (`/anomaly`)
When an employee's historical risk scores (e.g., Q1, Q2, Q3) are submitted to the ML service, it runs an **Isolation Forest** anomaly detection algorithm over their timeline. If an employee's risk score remains flat for 9 months but suddenly spikes by 4 points in a single quarter, the Isolation Forest flags this trajectory as an **Anomaly**. This acts as an early-warning system for managers, prompting them to investigate whether the employee was unexpectedly assigned a massive undocumented project, or if they are exhibiting behaviors indicative of imminent departure.

### Feature Importance Extraction (`/feature-importance`)
Because the Random Forest model analyzes vast amounts of historical data, it mathematically determines which of the 5 indicators is the strongest driver of organizational risk. The `/feature-importance` endpoint allows HR administrators to extract these structural insights. For example, the model can definitively prove that across the entire company, *Expertise Uniqueness* drives 42% of the knowledge-loss risk, while *Tenure* only accounts for 12%. This allows the organization to optimize its enterprise-wide training strategies based on empirical data rather than intuition.

## 5. Architectural Separation of Concerns: Statistics vs. Machine Learning
A critical aspect of the KnowledgeGuard architecture is the strict boundary between basic statistical data validation and advanced machine learning predictions.

During the defense, it is vital to distinguish these mechanisms:
* **Survey Bias and Straight-Lining (Handled by Node.js):** The detection of "lazy" survey takers (e.g., acquiescence bias or straight-lining) is **not** performed by Machine Learning. Instead, it is executed via Statistical Mathematics in the Node.js backend. When an employee submits a survey, the parser calculates the Standard Deviation ($\sigma$) of all responses. If $\sigma < 1.0$, it mathematically proves the user selected identical answers (e.g., all "Strongly Agree"). Node.js flags this and applies a confidence penalty before the ML model is even engaged.
* **Longitudinal Behavioral Anomalies (Handled by Python ML):** The Machine Learning engine (Isolation Forest) does not look at individual survey questions. Instead, it analyzes the employee's holistic risk trajectory over time across multiple quarters. It detects when an employee's risk profile spikes suddenly against their historical baseline.

By delegating deterministic mathematical checks to Node.js and probabilistic pattern recognition to Python, the system maintains high performance while strictly utilizing Machine Learning only for complex, non-linear predictive tasks.
