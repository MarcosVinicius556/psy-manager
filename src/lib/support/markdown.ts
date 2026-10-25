import { escapeHtml } from "./sanitize";

/** Minimal safe markdown: paragraphs, bold, links, code, lists. No raw HTML. */
export function renderSafeMarkdown(source: string): string {
  const escaped = escapeHtml(source);
  const lines = escaped.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push("<br />");
      continue;
    }
    const listMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (listMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(listMatch[1])}</li>`);
      continue;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }
  if (inList) html.push("</ul>");
  return html.join("");
}

function inlineMarkdown(text: string): string {
  let out = text;
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>');
  return out;
}
