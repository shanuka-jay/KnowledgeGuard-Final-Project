# KnowledgeGuard: Detailed System Architecture & Technical Workflow

This document provides a deep, technical, and comprehensive view of the KnowledgeGuard system architecture, codebase structure, machine learning models, and organizational workflows. It is explicitly structured for use in a university thesis (System Design, Implementation, and Evaluation chapters).

---

## 1. System Overview & Technology Stack
**KnowledgeGuard** is an enterprise AI decision-support system designed to quantify and mitigate the risk of knowledge loss (knowledge attrition). It uses a microservices architecture to decouple the frontend UI, backend business logic, and the Python-based predictive machine learning layer.

### Technology Stack
*   **Frontend (Client):** React.js, Vite, TailwindCSS, Zustand (State Management), React Router, Recharts (Data Visualization).
*   **Backend (API Server):** Node.js, Express.js, MongoDB (Mongoose ORM), Socket.IO (WebSockets for real-time notifications).
*   **ML Service (Predictive Engine):** Python 3.11+, FastAPI, Scikit-Learn, NumPy, Joblib.
*   **Authentication & Security:** JWT (JSON Web Tokens), Bcrypt (Password hashing).

---

## 2. Database Schema & Core Models (MongoDB)
The backend uses Mongoose to interact with MongoDB. The core collections include:

1.  **User (`User.js`):** Stores credentials, roles (`admin`, `manager`, `employee`, `hr_analyst`, `researcher`), department, and tenure data. Passwords are hashed via bcrypt pre-save hooks.
2.  **Assessment (`Assessment.js`):** Stores the quarterly assessment data. It includes `selfScores`, `managerScores` (if validated), and `responseBias` (which flags straight-lining or acquiescence bias).
3.  **RiskScore (`RiskScore.js`):** The final calculated risk snapshot. It stores the `formulaScore`, `managerScore`, `mlScore`, `finalScore`, `tier` (Low, Medium, High, Critical), and `confidence` rating.
4.  **KTPlan (`KTPlan.js`) & KTTask (`KTTask.js`):** Manages the Knowledge Transfer (KT) mitigation workflow, linking the at-risk employee, the backup employee, and the manager overseeing the evidence.
5.  **ActivityLog (`ActivityLog.js`):** An immutable audit trail for system actions, ML retraining events, and SUS/TAM survey submissions.
6.  **Alert (`Alert.js`):** Real-time notifications pushed to the frontend via Socket.IO for overdue tasks or pending manager validations.

---

## 3. The Backend API & Business Logic (`/api`)
The Node.js backend handles the core routing and business rules:
*   `/api/auth`: Handles login, logout, and JWT token issuance.
*   `/api/import-export`: Parses Google Forms CSV uploads. It contains logic to map indirect survey questions (e.g., "I am the only one who knows X") to the internal 1-10 indicators.
*   `/api/assessments`: Calculates the baseline formula and triggers the ML prediction.
*   `/api/kt-plans` & `/api/kt-tasks`: Handles the CRUD operations for mitigation planning, including uploading evidence links and manager sign-offs.
*   `/api/ai`: The bridge route that acts as a proxy, forwarding requests from the frontend to the Python ML Service and returning the predictions.

---

## 4. The Machine Learning Service (`ml-service`)
The AI Risk Engine is a decoupled FastAPI Python service. It provides predictive analytics without bogging down the Node.js transaction server.

### Endpoints
*   `POST /train`: Trains the machine learning model. It accepts either synthetic data (generating 500 fake profiles based on KM literature distributions) or real data (requiring a minimum of 10 manager-validated records to avoid overfitting).
*   `POST /predict`: Predicts the risk tier of an employee based on the 5 risk indicators.
*   `POST /anomaly`: Uses an **Isolation Forest** algorithm to detect if an employee's score change over time is mathematically anomalous compared to normal workforce fluctuations.
*   `GET /metrics` & `GET /feature-importance`: Exposes model health data (Accuracy, Precision, Recall, F1 Score, AUC-ROC) to the HR frontend.

### The Algorithm (Random Forest)
The core predictive model is a **Random Forest Classifier** (`RandomForestClassifier` from `sklearn.ensemble`). 
*   **Features Used:** Expertise Uniqueness (EU), Documentation Gap (DG), Project Criticality (PC), Collaboration Dependency (CD), Tenure (T).
*   **Label:** The target variable is the risk tier (`low`, `medium`, `high`, `critical`) as defined by historical manager validations.
*   **Hyperparameters:** `n_estimators=100`, `max_depth=6`, `min_samples_split=5`, `class_weight="balanced"`.
*   **Validation:** It uses Stratified K-Fold Cross-Validation to ensure the model generalizes well even on small datasets.

---

## 5. The Risk Scoring Engine & Human-in-the-Loop Workflow
The system never relies entirely on AI or entirely on subjective human feelings. It blends three perspectives:

### Step 1: The Baseline Formula
When an assessment is imported, the baseline math is run:
`Baseline Score = (EU × 0.25) + (DG × 0.20) + (PC × 0.20) + (CD × 0.20) + (Tenure × 0.15)`

### Step 2: Bias Detection (Acquiescence Flagging)
The system checks if the employee "straight-lined" the survey (e.g., answering "5" to every question, even reverse-coded ones). If detected, it applies a **Confidence Discount**, warning the manager that the self-assessment is mathematically unreliable.

### Step 3: Final Blending (The Final Risk Tier)
If the manager has NOT validated the score:
`Final Score = (Employee Baseline × 0.70) + (ML Prediction × 0.30)`

If the manager HAS validated the score (Standard Workflow):
`Final Score = (Employee Baseline × 0.30) + (Manager Validation × 0.50) + (ML Prediction × 0.20)`

**Academic Defense:** The AI is capped at 20% to prevent **Automation Bias** (where humans blindly trust machines). The manager retains 50% authority to ensure ethical human oversight in HR decisions.

---

## 6. Advanced System Features
1.  **AHP Policy Calibration Matrix:** If an organization disagrees with the baseline formula (e.g., they believe Documentation is more important than Expertise), HR can use the Analytic Hierarchy Process (AHP) matrix in the frontend to conduct 1-on-1 factor comparisons. The system mathematically derives new percentage weights for the baseline formula.
2.  **Model Governance (AI Observability):** The system tracks the F1 score and AUC-ROC of the ML model. It includes an "AI Attribution vs. Business Policy" chart, allowing HR to see if the AI's logic (Feature Importance) deviates from the company's official AHP policy.
3.  **Actionable Mitigation (KT Workflow):** The system doesn't just calculate risk; it mitigates it. Managers create KT Plans, assign backup employees, and review physical evidence of knowledge transfer. Background Cron jobs run on the Node.js server to email overdue alerts.
