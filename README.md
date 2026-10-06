# KnowledgeGuard

**Identify knowledge-loss risk, validate it with managers, and reduce single-person dependency through evidence-based knowledge transfer.**

KnowledgeGuard is a final-year research prototype that helps organisations understand where important work knowledge depends on individual employees. It combines quarterly questionnaires, transparent risk scoring, manager judgement and optional machine learning, then tracks Knowledge Transfer (KT) through evidence review and sign-off.

It is a decision-support tool—not a resignation predictor, performance appraisal or replacement for human judgement.

## Core capabilities

- Quarterly assessments, questionnaire-to-indicator mapping and historical risk scores.
- Role-based dashboards, manager validation and High/Critical risk prioritisation.
- KT plans covering documentation, shadowing, interviews, backup competence and sign-off.
- Evidence submission, dual attendance confirmations and manager approvals.
- Auditable before/after risk indicators, one-time mitigation per plan and transactional rollback.
- Optional AI explanations, interview questions and improvement tips.
- In-app notifications, optional email, research exports, AHP weighting and SUS/TAM analysis.

## Architecture

The frontend calls the backend API. The backend stores records in MongoDB and calls the ML service and optional Groq AI service.

| Directory | Stack | Purpose |
|---|---|---|
| `frontend/` | React, Vite, Tailwind CSS, React Query | Role-based interface |
| `backend/` | Node.js, Express, Mongoose, JWT, Socket.IO | Authentication, scoring, workflows and notifications |
| `ml-service/` | Python, FastAPI, scikit-learn | Random Forest predictions, metrics and anomaly detection |
| `test_data/` | Synthetic CSV fixtures | Repeatable demonstrations, not collected research responses |

## Install and configure

### Prerequisites

- Node.js 20+ and npm.
- Python 3.11 or 3.12 and pip.
- MongoDB Atlas, or a local MongoDB **replica set**. KT transactions do not work with a standalone MongoDB instance.
- Optional: Groq API credentials for AI and a Gmail App Password for email.

Clone or download the repository and open a terminal in its root. Commands below use Windows PowerShell. On macOS/Linux, use `python3 -m venv .venv` and `source .venv/bin/activate` for Python setup.

### 1. Install dependencies

From the repository root:

```powershell
cd backend
npm ci
cd ..

cd frontend
npm ci
cd ..

cd ml-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

For Python 3.12, substitute `py -3.12`. If PowerShell blocks activation, run commands with `.venv\Scripts\python.exe` directly rather than changing system-wide execution policy.

### 2. Create environment files

From the repository root, copy templates **only if you do not already have environment files**:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Edit `backend/.env`:

```dotenv
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER/knowledgeguard?retryWrites=true&w=majority
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
ML_SERVICE_URL=http://localhost:8000
ML_API_KEY=REPLACE_WITH_A_SHARED_RANDOM_SECRET

# Optional integrations
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
GMAIL_USER=
GMAIL_PASS=
```

Use your own database name, credentials and strong secrets. In Atlas, configure a database user and network access for your backend machine. URL-encode special characters in connection-string credentials.

Edit `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Set the same `ML_API_KEY` in the ML process environment, as shown below. The ML service does **not** automatically load a local `.env` file.

AI and email are optional. Without credentials, assessment and KT remain available, but AI responses and outbound email do not work. If changing `GROQ_MODEL`, select a model accessible to your account.

## Start the system

Open three terminals, each starting in the repository root.

**Terminal 1 — ML service**

```powershell
cd ml-service
.\.venv\Scripts\Activate.ps1
$env:ML_API_KEY = 'YOUR_SHARED_RANDOM_SECRET'
python -m uvicorn main:app --reload --port 8000
```

On macOS/Linux, set the key with `export ML_API_KEY='YOUR_SHARED_RANDOM_SECRET'`.

**Terminal 2 — backend**

```powershell
cd backend
npm run dev
```

**Terminal 3 — frontend**

```powershell
cd frontend
npm run dev
```

| Service | Local address |
|---|---|
| Application | http://localhost:5173 |
| Backend health | http://localhost:5000/api/health |
| ML health | http://localhost:8000/health |
| ML API documentation | http://localhost:8000/docs |

Without a saved model, the first prediction trains a synthetic demonstration model. If ML prediction fails, the backend substitutes the formula score. Synthetic output is not proof of real-world predictive accuracy.

## Create your own installation

Use a fresh database. Set these values in `backend/.env`:

```dotenv
ADMIN_EMAIL=youradmin@example.com
ADMIN_PASSWORD=REPLACE_WITH_A_STRONG_UNIQUE_PASSWORD
```

From the repository root:

```powershell
cd backend
npm run seed:admin
```

This creates an admin without deleting existing data. If the email already exists, it does not reset that account. Without overrides, development defaults are `admin@knowledgeguard.local` / `Admin1234`; never use them on a public deployment.

Log in, change the password, create managers and employees, assign reporting relationships and configure the quarterly assessment period.

## Run a demo

Use a **separate disposable database** with the services running:

```powershell
cd backend
npm run seed
```

The seed creates an admin, HR analyst, researcher, four managers and one employee with a current-quarter assessment and calculated score. It removes existing user accounts ending in `@knowledgeguard.demo`. Do not run it against a working installation or repeatedly reseed an established demo: associated historical records may remain.

All seeded accounts use password `Demo1234`.

| Role | Login |
|---|---|
| Admin | `admin@knowledgeguard.demo` |
| HR analyst | `hr@knowledgeguard.demo` |
| Researcher | `researcher@knowledgeguard.demo` |
| Manager | `sarah@knowledgeguard.demo` |
| Employee | `mohamed@knowledgeguard.demo` |

Additional managers: `david@knowledgeguard.demo`, `michael@knowledgeguard.demo`, `emma@knowledgeguard.demo`.

For a larger quarterly demonstration, sign in as admin and import:

1. `test_data/01_users.csv` through user import.
2. `test_data/02_employee_assessments_Q1.csv` through employee assessment import, selecting the matching quarter.
3. `test_data/03_manager_validations_Q1.csv` through manager validation import for the same quarter.
4. Repeat the matching Q2–Q4 files as needed, checking imported/skipped counts.

Download in-app CSV templates for your own data. Assessment records must match existing employee accounts; do not invent identities to link anonymous research responses.

The minimal seed has only one employee. Add or import a suitable backup before demonstrating KT.

## How the workflow works

1. **Set up:** Admin creates users; Admin/HR configures assessment periods and questionnaire links.
2. **Assess:** Employees complete the quarterly questionnaire; Admin/HR imports responses. Missing or unrecognised scoring answers are rejected rather than silently assigned neutral scores.
3. **Validate:** Managers review indicators; the system combines self-assessment, manager judgement and available ML support.
4. **Plan:** A manager selects a High/Critical holder and suitable backup, then creates a KT plan.
5. **Transfer:** The holder submits documentation. Both participants confirm shadowing/interview attendance and provide session evidence.
6. **Verify:** The manager approves evidence and rates backup competence. Significant gaps or an unready backup prevent successful sign-off.
7. **Sign off:** Completed prerequisites allow final approval. Plan completion, indicator changes and the new score commit together; a save failure rolls them back.
8. **Monitor:** Review the before/after result and subsequent quarterly assessments.

For a demonstration, show the initial validated score, complete each KT activity using its assigned accounts, then compare indicators after sign-off. Successful KT does not automatically mean Low risk.

## Scoring and KT mitigation

Five indicators represent exposure: Expertise Uniqueness (EU), Documentation Gap (DG), Project Criticality (PC), Collaboration Dependency (CD) and Tenure (T).

Default scoring:

```text
F = 0.25 EU + 0.20 DG + 0.20 PC + 0.20 CD + 0.15 T

Before manager validation: Final = 0.70 F + 0.30 ML
After manager validation:  Final = 0.30 F + 0.50 Manager + 0.20 ML
```

`Manager` is the formula applied to manager-reviewed indicators. AHP settings can replace default weights. Tenure derives from the employee's start date: under 2 years → 2; 2–under 5 → 5; 5–under 10 → 7; 10+ → 10.

Backend final-score tiers:

| Tier | Score |
|---|---|
| Low | ≤ 5.0 |
| Medium | > 5.0 to 7.5 |
| High | > 7.5 to 9.0 |
| Critical | > 9.0 |

Fully competent KT can reduce EU by 3, DG by 3 and CD by 2; minor competence gaps use smaller EU/CD reductions. Indicators cannot fall below 1. PC and tenure remain unchanged.

Sign-off updates applicable self/manager indicators on the latest assessment, recalculates that quarter's score and stores a mitigation trace. A plan cannot apply reductions twice. AI tips alone never reduce scores.

These are prototype mitigation rules, not measurements proving knowledge retention. Remaining exposure can keep an employee at Medium or High after completion.

## Verification

From `backend/`:

```powershell
npm run test:workflow
npm run test:ahp
npm run test:ai
```

From `frontend/`:

```powershell
npm run test:ahp
npm run test:ai
npm run build
```

Optional authenticated API and database-transaction verification, from `backend/`:

```powershell
npm run verify:isolated-db
```

This opt-in script uses your configured MongoDB server but creates a uniquely named temporary database, verifies it is empty and deletes only that test database after the run. Database creation/deletion permissions are required. ML and external AI/notifications are stubbed: it verifies authentication, business rules, persistence and rollback—not live integrations or browser usability.

## Troubleshooting

| Symptom | Check |
|---|---|
| Database connection fails | URI, credentials, Atlas network access and backend logs |
| KT transaction error | Use Atlas or a correctly configured local replica set |
| Frontend cannot reach API | Backend is running; frontend API URL is correct; restart Vite after environment changes |
| AI unavailable | Groq key, model access, quota and backend logs |
| ML rejects requests | Matching ML API keys, correct service URL and running ML process |
| Model cannot load | Python/package compatibility and ML logs; preserve required model/metrics evidence before retraining |
| CSV rows skipped | Existing account emails, matching quarter, recognised headers and complete answers |
| KT blocked | Holder eligibility, backup suitability, evidence, confirmations, approvals and competence |

Backend health service flags indicate configuration—not successful external requests. Check ML health separately and test optional integrations explicitly.

## Deployment and security

This is a research prototype. Review security, privacy, access controls and backups before processing real organisational data.

- Deploy frontend, backend and ML as separate services. Build with `npm run build` and serve frontend `dist/` with SPA fallback routing.
- Set `VITE_API_URL` and `VITE_SOCKET_URL` to the deployed backend **before building**. Never put secrets in `VITE_*` variables: browsers can read them.
- Run backend with `npm start`; configure `NODE_ENV=production`, actual `FRONTEND_URL`, a strong JWT secret and a private database connection string.
- Set backend `ML_SERVICE_URL` and matching strong `ML_API_KEY` values on both services. Restrict ML network access.
- Run ML from `ml-service/` with `python -m uvicorn main:app --host 0.0.0.0 --port YOUR_PORT`, without `--reload`. Use persistent storage for model/metrics files if needed across deployments.
- Use HTTPS, unique admin credentials and transaction-capable MongoDB. Verify deployed cookie, proxy, CORS and Socket.IO behaviour.
- Never commit credentials, `.env`, real participant data, `node_modules/`, virtual environments or caches. Install dependencies on your host; static hosting requires the built frontend assets.
- Keep demo accounts and synthetic fixtures out of production. Obtain appropriate consent and minimise identifiable/confidential inputs.

Start a new installation with a fresh database and `seed:admin`; demo seeding is not a production setup step.


