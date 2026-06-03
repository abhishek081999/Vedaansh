import * as XLSX from 'xlsx'

/** Max rows parsed from user uploads (ReDoS / memory guard). */
export const MAX_XLSX_IMPORT_ROWS = 500

export function readWorkbookFromBuffer(buffer: Buffer): XLSX.WorkBook {
  return XLSX.read(buffer, {
    type: 'buffer',
    cellDates: false,
    sheetRows: MAX_XLSX_IMPORT_ROWS,
  })
}
