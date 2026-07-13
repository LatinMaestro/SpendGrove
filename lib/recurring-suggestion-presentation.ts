export function uniqueSuggestionsByIdentity<T extends { key: string }>(suggestions: readonly T[]) {
  const unique = new Map<string, T>();
  for (const suggestion of suggestions) {
    if (!unique.has(suggestion.key)) unique.set(suggestion.key, suggestion);
  }
  return [...unique.values()];
}

export function visibleRecurringSuggestions<T>(
  suggestions: readonly T[],
  showAll: boolean,
  limit = 3,
) {
  return showAll ? [...suggestions] : suggestions.slice(0, limit);
}
