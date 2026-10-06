const googleAssessmentQuestions = [
  {
    key: 'backup_coverage',
    indicator: 'expertiseUniqueness',
    label: 'How many other people can complete your main work without your help?',
    options: '1=Three or more, 3=One or two, 5=No one currently',
    score: value => mapOption(value, {
      'three or more': 2, '3 or more': 2, many: 2,
      'one or two': 6, '1 or 2': 6, few: 6,
      'no one': 10, none: 10,
    }),
  },
  {
    key: 'help_frequency',
    indicator: 'collaborationDependency',
    label: 'How often do others ask you for help to continue this work?',
    options: '1=Rarely, 3=Sometimes, 5=Very often',
    score: value => mapOption(value, {
      rarely: 2, sometimes: 5, often: 8, 'very often': 10, daily: 10,
    }),
  },
  {
    key: 'documentation_readiness',
    indicator: 'documentationGap',
    label: 'If you are unavailable tomorrow, how ready is the documentation for someone else to follow?',
    options: '1=Complete and updated, 3=Partly ready, 5=Not ready',
    score: value => mapOption(value, {
      complete: 2, updated: 2, partly: 6, partial: 6, 'not ready': 10, missing: 10,
    }),
  },
  {
    key: 'project_impact',
    indicator: 'projectCriticality',
    label: 'If this work stops for one week, how serious is the operational impact?',
    options: '1=Low, 3=Moderate, 5=Severe',
    score: value => mapOption(value, {
      low: 2, minor: 2, moderate: 6, medium: 6, severe: 10, critical: 10, high: 9,
    }),
  },
  {
    key: 'handover_difficulty',
    indicator: 'expertiseUniqueness',
    label: 'How difficult would it be to train a backup person for your main responsibilities?',
    options: '1=Easy, 3=Moderate, 5=Very difficult',
    score: value => mapOption(value, {
      easy: 2, moderate: 6, difficult: 8, 'very difficult': 10,
    }),
  },
  {
    key: 'knowledge_location',
    indicator: 'documentationGap',
    label: 'Where is most of the knowledge needed for this work currently stored?',
    options: '1=Shared documents/system, 3=Mixed, 5=Mostly in my experience',
    score: value => mapOption(value, {
      shared: 2, documents: 2, system: 2, mixed: 6, experience: 10, memory: 10,
    }),
  },
  {
    key: 'dependency_spread',
    indicator: 'collaborationDependency',
    label: 'How many active tasks, people, or teams depend on your knowledge each week?',
    options: '1=Very few, 3=Several, 5=Many',
    score: value => mapOption(value, {
      'very few': 2, few: 3, several: 6, many: 10,
    }),
  },
  {
    key: 'business_criticality',
    indicator: 'projectCriticality',
    label: 'How important is your main work to service continuity, compliance, revenue, or customer delivery?',
    options: '1=Low, 3=Important, 5=Mission critical',
    score: value => mapOption(value, {
      low: 2, important: 7, mission: 10, critical: 10,
    }),
  },
];

// Expanded Multi-Quarter Dictionary Mapping
// Maps full question text substrings to indicator and polarity (direct/reverse)
const multiQuarterDictionary = [
  // Q1: Routine Workflows
  { snippet: 'complete your complex deliverables without calling you', indicator: 'expertiseUniqueness', isReverse: false, map: { '3+': 2, '1-2': 6, 'nobody': 10 } },
  { snippet: 'steep is the learning curve', indicator: 'expertiseUniqueness', isReverse: false, map: { '<1 month': 2, '1-3 months': 6, '>6 months': 10 } },
  { snippet: 'step-by-step standard operating procedures', indicator: 'documentationGap', isReverse: false, map: { 'fully': 2, 'partial': 6, 'unwritten': 10 } },
  { snippet: 'percentage of your tasks could they finish', indicator: 'documentationGap', isReverse: false, map: { '>80%': 2, '40-79%': 6, '<40%': 10 } },
  { snippet: 'deliverables stall for 48 hours', indicator: 'projectCriticality', isReverse: false, map: { 'minor': 2, 'noticeable': 6, 'critical': 10 } },
  { snippet: 'customer slas, compliance audits', indicator: 'projectCriticality', isReverse: false, map: { 'low': 2, 'significant': 6, 'mission': 10 } },
  { snippet: 'halt their own work while waiting', indicator: 'collaborationDependency', isReverse: false, map: { 'rarely': 2, '2-3': 6, 'daily': 10 } },
  { snippet: 'depend on your personal clearance', indicator: 'collaborationDependency', isReverse: false, map: { '1-2': 2, '3-5': 6, '6+': 10 } },
  { snippet: 'peer in my department could step in', indicator: 'expertiseUniqueness', isReverse: true, map: { 'strongly agree': 2, 'neutral': 6, 'strongly disagree': 10 } },
  { snippet: 'troubleshooting procedures for my work are published', indicator: 'documentationGap', isReverse: true, map: { 'strongly agree': 2, 'neutral': 6, 'strongly disagree': 10 } },

  // Q2: Crisis / Continuity
  { snippet: 'urgent production incident', indicator: 'expertiseUniqueness', isReverse: false, map: { 'several': 2, '1 backup': 6, 'only me': 10 } },
  { snippet: 'unwritten historical experience', indicator: 'expertiseUniqueness', isReverse: false, map: { 'mostly documented': 2, 'equal mix': 6, 'mental experience': 10 } },
  { snippet: 'high-pressure emergency', indicator: 'documentationGap', isReverse: false, map: { 'tested': 2, 'outdated': 6, 'non-existent': 10 } },
  { snippet: 'reference documentation revised', indicator: 'documentationGap', isReverse: false, map: { 'within 24h': 2, 'when time permits': 6, 'rarely': 10 } },
  { snippet: 'unresolved breakdown occurs', indicator: 'projectCriticality', isReverse: false, map: { 'negligible': 2, 'moderate': 6, 'severe': 10 } },
  { snippet: 'single-point-of-failure infrastructure', indicator: 'projectCriticality', isReverse: false, map: { 'standard': 2, 'high compliance': 6, 'zero-tolerance': 10 } },
  { snippet: 'off-hours or pto', indicator: 'collaborationDependency', isReverse: false, map: { 'never': 2, 'occasionally': 6, 'frequently': 10 } },
  { snippet: 'uninterrupted leave', indicator: 'collaborationDependency', isReverse: false, map: { 'no delay': 2, 'minor': 6, 'significant': 10 } },
  { snippet: 'redundancy, so my absence during an emergency', indicator: 'expertiseUniqueness', isReverse: true, map: { 'strongly agree': 2, 'neutral': 6, 'strongly disagree': 10 } },
  { snippet: 'external contractor or peer could resolve an incident', indicator: 'documentationGap', isReverse: true, map: { 'strongly agree': 2, 'neutral': 6, 'strongly disagree': 10 } },

  // Q3: Architecture / Change
  { snippet: 'architecture designs or core system logic', indicator: 'expertiseUniqueness', isReverse: false, map: { 'shared across': 2, 'shared with 1': 6, 'solely': 10 } },
  { snippet: 'hire and train a replacement', indicator: 'expertiseUniqueness', isReverse: false, map: { 'under 4 weeks': 2, '1-3 months': 6, '4+ months': 10 } },
  { snippet: 'architecture decision records', indicator: 'documentationGap', isReverse: false, map: { '100%': 2, 'partial': 6, 'tribal': 10 } },
  { snippet: 'deploy or configure your modules from scratch', indicator: 'documentationGap', isReverse: false, map: { 'automated': 2, 'has gaps': 6, 'broken': 10 } },
  { snippet: 'fail a release deadline', indicator: 'projectCriticality', isReverse: false, map: { 'minor': 2, 'affects team': 6, 'blocks major': 10 } },
  { snippet: 'data sensitivity, security governance', indicator: 'projectCriticality', isReverse: false, map: { 'internal only': 2, 'high business': 6, 'critical core': 10 } },
  { snippet: 'architecture/technical consultation requests', indicator: 'collaborationDependency', isReverse: false, map: { '0-2': 2, '3-7': 6, '8+': 10 } },
  { snippet: 'mandatory reviewer or gatekeeper', indicator: 'collaborationDependency', isReverse: false, map: { 'standard': 2, 'one of two': 6, 'sole required': 10 } },
  { snippet: 'architectural knowledge required for my systems is thoroughly democratized', indicator: 'expertiseUniqueness', isReverse: true, map: { 'strongly agree': 2, 'neutral': 6, 'strongly disagree': 10 } },
  { snippet: 'design specifications and decision logs are searchable', indicator: 'documentationGap', isReverse: true, map: { 'strongly agree': 2, 'neutral': 6, 'strongly disagree': 10 } },

  // Q4: Knowledge Transfer
  { snippet: 'successfully paired or shadowed', indicator: 'expertiseUniqueness', isReverse: false, map: { 'fully': 2, 'started': 6, 'no cross-training': 10 } },
  { snippet: 'tribal history', indicator: 'expertiseUniqueness', isReverse: false, map: { 'very little': 2, 'moderate': 6, 'extensive': 10 } },
  { snippet: 'find answers without needing 1-on-1', indicator: 'documentationGap', isReverse: false, map: { 'self-service': 2, 'occasional': 6, 'constant': 10 } },
  { snippet: 'repositories structured, indexed, and audited', indicator: 'documentationGap', isReverse: false, map: { 'regularly': 2, 'ad-hoc': 6, 'disorganized': 10 } },
  { snippet: 'transitioned off the team', indicator: 'projectCriticality', isReverse: false, map: { '<10%': 2, '10-35%': 6, '>50%': 10 } },
  { snippet: 'strategic roadmap goals', indicator: 'projectCriticality', isReverse: false, map: { 'standard': 2, 'strategic': 6, 'pillar': 10 } },
  { snippet: 'mentor or technical anchor', indicator: 'collaborationDependency', isReverse: false, map: { '0-1': 2, '2-3': 6, '4+': 10 } },
  { snippet: 'cross-functional meetings require your presence', indicator: 'collaborationDependency', isReverse: false, map: { 'rarely': 2, 'sometimes': 6, 'almost always': 10 } },
  { snippet: 'active knowledge shadowing', indicator: 'expertiseUniqueness', isReverse: true, map: { 'strongly agree': 2, 'neutral': 6, 'strongly disagree': 10 } },
  { snippet: 'onboarding guides contain everything a new hire needs', indicator: 'documentationGap', isReverse: true, map: { 'strongly agree': 2, 'neutral': 6, 'strongly disagree': 10 } },
];

function normaliseHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getValue(row, names) {
  const wanted = names.map(normaliseHeader);
  const found = Object.keys(row).find(key => wanted.includes(normaliseHeader(key)));
  return found ? row[found] : undefined;
}

function getEmail(row) {
  return String(getValue(row, ['email', 'Email', 'Email Address', 'participant_email', 'employee_email', 'employee_email_being_validated', 'Employee email being validated']) || '')
    .trim()
    .toLowerCase();
}

function clampScore(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const score = Number(value);
  if (!Number.isFinite(score) || score < 1 || score > 10) return null;
  return score;
}

function surveyRating(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(1, Math.min(5, score));
}

function mapOption(value, labels) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const direct = Number(value);
  if (Number.isFinite(direct)) return direct >= 1 && direct <= 5 ? direct * 2 : clampScore(value);
  const text = String(value).toLowerCase().replace(/[\u2013\u2014]/g, '-').trim();
  const effective = labels['strongly agree'] !== undefined
    ? { ...labels, agree: 4, disagree: 8 } : labels;
  // Longest labels first: "disagree" must not match "agree"; "very few"
  // must not match "few". Reverse Likert options now cover all five answers.
  const match = Object.entries(effective).sort((a, b) => b[0].length - a[0].length)
    .find(([label]) => text.includes(label));
  return match ? match[1] : null;
}

function average(values, fallback = 5) {
  const valid = values.filter(v => Number.isFinite(v));
  if (!valid.length) return fallback;
  return parseFloat((valid.reduce((sum, v) => sum + v, 0) / valid.length).toFixed(2));
}

function directScore(row, keys) {
  const value = getValue(row, keys);
  if (value === undefined) return null;
  const score = clampScore(value);
  if (score === null) throw new Error(`Invalid 1-10 indicator value for ${keys[0]}`);
  return score;
}

function matchQuarterQuestion(header) {
  const normalized = normaliseHeader(header);
  const q1ExportHeaders = [
    'Q1 Other people can complete complex deliverables', 'Q2 Learning curve',
    'Q3 SOP availability/currentness', 'Q4 Tasks completed using documentation',
    'Q5 Impact if key deliverables stall 48 hours', 'Q6 Connection to SLA/compliance/revenue/service continuity',
    'Q7 Colleagues halt work waiting for knowledge/decision', 'Q8 Colleagues/teams depending on clearance/input',
    'Q9 Peer could step in without substantial assistance', 'Q10 Troubleshooting procedures published/current/searchable',
  ];
  const exportedIndex = q1ExportHeaders.findIndex(value => normaliseHeader(value) === normalized);
  if (exportedIndex >= 0) return multiQuarterDictionary[exportedIndex];
  const match = multiQuarterDictionary.find(dict => normalized.includes(normaliseHeader(dict.snippet)));
  if (match) return match;
  // The revised real Q1 form adds "available" to the documentation question.
  if (normalized.includes('percentage_of_your_tasks') && normalized.includes('without_your_help')) return multiQuarterDictionary[3];
  return null;
}

function getQuestionValue(row, question) {
  return getValue(row, [
    question.key,
    question.label,
    `${question.key}_${question.label}`,
    `${question.indicator}_${question.key}`,
  ]);
}

function stdDev(array) {
  if (!array || array.length === 0) return 0;
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

function analyzeResponseBias(row, indicatorValues) {
  const allScores = [];
  const reverseScores = { expertiseUniqueness: [], documentationGap: [] };
  const directScores = { expertiseUniqueness: [], documentationGap: [] };
  
  Object.keys(row).forEach(header => {
    const match = matchQuarterQuestion(header);
    if (match) {
      const val = mapOption(row[header], match.map);
      if (val !== null) {
        allScores.push(val);
        if (match.isReverse) {
          reverseScores[match.indicator].push(val);
        } else {
          directScores[match.indicator] = directScores[match.indicator] || [];
          directScores[match.indicator].push(val);
        }
      }
    }
  });

  const biasFlags = [];
  let straightLining = false;
  let inconsistencyScore = 0;
  let biasScore = 0;
  let confidenceDiscount = 0;

  if (allScores.length >= 4) {
    const sd = stdDev(allScores);
    if (sd < 1.0) {
      straightLining = true;
      biasFlags.push('Acquiescence Pattern Detected (Straight-lining)');
      biasScore += 35;
      confidenceDiscount += 0.2;
    }
  }

  let totalDelta = 0;
  let pairs = 0;
  ['expertiseUniqueness', 'documentationGap'].forEach(ind => {
    if (directScores[ind] && directScores[ind].length > 0 && reverseScores[ind] && reverseScores[ind].length > 0) {
      const directAvg = average(directScores[ind]);
      const reverseAvg = average(reverseScores[ind]);
      const delta = Math.abs(directAvg - reverseAvg);
      totalDelta += delta;
      pairs++;
      
      if (delta >= 4.0) {
        biasFlags.push(`High Contradiction in ${ind === 'expertiseUniqueness' ? 'Uniqueness' : 'Documentation'}`);
        biasScore += 25;
      }
    }
  });
  
  if (pairs > 0) {
    inconsistencyScore = parseFloat((totalDelta / pairs).toFixed(2));
    if (inconsistencyScore > 3.0) confidenceDiscount += 0.15;
  }

  if (indicatorValues.expertiseUniqueness >= 8 && indicatorValues.projectCriticality >= 8 && indicatorValues.documentationGap <= 4) {
      biasFlags.push('Self-Enhancement Risk: High uniqueness but perfect documentation');
      biasScore += 20;
      confidenceDiscount += 0.1;
  }

  return {
    biasScore: Math.min(100, biasScore),
    inconsistencyScore,
    straightLining,
    biasFlags,
    confidenceDiscount: Math.min(0.5, confidenceDiscount)
  };
}

function determineQuarter(row) {
  if (Object.keys(row).some(header => normaliseHeader(header) === 'q1_other_people_can_complete_complex_deliverables')) return 'Q1';
  const headers = Object.keys(row).join(' ').toLowerCase();
  if (headers.includes('routine workflows') || headers.includes('complex deliverables without calling you') || headers.includes('steep is the learning curve')) return 'Q1';
  if (headers.includes('emergency') || headers.includes('urgent production incident') || headers.includes('unwritten historical experience')) return 'Q2';
  if (headers.includes('architecture') || headers.includes('release deadline') || headers.includes('hire and train a replacement')) return 'Q3';
  if (headers.includes('shadowed') || headers.includes('knowledge transfer') || headers.includes('tribal history')) return 'Q4';
  return 'universal';
}

function mapGoogleAssessmentRow(row) {
  const direct = {
    expertiseUniqueness: directScore(row, ['expertise_uniqueness', 'Expertise Uniqueness', 'EU', 'Manager rating: expertise uniqueness', 'manager_rating_expertise_uniqueness', 'Expertise Uniqueness (1-10)']),
    documentationGap: directScore(row, ['documentation_gap', 'Documentation Gap', 'DG', 'Manager rating: documentation gap', 'manager_rating_documentation_gap', 'Documentation Gap (1-10)']),
    projectCriticality: directScore(row, ['project_criticality', 'Project Criticality', 'PC', 'Manager rating: project criticality', 'manager_rating_project_criticality', 'Project Criticality (1-10)']),
    collaborationDependency: directScore(row, ['collaboration_dependency', 'Collaboration Dependency', 'CD', 'Manager rating: collaboration dependency', 'manager_rating_collaboration_dependency', 'Collaboration Dependency (1-10)']),
  };

  const indirect = {};
  
  googleAssessmentQuestions.forEach(question => {
    const answer = getQuestionValue(row, question);
    if (answer === undefined) return;
    const score = question.score(answer);
    if (score === null) throw new Error(`Missing or unrecognized answer for ${question.key}`);
    if (score !== null) {
      indirect[question.indicator] = indirect[question.indicator] || [];
      indirect[question.indicator].push(score);
    }
  });

  Object.keys(row).forEach(header => {
    const match = matchQuarterQuestion(header);
    if (match) {
      const val = mapOption(row[header], match.map);
      if (val === null) throw new Error(`Missing or unrecognized answer for ${header}`);
      if (val !== null) {
        indirect[match.indicator] = indirect[match.indicator] || [];
        indirect[match.indicator].push(val);
      }
    }
  });

  const finalScores = {
    expertiseUniqueness: direct.expertiseUniqueness ?? average(indirect.expertiseUniqueness || [], null),
    documentationGap: direct.documentationGap ?? average(indirect.documentationGap || [], null),
    projectCriticality: direct.projectCriticality ?? average(indirect.projectCriticality || [], null),
    collaborationDependency: direct.collaborationDependency ?? average(indirect.collaborationDependency || [], null),
  };
  for (const [indicator, score] of Object.entries(finalScores)) {
    if (!Number.isFinite(score)) throw new Error(`No recognized answers for ${indicator}; check the questionnaire headers`);
  }

  const isManagerValidation = getValue(row, ['manager_notes', 'Manager notes for validation', 'notes']) !== undefined;

  let biasData = null;
  if (!isManagerValidation) {
    biasData = analyzeResponseBias(row, finalScores);
  }

  const quarterTag = determineQuarter(row);

  return {
    ...finalScores, // Keep flat structure for backwards compatibility
    _metadata: {
      quarterTag,
      biasData,
      rawResponses: row
    }
  };
}

module.exports = {
  googleAssessmentQuestions,
  multiQuarterDictionary,
  getEmail,
  getValue,
  surveyRating,
  mapGoogleAssessmentRow,
};
