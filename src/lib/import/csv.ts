import { parse } from "csv-parse/sync";

export type ImportRow = Record<string, string>;

export function parseImportCsv(content: string): ImportRow[] {
  return parse(content, { columns: true, skip_empty_lines: true, bom: true, trim: true, relax_column_count: true }) as ImportRow[];
}
