# Analytic Hierarchy Process (AHP) Implementation in KnowledgeGuard

This document outlines the end-to-end architecture and mathematical logic of the Analytic Hierarchy Process (AHP) module implemented in the KnowledgeGuard system. This serves as a reference for writing the AHP methodology section of the thesis.

## 1. Purpose of AHP in the System
KnowledgeGuard calculates an employee's Knowledge Risk Score using five core indicators:
1. **Expertise Uniqueness (EU)**
2. **Documentation Gap (DG)**
3. **Project Criticality (PC)**
4. **Collaboration Dependency (CD)**
5. **Tenure (T)**

By default, the system uses a static heuristic weighting: `EU (25%)`, `DG (20%)`, `PC (20%)`, `CD (20%)`, `T (15%)`.
However, organizational priorities differ. The AHP module allows HR Analysts and Researchers to **dynamically calibrate** these weights based on pairwise comparisons provided by domain experts.

## 2. Data Collection & Parsing (Consensus Building)
Experts complete a survey (e.g., Google Forms) containing **10 pairwise comparisons** representing every combination of the 5 indicators. They rate relative importance on a standard Saaty scale (1 to 9).

### `AHPValidation.jsx` (Frontend Parsing)
When the HR Analyst uploads the raw CSV of expert responses, the frontend parses the data.
Because multiple experts provide input, the system aggregates their responses into a single consensus matrix using the **Geometric Mean**:

1. For each of the 10 pairwise comparisons, the system extracts the values across all experts.
2. It calculates the sum of the natural logarithms of these values: `sumLogs[idx] += Math.log(val)`
3. It computes the geometric mean: `Math.exp(sumLog / count)`
4. It constructs the upper triangle of the 5x5 matrix using these geometric means.
5. It constructs the lower triangle using the reciprocals (e.g., `1 / geoMeans[0]`).
6. The diagonal is always `1`.

This consensus matrix is then sent to the backend `/api/research/ahp` endpoint.

## 3. Mathematical Engine (Eigenvector & Consistency Ratio)
The backend calculates the final weights and validates the logical consistency of the experts' judgments.

### Step 3.1: Normalization
For each column in the 5x5 matrix, the sum of the values is calculated. Every cell in the matrix is then divided by its respective column sum to create a **Normalized Matrix**.

### Step 3.2: Weight Calculation (Eigenvector)
The final weight for each indicator is calculated as the **average of its corresponding row** in the Normalized Matrix. This yields the Principal Eigenvector, which represents the dynamic percentage weights (e.g., 30%, 25%, 20%, 15%, 10%).

### Step 3.3: Consistency Verification
Human experts can make contradictory judgments (e.g., preferring A over B, B over C, but C over A). AHP measures this using the **Consistency Ratio (CR)**.

1. **Weighted Sum Vector**: The original consensus matrix is multiplied by the new weight vector.
2. **Lambda Vector ($\lambda$)**: Each element of the Weighted Sum Vector is divided by its corresponding weight.
3. **Lambda Max ($\lambda_{max}$)**: The average of the Lambda Vector.
4. **Consistency Index (CI)**: Calculated as `(λmax - n) / (n - 1)`, where `n = 5`.
5. **Consistency Ratio (CR)**: Calculated as `CI / RI`. For a 5x5 matrix, the Random Index (RI) standard is `1.12`.

If `CR < 0.10`, the matrix is mathematically consistent, and the UI allows the HR Analyst to apply the weights. If `CR ≥ 0.10`, the experts' logic is too contradictory, and the system explicitly disables the "Apply" button.

## 4. System Integration & Elasticity (Apply/Rollback)
When a valid AHP model is applied (or rolled back to default), the system executes a highly elastic database operation:

1. **Global Configuration Update**: The new weights (and the `useDynamicWeights` boolean) are saved to the `SystemSettings` MongoDB collection.
2. **Bulk Recalculation Trigger**: The backend immediately queries all active employee assessments for the current period. It loops through every employee and executes the `calculateAndSaveRiskScore` function. This entirely overrides previous static risk scores with the newly calibrated AHP math.
3. **Audit Logging**: The action (`ahp_weights_applied` or `ahp_weights_rolled_back`) is securely logged in the `ActivityLog` collection for thesis transparency and auditing.
4. **Dynamic UI Re-rendering**: The frontend utilizes a React Query cache key (`['systemSettings']`). Upon successful application or rollback, this cache is invalidated. Every dashboard, profile, and formula box (`ScoreTransparency.jsx`) across the entire system instantly re-renders to display the new mathematical formula and a "Dynamic AHP" badge without requiring a browser refresh.
