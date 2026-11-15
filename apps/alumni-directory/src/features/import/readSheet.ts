// Step 1 of the import: turn an uploaded .xlsx or .csv into plain text rows.
// exceljs is only loaded when an .xlsx is actually opened, to keep the first page load small.

import Papa from 'papaparse';

export interface Sheet {
  headers: string[];
  /** Data rows only (no header), every cell as trimmed text. */
  rows: string[][];
}

export function parseCsvText(text: string): Sheet {
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ''), { skipEmptyLines: 'greedy' });
  return toSheet(result.data);
}

export async function readSheet(file: File): Promise<Sheet> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return parseCsvText(await file.text());
  if (name.endsWith('.xlsx')) return readXlsx(await file.arrayBuffer());
  throw new Error('unsupported_file');
}

export async function readXlsx(data: ArrayBuffer): Promise<Sheet> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { headers: [], rows: [] };

  const grid: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let col = 1; col <= worksheet.columnCount; col++) cells.push(cellText(row.getCell(col).value));
    grid.push(cells);
  });
  return toSheet(grid);
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const v = value as { text?: unknown; result?: unknown; richText?: { text: string }[]; hyperlink?: string };
    if (Array.isArray(v.richText)) return v.richText.map((part) => part.text).join('').trim();
    if (v.result !== undefined) return cellText(v.result);
    if (v.text !== undefined) return cellText(v.text);
    return '';
  }
  return String(value).trim();
}

function toSheet(grid: string[][]): Sheet {
  const [header = [], ...rows] = grid.map((r) => r.map((c) => (c ?? '').toString().trim()));
  const width = header.length;
  return {
    headers: header,
    rows: rows
      .map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''))
      .filter((r) => r.some((c) => c !== '')),
  };
}
