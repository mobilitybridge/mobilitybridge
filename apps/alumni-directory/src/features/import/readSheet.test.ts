import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { parseCsvText, readXlsx } from './readSheet';

describe('readXlsx', () => {
  it('reads the first sheet as text, including Arabic, dates, formulas and rich text', async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Alumni');
    ws.addRow(['الاسم', 'Start', 'Year', 'Note']);
    ws.addRow(['سارة عودة', new Date(Date.UTC(2024, 1, 15)), { formula: '2023+1', result: 2024 }, { richText: [{ text: 'Bold' }, { text: ' part' }] }]);
    ws.addRow([]);
    ws.addRow(['Rami', null, 2022]);
    const buffer = await workbook.xlsx.writeBuffer();

    const sheet = await readXlsx(buffer as ArrayBuffer);
    expect(sheet.headers).toEqual(['الاسم', 'Start', 'Year', 'Note']);
    expect(sheet.rows).toEqual([
      ['سارة عودة', '2024-02-15', '2024', 'Bold part'],
      ['Rami', '', '2022', ''],
    ]);
  });
});

describe('parseCsvText', () => {
  it('drops the Excel BOM and empty lines, and pads short rows', () => {
    const sheet = parseCsvText('﻿Name,Country\nSara,Spain\n\nRami\n');
    expect(sheet.headers).toEqual(['Name', 'Country']);
    expect(sheet.rows).toEqual([['Sara', 'Spain'], ['Rami', '']]);
  });
});
