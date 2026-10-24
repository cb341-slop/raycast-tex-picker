import type { SymbolEntry } from "./catalog";

function searchFields(entry: SymbolEntry): string[] {
  return [
    entry.symbol,
    entry.tex,
    entry.name,
    entry.category,
    ...entry.keywords,
  ];
}

export function scoreEntry(
  entry: SymbolEntry,
  rawQuery: string,
): number | undefined {
  const query = rawQuery.trim();
  if (!query) return 0;
  if (entry.symbol === query) return 0;
  if (entry.tex === query) return 1;

  const fields = searchFields(entry);
  const lowerFields = fields.map((field) => field.toLocaleLowerCase());
  if (/^[A-Z]$/.test(query)) {
    return [entry.symbol, entry.tex].some((field) => field.includes(query))
      ? 2
      : undefined;
  }
  if (/^[a-z]$/.test(query)) {
    return lowerFields.some((field) => field === query) ? 2 : undefined;
  }

  const lowerQuery = query.toLocaleLowerCase();
  if (entry.name.toLocaleLowerCase() === lowerQuery) return 2;
  if (entry.tex.replace(/^\\/, "").toLocaleLowerCase() === lowerQuery) return 3;

  const hasUppercase = /[A-Z]/.test(query);
  const queryTokens = query.split(/\s+/);
  let total = 0;

  for (const token of queryTokens) {
    const lowerToken = token.toLocaleLowerCase();
    const caseExact = hasUppercase
      ? [entry.symbol, entry.tex].some((field) => field.includes(token))
      : false;
    const lowerIndex = lowerFields.findIndex((field) =>
      field.includes(lowerToken),
    );

    if (caseExact) {
      total += 2;
    } else if (lowerFields.some((field) => field === lowerToken)) {
      total += 8;
    } else if (lowerFields.some((field) => field.startsWith(lowerToken))) {
      total += 12;
    } else if (lowerIndex >= 0) {
      total += 20 + lowerFields[lowerIndex].indexOf(lowerToken);
    } else {
      return undefined;
    }
  }

  return total;
}
