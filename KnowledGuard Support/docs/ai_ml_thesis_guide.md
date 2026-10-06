# KnowledgeGuard AI & ML Architecture Guide (Thesis Cheat Sheet)

If you are writing the technical methodology chapter of your thesis, this document explains exactly how your system uses Artificial Intelligence (AI) and Machine Learning (ML), where the code lives, and how it all connects.

---

## 1. The Big Picture
Your system is divided into **two completely separate** intelligent systems:
1. **The Machine Learning (ML) Engine:** A statistical algorithm that *predicts* risk scores based on data patterns.
2. **The Generative AI (LLM):** A language model (Google Gemini) that *reads* the scores and writes plain-English advice (Improvement Actions).

---

## 2. The Machine Learning (ML) Engine

### What is it?
It is a **Random Forest Regressor** built using Python and the `scikit-learn` library. Random Forest is an "ensemble" algorithm that builds hundreds of mathematical decision trees and averages their predictions to prevent overfitting.

### Where does it live?
It lives in the `ml-service` folder. It runs as a completely independent **FastAPI Python Microservice** on port `8000`.

### What does it do?
It takes 5 input variables (Expertise, Documentation, Project, Collaboration, Tenure) and predicts the final **Knowledge Risk Score (1-10)**.

### How does it connect to the app? (The Flow)
1. An employee submits their self-assessment in the React Frontend.
2. The Node.js Backend (`backend/src/services/scoringEngine.js`) catches it.
3. The Node.js Backend makes a live HTTP request to the Python ML Service: `POST http://localhost:8000/predict`.
4. The Python service runs the numbers through the Random Forest model and returns a predicted score (e.g., `7.4`).
5. The Node.js Backend takes your mathematical formula score (the AHP one) and blends it with the ML score (e.g., Formula = 70%, ML = 30%) to get the final score.

### Your Unique Academic Contribution: "The Cold Start Solution"
Machine Learning requires thousands of rows of data to be accurate. Because your system is new (a "Cold Start"), you don't have enough real data yet. 
**How you solved it:** You implemented **SMOTE / Gaussian Noise Augmentation**. When you click "Train on Augmented Data" in the ML Control panel, your Python script takes the few real assessments you have, adds slight mathematical "jitter" (random noise), and artificially expands the dataset to 500 rows. This allows the Random Forest to train effectively even when the company is small!

---

## 3. The Generative AI System (LLMs)

### What is it?
It is an integration with a Large Language Model (specifically **Google Gemini**). 

### Where does it live?
It lives in the main Node.js Backend, specifically in `backend/src/routes/ai.js`.

### What does it do?
It powers two features:
1. **Automated Improvement Plans:** It looks at an employee's weak points (e.g., high Documentation Gap) and generates a personalized action plan to fix it.
2. **The AI Chatbot:** It allows managers to chat with the system to ask for advice on how to handle risky employees.

### How does it connect to the app? (The Flow)
1. A manager clicks "Generate AI Plan" on an employee's profile.
2. The Node.js backend gathers all the employee's data (Risk Tier, Scores, Department).
3. The backend builds a "Prompt" (a giant block of text) behind the scenes: *"You are an HR expert. Employee John has a high documentation risk of 8/10. Write a plan..."*
4. The backend sends this prompt securely to Google's servers using the `@google/generative-ai` SDK.
5. Google sends back the generated plan, and the backend saves it to your MongoDB database as an "Improvement Action".

---

## 4. How to Write About This in Your Thesis
Use these exact terms to sound highly technical and academic:

* *"To ensure scalability and separation of concerns, the platform utilizes a **microservices architecture**, separating the Node.js transactional backend from the computationally heavy Python FastAPI machine learning service."*
* *"The predictive engine utilizes a **Random Forest Regressor**, a robust ensemble learning method chosen for its resistance to overfitting on non-linear HR data."*
* *"To mitigate the inherent 'Cold Start' problem in new HR deployments, the system employs **Synthetic Data Augmentation via Gaussian Noise injection**, expanding small initial datasets to ensure statistical significance during model training."*
* *"The final Risk Score utilizes an **algorithmic triangulation methodology**, blending deterministic mathematical weights (AHP) with predictive ML outputs to ensure the highest degree of confidence."*
