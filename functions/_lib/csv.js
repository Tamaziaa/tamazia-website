// Phase 9 · RFC 4180-compliant CSV serialisation
// Handles fields with commas, double-quotes, newlines, and Excel BOM option.
export function csvEscape(value) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // RFC 4180 §2.6: fields containing line breaks (CRLF), double quotes, or commas
  // should be enclosed in double-quotes. Embedded double-quotes are escaped by
  // doubling.
  if (/["\r\n,]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
export function csvRow(values) {
  return values.map(csvEscape).join(',');
}
export function csvFromObjects(records, columns, opts = {}) {
  const rows = [csvRow(columns)];
  for (const r of records) {
    rows.push(csvRow(columns.map(c => {
      const v = r[c];
      if (v && typeof v === 'object') return JSON.stringify(v);
      return v;
    })));
  }
  // CRLF line ending per RFC 4180 §2.1 + optional BOM for Excel UTF-8
  const body = rows.join('\r\n');
  return opts.bom ? '﻿' + body : body;
}
