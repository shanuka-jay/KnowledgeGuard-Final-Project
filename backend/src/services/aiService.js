/**
 * AI Service — powered by Groq API with a configurable text model
 * Free API key from console.groq.com
 *
 * Five AI features:
 * 1. explainRisk          — plain English risk explanation for managers
 * 2. generateKTQuestions  — bespoke interview questions from employee profile
 * 3. generateSuggestions  — personalised improvement tips for employees
 * 4. chatWithTeamData     — natural language queries about team risk
 * 5. generateReport       — AI-written management summary
 */

const Groq = require('groq-sdk');

// Use a verified text model; Compound is not available to every Groq account.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

function createGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error('AI service is not configured.');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 30000, maxRetries: 1 });
}

// ─── Helper: call Groq ────────────────────────────────────────
async function callGroq(systemPrompt, userPrompt, maxTokens = 1000) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('AI service is not configured. Add GROQ_API_KEY to backend/.env and restart the backend.');
  }

  const groq = createGroqClient();
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
  });
  return response.choices[0]?.message?.content || '';
}

// ─── 1. Explain risk in plain English ────────────────────────
async function explainRisk(employee, riskScore) {
  const systemPrompt = `You are a knowledge management analyst writing brief, clear risk explanations for managers.
Write 2-3 sentences maximum. Be specific about which indicators are driving the risk. 
Be professional and actionable — not alarming. Do not use jargon or technical terms.`;

  const userPrompt = `Employee: ${employee.name}
Role: ${employee.department || 'Not specified'}
Risk Tier: ${riskScore.tier}
Final Score: ${riskScore.finalScore?.toFixed(1) || 'N/A'}/10
Top indicators (1-10, higher = more risk):
- Expertise Uniqueness: ${riskScore.breakdown?.expertiseUniqueness || 'N/A'}/10
- Documentation Gap: ${riskScore.breakdown?.documentationGap || 'N/A'}/10
- Project Criticality: ${riskScore.breakdown?.projectCriticality || 'N/A'}/10
- Collaboration Dependency: ${riskScore.breakdown?.collaborationDependency || 'N/A'}/10
- Tenure Score: ${riskScore.breakdown?.tenure || 'N/A'}/10
Knowledge tags: ${employee.knowledgeTags?.join(', ') || 'None specified'}

Write a brief explanation for the manager.`;

  return await callGroq(systemPrompt, userPrompt, 300);
}

// ─── 2. Generate KT interview questions ──────────────────────
async function generateKTQuestions(employee) {
  const systemPrompt = `You are a knowledge management specialist who creates knowledge transfer interview questions.
Generate exactly 12 specific, targeted questions for extracting tacit knowledge from this employee.
Return ONLY a valid JSON array. No markdown, no preamble, no explanation.
Format: [{"question": "...", "rationale": "...", "knowledgeArea": "..."}]`;

  const userPrompt = `Employee: ${employee.name}
Department: ${employee.department}
Knowledge tags: ${employee.knowledgeTags?.join(', ') || 'General'}
Skills: ${employee.skills?.join(', ') || 'Not specified'}
Projects: ${employee.projects?.map(p => p.name).join(', ') || 'Not specified'}
Years of experience: ~${Math.floor((Date.now() - new Date(employee.startDate)) / (1000*60*60*24*365))} years

Generate 12 specific interview questions to extract their tacit knowledge.`;

  let raw = '';
  try {
    raw = await callGroq(systemPrompt, userPrompt, 1500);
    // Strip any markdown code fences if present
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);
    // Return just the question strings for storage
    return parsed.map(q => q.question || q);
  } catch (err) {
    console.warn('KT question parse error — returning raw text:', err.message);
    // Fallback: split by newlines and return as array
    if (raw) return raw.split('\n').filter(line => line.trim().length > 10).slice(0, 12);
    throw err;
  }
}

// ─── 3. Generate improvement suggestions for employee ─────────
async function generateSuggestions(employee, riskScore) {
  const systemPrompt = `You are a helpful career coach helping employees reduce their knowledge loss risk score.
Generate 3-5 specific, actionable suggestions.
Return ONLY a valid JSON array. No markdown, no preamble.
Format: [{"tip": "...", "action": "...", "indicator": "...", "estimatedReduction": 0.0}]
estimatedReduction should be a realistic number between 0.3 and 2.0 points.`;

  const userPrompt = `Employee name: ${employee.name}
Their current indicator scores (1-10):
- Expertise Uniqueness: ${riskScore.breakdown?.expertiseUniqueness}/10 (weight: 25%)
- Documentation Gap: ${riskScore.breakdown?.documentationGap}/10 (weight: 20%)
- Project Criticality: ${riskScore.breakdown?.projectCriticality}/10 (weight: 20%)
- Collaboration Dependency: ${riskScore.breakdown?.collaborationDependency}/10 (weight: 20%)
Current final score: ${riskScore.finalScore?.toFixed(1)}/10

Generate personalised improvement suggestions targeting the highest-scoring indicators.`;

  try {
    const raw     = await callGroq(systemPrompt, userPrompt, 800);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      { tip: 'Document your key processes', action: 'Write step-by-step guides for your most critical tasks', indicator: 'documentationGap', estimatedReduction: 1.5 },
      { tip: 'Train a colleague', action: 'Schedule knowledge sharing sessions with a team member', indicator: 'expertiseUniqueness', estimatedReduction: 1.2 },
      { tip: 'Update project documentation', action: 'Add README files and process notes to active projects', indicator: 'documentationGap', estimatedReduction: 0.8 },
    ];
  }
}

// ─── 4. Manager chat assistant ────────────────────────────────
async function chatWithTeamData(managerMessage, teamData) {
  const systemPrompt = `You are an intelligent knowledge risk management assistant.
You have access to a manager's team risk data. Answer their question accurately using this data.
Be concise, specific, and actionable. Use the actual names and scores from the data.
Never make up scores or names that are not in the data provided.
Important scoring rule: in KnowledgeGuard, a HIGHER score means HIGHER knowledge-loss risk. A lower score is safer, not worse.
Risk tiers are: low = safest, medium = monitor, high = KT recommended, critical = immediate KT required.
When recommending action, prioritize critical first, then high, then medium. Do not recommend supporting low-score employees unless the user asks for general improvement.

AGENTIC DECISION SUPPORT INSTRUCTION:
If the manager explicitly asks to create a Knowledge Transfer (KT) plan, or if you strongly believe an immediate KT plan is the best next step for a high/critical risk employee, you MUST generate an actionable JSON proposal.
Append the JSON block at the very end of your response, wrapped exactly like this:
\`\`\`action_proposal
{
  "employeeId": "exact string of the employee ID",
  "employeeName": "Name of the employee",
  "backupPersonId": "exact string of the recommended backup ID",
  "backupName": "Name of the backup person",
  "knowledgeAreas": ["Area 1", "Area 2"],
  "priority": "critical or high",
  "deadlineWeeks": 4
}
\`\`\`
Choose the backup person based on overlapping skills or same department. Do NOT make up IDs. Only use the _id provided in the team data.

Always format your text answer with short labeled sections:
Summary:
Key risks:
- ...
Recommended actions:
- ...
Reasoning:
- ...`;

  // Build a concise team summary for the prompt
  const teamSummary = teamData.map(member => {
    const score = member.riskScore;
    return `- ID: ${member._id} | Name: ${member.name} (${member.department}) | Skills: ${member.skills?.join(', ')} | Tags: ${member.knowledgeTags?.join(', ')} | Score: ${score?.finalScore?.toFixed(1) || 'N/A'}/10 | Tier: ${score?.tier || 'unknown'}`;
  }).join('\n');

  const userPrompt = `Team data:
${teamSummary}

Manager's question: ${managerMessage}`;

  return await callGroq(systemPrompt, userPrompt, 600);
}

// ─── 4b. Manager chat assistant (Streaming & Memory) ───────────
async function chatWithTeamDataStream(messages, teamData) {
  const groq = createGroqClient();

  const systemPrompt = `You are an intelligent knowledge risk management assistant.
You have access to a manager's team risk data. Answer their question accurately using this data.
Be concise, specific, and actionable. Use the actual names and scores from the data.
Never make up scores or names that are not in the data provided.
Important scoring rule: in KnowledgeGuard, a HIGHER score means HIGHER knowledge-loss risk. A lower score is safer, not worse.
Risk tiers are: low = safest, medium = monitor, high = KT recommended, critical = immediate KT required.

CRITICAL RULE FOR KT PLANS: You MUST NEVER recommend a 'high' or 'critical' risk employee to be a Backup Person for someone else. A backup person MUST be 'low' or 'medium' risk. You should try to find a low/medium risk backup who shares the most 'Tags' or 'Skills' with the employee.

FORMATTING RULE: Use beautiful markdown tables to present comparisons of candidates, and use bold bulleted lists for action plans.
AGENTIC DECISION SUPPORT INSTRUCTIONS:
1. If the manager explicitly asks to create a Knowledge Transfer (KT) plan, you MUST generate an actionable JSON proposal. Append the JSON block at the very end of your response, wrapped exactly like this:
\`\`\`action_proposal
{
  "employeeId": "exact string of the employee ID",
  "employeeName": "Name of the employee",
  "backupPersonId": "exact string of the recommended backup ID",
  "backupName": "Name of the backup person",
  "knowledgeAreas": ["Area 1", "Area 2"],
  "priority": "critical or high",
  "deadlineWeeks": 4
}
\`\`\`
2. If the manager explicitly asks to VALIDATE an employee's score, change an indicator (like documentation gap, expertise uniqueness, etc.), you MUST generate an actionable JSON proposal. Append the JSON block at the very end of your response, wrapped exactly like this:
\`\`\`action_validate
{
  "employeeId": "exact string of the employee ID",
  "employeeName": "Name of the employee",
  "expertiseUniqueness": 5,
  "documentationGap": 5,
  "projectCriticality": 5,
  "collaborationDependency": 5,
  "notes": "Validated via AI Assistant"
}
\`\`\`
IMPORTANT: For action_validate, only include the indicators that the manager specifically mentioned modifying (or leave the others at their defaults / previous values).

Always format your text answer with short labeled sections.`;

  const teamSummary = teamData.map(member => {
    const score = member.riskScore;
    return `- ID: ${member._id} | Name: ${member.name} (${member.department}) | Skills: ${member.skills?.join(', ')} | Tags: ${member.knowledgeTags?.join(', ')} | Score: ${score?.finalScore?.toFixed(1) || 'N/A'}/10 | Tier: ${score?.tier || 'unknown'}
      Breakdown: EU:${score?.breakdown?.expertiseUniqueness||5}, DG:${score?.breakdown?.documentationGap||5}, PC:${score?.breakdown?.projectCriticality||5}, CD:${score?.breakdown?.collaborationDependency||5}`;
  }).join('\n');

  // Insert the system prompt, followed by the team data as a system message to preserve context.
  const groqMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: `Current Team data:\n${teamSummary}` },
    // Map the conversation history from frontend
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  return await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: groqMessages,
    stream: true,
  });
}

// ─── 5. Generate management report ───────────────────────────
async function generateReport(teamData, ktSummary) {
  const systemPrompt = `You are a senior knowledge management consultant writing an executive management report.
Write in a professional, structured style. Use clear headings.
Be concise because managers are busy. Focus on risks, priorities, and recommendations.
Important scoring rule: higher score means higher knowledge-loss risk. Lower scores are safer.
Prioritize critical-risk employees first, then high-risk employees. Do not describe lower scores as worse performance.
Do not use markdown tables or markdown heading symbols. Use plain section titles and short bullet lines only.`;

  const criticalCount = teamData.filter(m => m.riskScore?.tier === 'critical').length;
  const highCount     = teamData.filter(m => m.riskScore?.tier === 'high').length;
  const avgScore      = teamData.reduce((sum, m) => sum + (m.riskScore?.finalScore || 0), 0) / (teamData.length || 1);

  const highRiskList = teamData
    .filter(m => ['high','critical'].includes(m.riskScore?.tier))
    .map(m => `${m.name}: ${m.riskScore?.finalScore?.toFixed(1)}/10 (${m.riskScore?.tier})`)
    .join('\n');

  const userPrompt = `Team summary:
Total employees: ${teamData.length}
Critical risk: ${criticalCount}
High risk: ${highCount}
Average score: ${avgScore.toFixed(1)}/10

High/Critical risk employees:
${highRiskList || 'None currently'}

Active KT plans: ${ktSummary?.active || 0}
Completed KT plans: ${ktSummary?.complete || 0}
Overdue KT plans: ${ktSummary?.overdue || 0}

Write a management report with these sections:
1. Executive Summary
2. Key Risk Findings
3. High Risk Employees (table format)
4. Knowledge Transfer Plan Status
5. Immediate Recommendations`;

  return await callGroq(systemPrompt, userPrompt, 1500);
}

module.exports = {
  explainRisk,
  generateKTQuestions,
  generateSuggestions,
  chatWithTeamData,
  chatWithTeamDataStream,
  generateReport,
};
