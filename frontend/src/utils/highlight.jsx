// Escape regex-special characters so a query term matches literally.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split `text` on any of the whitespace-separated terms in `query`
 * (case-insensitive) and wrap matches in <mark>, so the caller can style
 * them as highlights. Returns the original string if there's nothing to
 * highlight, and React nodes otherwise.
 */
export function highlightTerms(text, query) {
  if (!text) return text;
  if (!query || !query.trim()) return text;

  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegex);

  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.join("|")})`, "ig");
  const parts = text.split(pattern);

  // With a capturing group, matches always land on odd indices.
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-sm bg-yellow-200/70 px-0.5 text-inherit dark:bg-yellow-300/20">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
