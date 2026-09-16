import { Student } from '../types';

export interface SimulationPreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  names: string[];
}

export const SAMPLE_STUDENTS: string[] = [
  '陳冠宇', '林志豪', '張雅筑', '李承翰', '王柏宇',
  '黃詩涵', '趙怡君', '吳彥廷', '周子傑', '蔡佩珊',
  '許家豪', '鄭凱文', '謝佳穎', '劉宇軒', '楊宗翰',
  '柯博文', '何書儀', '曾偉翔', '孫佩芬', '葉正男',
  '彭千惠', '邱建銘', '宋巧玲', '盧奕帆', '江心怡',
  '范庭宇', '田子萱', '蕭偉倫', '廖欣潔', '石家瑋'
];

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'standard',
    title: '標準國中小班級',
    description: '30 位學生，適合大班課堂日常點名、問答抽籤與分組體驗',
    badge: '30人 • 標準班級',
    names: SAMPLE_STUDENTS,
  },
  {
    id: 'science_lab',
    title: '實驗專案小組',
    description: '16 位學生，適合 4 人一組進行科學實驗或專題研討',
    badge: '16人 • 4人均分',
    names: [
      '陳冠宇', '林志豪', '張雅筑', '李承翰',
      '王柏宇', '黃詩涵', '趙怡君', '吳彥廷',
      '周子傑', '蔡佩珊', '許家豪', '鄭凱文',
      '謝佳穎', '劉宇軒', '楊宗翰', '柯博文'
    ],
  },
  {
    id: 'with_duplicates',
    title: '包含重複姓名測試',
    description: '故意混入 4 筆同名同姓學生，快速體驗「重複姓名標記」與「一鍵移除重複」功能',
    badge: '24人 • 含重複姓名',
    names: [
      '陳冠宇', '林志豪', '張雅筑', '李承翰', '王柏宇',
      '陳冠宇', // 重複 1
      '黃詩涵', '趙怡君', '吳彥廷', '林志豪', // 重複 2
      '周子傑', '蔡佩珊', '許家豪', '鄭凱文',
      '王柏宇', // 重複 3
      '謝佳穎', '劉宇軒', '楊宗翰', '柯博文',
      '林志豪', // 重複 4 (第 3 次出現)
      '何書儀', '曾偉翔', '孫佩芬', '葉正男'
    ],
  },
  {
    id: 'activity',
    title: '社團趣味活動',
    description: '12 位學生，適合雙人配對（2人一組）或 3 人小組活動快速試用',
    badge: '12人 • 迷你班',
    names: [
      '陳冠宇', '林志豪', '張雅筑', '李承翰',
      '王柏宇', '黃詩涵', '趙怡君', '吳彥廷',
      '周子傑', '蔡佩珊', '許家豪', '鄭凱文'
    ],
  },
];

/**
 * Parses raw text (pasted or CSV) into an array of student names
 */
export function parseRawStudentText(text: string): string[] {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  // Check if first line appears to be CSV with multiple columns
  const firstLine = lines[0];
  const delimiter = firstLine.includes(',') ? ',' : firstLine.includes('\t') ? '\t' : null;

  if (delimiter) {
    // Determine header column index
    const headers = splitCsvRow(firstLine, delimiter).map(h => h.trim().toLowerCase());
    const nameKeywords = ['姓名', '學生姓名', '學生', '名單', 'name', 'student', 'student name'];
    let nameColIndex = headers.findIndex(h => nameKeywords.some(k => h.includes(k)));

    let startRow = 0;
    if (nameColIndex !== -1) {
      // First row is header
      startRow = 1;
    } else {
      // If no name header found, check column types or default to 1st column (or 2nd column if 1st is numeric ID like 座號)
      const sampleRow = splitCsvRow(lines.length > 1 ? lines[1] : lines[0], delimiter);
      if (sampleRow.length > 1 && /^\d+$/.test(sampleRow[0].trim())) {
        nameColIndex = 1; // Col 0 is number/ID, col 1 is likely name
      } else {
        nameColIndex = 0;
      }
      // Check if row 0 was a header (e.g. "座號,姓名") even if exact keyword wasn't in our list
      if (lines.length > 1 && !/^\d+$/.test(headers[0])) {
        startRow = 1;
      }
    }

    const names: string[] = [];
    for (let i = startRow; i < lines.length; i++) {
      const cols = splitCsvRow(lines[i], delimiter);
      if (cols.length > nameColIndex) {
        const val = cleanName(cols[nameColIndex]);
        if (val) names.push(val);
      }
    }

    if (names.length > 0) {
      return names;
    }
  }

  // Fallback: simple line-by-line, comma, or whitespace splitting
  const rawItems = text
    .split(/[\r\n,;]+/)
    .map(cleanName)
    .filter((n): n is string => n.length > 0);

  return rawItems;
}

function splitCsvRow(row: string, delimiter: string): string[] {
  // Simple CSV splitter that respects double quotes
  const pattern = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
  const result: string[] = [];
  let match;
  while ((match = pattern.exec(row)) !== null) {
    let value = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
    result.push(value ?? '');
    if (pattern.lastIndex === row.length && row.endsWith(delimiter)) {
      result.push('');
    }
  }
  return result;
}

function cleanName(val: string): string {
  return val
    .replace(/^["'\s]+|["'\s]+$/g, '') // trim quotes and outer spaces
    .replace(/\s+/g, ' ') // collapse multi spaces
    .trim();
}

/**
 * Creates full Student objects with unique IDs and preserves index
 */
export function createStudentObjects(names: string[]): Student[] {
  return names.map((name, index) => ({
    id: `std-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    originalIndex: index + 1
  }));
}
