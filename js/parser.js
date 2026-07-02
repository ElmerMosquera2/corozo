function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInline(text) {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/_(.+?)_/g, "<em>$1</em>");
  return result;
}

function toSafeHttpUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.href
      : "";
  } catch {
    return "";
  }
}

function splitSlides(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections = [[]];

  for (const line of lines) {
    if (/^\s*---\s*$/.test(line)) {
      sections.push([]);
    } else {
      sections[sections.length - 1].push(line);
    }
  }

  return sections.map((s) => s.join("\n").trim()).filter(Boolean);
}

function parseTable(lines, startIndex) {
  if (startIndex + 1 >= lines.length) return null;

  const header = lines[startIndex];
  const sep = lines[startIndex + 1];

  if (!header.includes("|")) return null;
  if (!/^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(sep)) return null;

  const normalizeRow = (row) =>
    row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  const rows = [normalizeRow(header)];
  let idx = startIndex + 2;

  while (
    idx < lines.length &&
    lines[idx].includes("|") &&
    lines[idx].trim() !== ""
  ) {
    rows.push(normalizeRow(lines[idx]));
    idx += 1;
  }

  const [head, ...body] = rows;
  const html = `<table>
    <thead><tr>${head.map((c) => `<th>${formatInline(c)}</th>`).join("")}</tr></thead>
    <tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${formatInline(c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;

  return { html, nextIndex: idx };
}

function parseBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    const table = parseTable(lines, i);
    if (table) {
      blocks.push({ k: "table", html: table.html });
      i = table.nextIndex;
      continue;
    }

    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      const safeUrl = toSafeHttpUrl(imgMatch[2].trim());
      if (safeUrl) {
        blocks.push({ k: "img", src: safeUrl, alt: imgMatch[1] });
      }
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push({ k: `h${level}`, t: heading[2] });
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ k: "list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ k: "olist", items });
      continue;
    }

    if (/^>\s+/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s+/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s+/, ""));
        i++;
      }
      blocks.push({ k: "quote", t: quoteLines.join(" ") });
      continue;
    }

    blocks.push({ k: "p", t: line });
    i++;
  }

  return blocks;
}

function buildSlides(markdown) {
  const raw = splitSlides(markdown);
  if (!raw.length) return [{ blocks: [], title: "Nueva presentación", image: null, subtitle: "" }];

  return raw.map((text) => {
    const blocks = parseBlocks(text);

    const titleBlock = blocks.find((b) => b.k === "h1" || b.k === "h2");
    const imageBlock = blocks.find((b) => b.k === "img");
    const firstPara = blocks.find((b) => b.k === "p");

    const title = titleBlock ? titleBlock.t : "";
    const image = imageBlock ? imageBlock.src : null;
    const subtitle = firstPara ? firstPara.t : "";

    const filtered = blocks.filter((b) => b !== imageBlock && b !== titleBlock);

    return { blocks: filtered, title, image, subtitle };
  });
}

export const Parser = {
  escapeHtml,
  formatInline,
  splitSlides,
  parseBlocks,
  buildSlides,
};
