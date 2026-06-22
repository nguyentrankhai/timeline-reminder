import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import logger from './logger.js';

const GOOGLE_DRIVE_EXPORT = 'https://docs.google.com/spreadsheets/d';

export async function fetchCSV() {
  const url = process.env.GOOGLE_DRIVE_CSV_URL;
  const localPath = process.env.LOCAL_CSV_PATH;

  if (url && url.includes('docs.google.com/spreadsheets')) {
    return await fetchFromGoogleDrive(url);
  }

  if (localPath) {
    return readLocalFile(localPath);
  }

  throw new Error('No CSV source configured. Set GOOGLE_DRIVE_CSV_URL or LOCAL_CSV_PATH.');
}

async function fetchFromGoogleDrive(url) {
  try {
    const exportUrl = convertToExportUrl(url);
    logger.info(`Fetching CSV from: ${exportUrl}`);

    const response = await fetch(exportUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Empty CSV content received');
    }

    return parseCSV(text);
  } catch (error) {
    logger.error(`Failed to fetch CSV from Google Drive: ${error.message}`);
    throw error;
  }
}

function readLocalFile(filePath) {
  try {
    logger.info(`Reading CSV from local file: ${filePath}`);
    const text = readFileSync(filePath, 'utf-8');
    return parseCSV(text);
  } catch (error) {
    logger.error(`Failed to read local CSV file: ${error.message}`);
    throw error;
  }
}

function convertToExportUrl(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `${GOOGLE_DRIVE_EXPORT}/${match[1]}/export?format=csv`;
  }
  return url;
}

export function parseCSV(text) {
  const records = parse(text, {
    skip_empty_lines: false,
    relax_column_count: true,
    bom: true,
  });

  const headerRow = records.find(row =>
    row.some(cell => cell && cell.trim() === 'Công việc')
  );

  if (!headerRow) {
    throw new Error('Invalid CSV format: Cannot find header row with "Công việc" column');
  }

  const headerIndex = records.indexOf(headerRow);
  const dataRows = records.slice(headerIndex + 1);

  const tasks = [];
  let currentModule = '';

  for (const row of dataRows) {
    const taskName = (row[2] || '').trim();
    if (!taskName) continue;

    const moduleCol = (row[1] || '').trim();
    if (moduleCol && /^[A-Z]$/.test(moduleCol)) {
      currentModule = row[2] ? row[2].trim() : currentModule;
      continue;
    }

    if (moduleCol) {
      currentModule = moduleCol;
    }

    const startDateStr = (row[7] || '').trim();
    const endDateStr = (row[8] || '').trim();

    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    tasks.push({
      module: currentModule,
      taskName,
      priority: (row[3] || '').trim(),
      assignee: (row[4] || '').trim(),
      status: (row[5] || '').trim(),
      nextTask: (row[6] || '').trim(),
      startDate,
      endDate,
      startDateStr,
      endDateStr,
      jiraCode: (row[9] || '').trim(),
      notes: (row[10] || '').trim(),
    });
  }

  logger.info(`Parsed ${tasks.length} tasks from CSV`);
  return tasks;
}

function parseDate(dateStr) {
  if (!dateStr) return null;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  let year = parseInt(parts[2], 10);

  if (year < 100) year += 2000;

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;

  return date;
}
