const INDICATORS = [
  'Expertise Uniqueness',
  'Documentation Gap',
  'Project Criticality',
  'Collaboration Dependency',
  'Tenure',
]

const PAIRS = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 2], [1, 3], [1, 4],
  [2, 3], [2, 4],
  [3, 4],
]

// The form uses 1 = favour the left item, 5 = equal,
// 9 = favour the right item. AHP needs left/right ratios.
const FORM_TO_AHP_RATIO = [9, 7, 5, 3, 1, 1 / 3, 1 / 5, 1 / 7, 1 / 9]

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      if (field !== '') throw new Error('Invalid CSV quotation.')
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some(value => value.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (quoted) throw new Error('Unclosed quoted field in CSV.')
  row.push(field)
  if (row.some(value => value.trim() !== '')) rows.push(row)
  return rows
}

function normalizeHeader(value) {
  return value.replace(/^\uFEFF/, '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function formAnswerToAhpRatio(answer) {
  const value = Number(String(answer).trim())
  if (!Number.isInteger(value) || value < 1 || value > 9) {
    throw new Error('Pairwise answers must be whole numbers from 1 to 9.')
  }
  return FORM_TO_AHP_RATIO[value - 1]
}

export function parseRawAHPGoogleFormsCsv(text) {
  const rows = parseCsv(text)
  if (rows.length < 2) throw new Error('The CSV must contain a header and at least one response.')

  const headers = rows[0].map(normalizeHeader)
  const columns = PAIRS.map(([left, right]) => {
    const label = `Compare: ${INDICATORS[left]} vs. ${INDICATORS[right]}`
    const matching = headers.flatMap((header, index) => header === normalizeHeader(label) ? [index] : [])
    if (matching.length !== 1) throw new Error(`Expected exactly one column named "${label}".`)
    return matching[0]
  })

  const logSums = Array(PAIRS.length).fill(0)
  rows.slice(1).forEach((row, responseIndex) => {
    columns.forEach((column, pairIndex) => {
      try {
        logSums[pairIndex] += Math.log(formAnswerToAhpRatio(row[column] ?? ''))
      } catch (error) {
        throw new Error(`Response row ${responseIndex + 2}, ${INDICATORS[PAIRS[pairIndex][0]]} vs. ${INDICATORS[PAIRS[pairIndex][1]]}: ${error.message}`)
      }
    })
  })

  const matrix = Array.from({ length: INDICATORS.length }, (_, index) =>
    Array.from({ length: INDICATORS.length }, (_, other) => index === other ? 1 : 0),
  )
  PAIRS.forEach(([left, right], index) => {
    const ratio = Math.exp(logSums[index] / (rows.length - 1))
    matrix[left][right] = ratio
    matrix[right][left] = 1 / ratio
  })

  return { matrix, responseCount: rows.length - 1 }
}
