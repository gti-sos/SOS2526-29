const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const MARKDOWN_PATH = path.join(ROOT, "docs", "DEFENSA_COMPLETA.md");
const PDF_PATH = path.join(ROOT, "docs", "DEFENSA_COMPLETA.pdf");
const CSS_PX_PER_MM = 96 / 25.4;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_TOP_MM = 13;
const PAGE_MARGIN_RIGHT_MM = 11;
const PAGE_MARGIN_BOTTOM_MM = 15;
const PAGE_MARGIN_LEFT_MM = 11;
const PRINTABLE_WIDTH_PX = Math.round(
  (PAGE_WIDTH_MM - PAGE_MARGIN_LEFT_MM - PAGE_MARGIN_RIGHT_MM) * CSS_PX_PER_MM
);
const PRINTABLE_HEIGHT_PX =
  (PAGE_HEIGHT_MM - PAGE_MARGIN_TOP_MM - PAGE_MARGIN_BOTTOM_MM) * CSS_PX_PER_MM;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return text;
}

function isTableStart(lines, index) {
  const first = lines[index] || "";
  const second = lines[index + 1] || "";

  return (
    /^\s*\|.+\|\s*$/.test(first) &&
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(second)
  );
}

function splitTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseTable(lines, start) {
  const rows = [];
  let index = start;

  while (index < lines.length && /^\s*\|.+\|\s*$/.test(lines[index])) {
    rows.push(lines[index]);
    index += 1;
  }

  const headers = splitTableRow(rows[0]);
  const bodyRows = rows.slice(2).map(splitTableRow);

  const html = [
    '<div class="table-wrap">',
    "<table>",
    "<thead><tr>",
    headers.map((header) => `<th>${inlineMarkdown(header)}</th>`).join(""),
    "</tr></thead>",
    "<tbody>",
    bodyRows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`
      )
      .join(""),
    "</tbody>",
    "</table>",
    "</div>"
  ].join("");

  return { html, next: index };
}

function markdownToHtml(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  let index = 0;
  let inCode = false;
  let codeLang = "";
  let codeLines = [];
  let paragraph = [];
  let listType = null;

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }

    const raw = paragraph.join(" ");
    const cssClass = /^(Frase|Respuesta|Archivo|Base URL|Header|Body|Campos|Peticion|Captura|Explicacion):/i.test(raw)
      ? ' class="lead-label"'
      : "";
    output.push(`<p${cssClass}>${inlineMarkdown(raw)}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!listType) {
      return;
    }

    output.push(`</${listType}>`);
    listType = null;
  }

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();

    if (inCode) {
      if (line.startsWith("```")) {
        const lang = codeLang ? ` language-${escapeHtml(codeLang)}` : "";
        output.push(
          `<pre class="code-block${lang}"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`
        );
        inCode = false;
        codeLang = "";
        codeLines = [];
      } else {
        codeLines.push(rawLine);
      }

      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      inCode = true;
      codeLang = line.slice(3).trim();
      index += 1;
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      flushParagraph();
      closeList();
      const table = parseTable(lines, index);
      output.push(table.html);
      index = table.next;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugify(text);
      output.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
      index += 1;
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      index += 1;
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line.trim());
    if (bullet) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        output.push("<ul>");
      }
      output.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      index += 1;
      continue;
    }

    const numbered = /^\d+\.\s+(.*)$/.exec(line.trim());
    if (numbered) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        output.push("<ol>");
      }
      output.push(`<li>${inlineMarkdown(numbered[1])}</li>`);
      index += 1;
      continue;
    }

    paragraph.push(line.trim());
    index += 1;
  }

  flushParagraph();
  closeList();
  return output.join("\n");
}

function countPdfPages(pdfPath) {
  const pdf = fs.readFileSync(pdfPath);
  const text = pdf.toString("latin1");
  return (text.match(/\/Type\s*\/Page\b/g) || []).length;
}

function buildHtml(markdown) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Defensa completa SOS2526-29</title>
<style>
  @page {
    size: A4;
    margin: 13mm 11mm 15mm;
  }

  :root {
    color-scheme: light;
    --ink: #172033;
    --muted: #526071;
    --blue-900: #0f2742;
    --blue-700: #1f5d93;
    --blue-100: #eaf4ff;
    --green-700: #19755f;
    --green-100: #e8f7f1;
    --orange-700: #a85716;
    --orange-100: #fff3e5;
    --violet-700: #6253b8;
    --violet-100: #f0edff;
    --line: #d7e0ea;
    --soft: #f7f9fc;
    --code-bg: #111827;
    --code-ink: #eaf2ff;
  }

  * {
    box-sizing: border-box;
  }

  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    margin: 0;
    color: var(--ink);
    font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    font-size: 9.35pt;
    line-height: 1.34;
    background: white;
  }

  h1, h2, h3, h4, h5, h6 {
    break-after: avoid;
    page-break-after: avoid;
    color: var(--blue-900);
    line-height: 1.15;
  }

  h1 {
    margin: 0 0 13pt;
    padding: 14pt 16pt 15pt;
    border-radius: 13pt;
    color: white;
    font-size: 24pt;
    letter-spacing: 0;
    background: linear-gradient(135deg, #12375f 0%, #1f6f8f 55%, #19755f 100%);
    box-shadow: 0 12pt 26pt rgba(15, 39, 66, 0.15);
  }

  h2 {
    margin: 19pt 0 8pt;
    padding: 6pt 9pt;
    border-left: 5pt solid var(--blue-700);
    border-radius: 7pt;
    background: linear-gradient(90deg, var(--blue-100), #ffffff 82%);
    color: var(--blue-900);
    font-size: 15.2pt;
  }

  h3 {
    margin: 14pt 0 6pt;
    padding: 4pt 0 4pt 8pt;
    border-left: 3pt solid var(--green-700);
    color: #114936;
    font-size: 12.2pt;
  }

  h4 {
    margin: 11pt 0 5pt;
    padding: 3pt 7pt;
    border-radius: 6pt;
    background: var(--orange-100);
    color: var(--orange-700);
    font-size: 10.4pt;
  }

  h5, h6 {
    margin: 9pt 0 4pt;
    color: var(--violet-700);
    font-size: 9.8pt;
  }

  p {
    margin: 4pt 0 6pt;
    orphans: 3;
    widows: 3;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  a {
    color: var(--blue-700);
    text-decoration: none;
  }

  strong {
    color: #0f2742;
  }

  code {
    padding: 0.9pt 3pt;
    border: 0.5pt solid #dbe5ef;
    border-radius: 4pt;
    background: #edf5ff;
    color: #17395f;
    font-family: Consolas, "Courier New", monospace;
    font-size: 0.88em;
  }

  .code-block {
    margin: 6pt 0 9pt;
    padding: 8pt 9pt;
    border-radius: 8pt;
    border: 1pt solid #243247;
    background: var(--code-bg);
    color: var(--code-ink);
    font-size: 8pt;
    line-height: 1.3;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .code-block code {
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    font-size: inherit;
  }

  blockquote {
    margin: 7pt 0 9pt;
    padding: 7pt 9pt 7pt 28pt;
    border: 1pt solid #b9d7f2;
    border-left: 5pt solid var(--blue-700);
    border-radius: 8pt;
    background: var(--blue-100);
    color: #163b5c;
    position: relative;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  blockquote::before {
    content: "!";
    position: absolute;
    top: 7pt;
    left: 8pt;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13pt;
    height: 13pt;
    border-radius: 50%;
    background: var(--blue-700);
    color: white;
    font-weight: 700;
    font-size: 8pt;
  }

  .lead-label {
    margin-top: 7pt;
    padding: 4pt 7pt;
    border-radius: 6pt;
    background: var(--green-100);
    color: #174d3d;
    font-weight: 700;
    break-after: avoid;
  }

  ul, ol {
    margin: 3pt 0 7pt 16pt;
    padding: 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  li {
    margin: 1.8pt 0;
    padding-left: 1pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  li::marker {
    color: var(--blue-700);
    font-weight: 700;
  }

  .table-wrap {
    margin: 7pt 0 10pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 7.65pt;
    line-height: 1.24;
    overflow: hidden;
    border: 1pt solid var(--line);
    border-radius: 8pt;
  }

  thead {
    display: table-header-group;
  }

  th {
    padding: 4.5pt 5pt;
    background: #12375f;
    color: white;
    font-weight: 700;
    text-align: left;
    vertical-align: top;
  }

  td {
    padding: 4pt 5pt;
    border-top: 0.5pt solid var(--line);
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background: #f6f9fd;
  }

  tr:nth-child(odd) td {
    background: #ffffff;
  }

  td:first-child {
    font-weight: 600;
    color: #193c61;
  }

  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  h2 + p,
  h3 + p,
  h4 + p {
    break-before: avoid;
    page-break-before: avoid;
  }

  h2,
  h3,
  h4,
  p,
  li,
  blockquote,
  pre,
  .table-wrap {
    overflow-wrap: anywhere;
  }

  .smart-page-break {
    display: block;
    width: 100%;
    break-inside: avoid;
    page-break-inside: avoid;
  }
</style>
</head>
<body>
${markdownToHtml(markdown)}
</body>
</html>`;
}

async function applySmartPageBreaks(page) {
  return page.evaluate(({ pageHeight }) => {
    document.querySelectorAll(".smart-page-break").forEach((element) => element.remove());

    const selector = [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "blockquote",
      "pre",
      ".table-wrap",
      "ul",
      "ol"
    ].join(",");

    function topOf(element) {
      return element.getBoundingClientRect().top + window.scrollY;
    }

    function heightOf(element) {
      return element.getBoundingClientRect().height;
    }

    function nextContentElement(element) {
      let sibling = element.nextElementSibling;
      while (sibling && sibling.classList.contains("smart-page-break")) {
        sibling = sibling.nextElementSibling;
      }
      return sibling;
    }

    function headingGroupHeight(element) {
      let height = heightOf(element);
      let next = nextContentElement(element);
      let blocks = element.tagName === "H2" ? 2 : 1;

      while (next && blocks > 0 && !/^H[1-6]$/.test(next.tagName)) {
        height += heightOf(next);
        next = nextContentElement(next);
        blocks -= 1;
      }

      return height;
    }

    function shouldKeepTogether(element) {
      return (
        /^H[1-6]$/.test(element.tagName) ||
        element.matches("p, blockquote, pre, .table-wrap, ul, ol")
      );
    }

    let inserted = 0;

    for (let pass = 0; pass < 500; pass += 1) {
      const elements = Array.from(document.body.querySelectorAll(selector)).filter(
        (element) =>
          shouldKeepTogether(element) &&
          !element.closest("table") &&
          !element.previousElementSibling?.classList.contains("smart-page-break")
      );

      let changed = false;

      for (const element of elements) {
        const rectHeight = heightOf(element);
        if (rectHeight < 2) {
          continue;
        }

        const tagName = element.tagName;
        const isHeading = /^H[1-6]$/.test(tagName);
        const isMajorHeading = tagName === "H1" || tagName === "H2";
        const top = topOf(element);
        const pageY = top % pageHeight;

        if (pageY < 14) {
          continue;
        }

        const wantedHeight = isHeading ? headingGroupHeight(element) : rectHeight;
        const elementFitsOnOnePage = wantedHeight < pageHeight * 0.82;
        const safetyGap = isHeading ? 110 : 34;
        const crossesPage = pageY + wantedHeight > pageHeight - safetyGap;
        const headingTooLow =
          isHeading && pageY > pageHeight - (isMajorHeading ? 260 : 185);

        if (elementFitsOnOnePage && (crossesPage || headingTooLow)) {
          const spacer = document.createElement("div");
          spacer.className = "smart-page-break";
          spacer.style.height = `${pageHeight - pageY + 1}px`;
          element.before(spacer);
          inserted += 1;
          changed = true;
          break;
        }
      }

      if (!changed) {
        break;
      }
    }

    return inserted;
  }, { pageHeight: PRINTABLE_HEIGHT_PX });
}

async function countAwkwardSplits(page) {
  return page.evaluate(({ pageHeight }) => {
    const selector = [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "blockquote",
      "pre",
      ".table-wrap",
      "ul",
      "ol"
    ].join(",");

    return Array.from(document.body.querySelectorAll(selector)).filter((element) => {
      if (element.closest("table") || element.classList.contains("smart-page-break")) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (rect.height < 2 || rect.height > pageHeight * 0.82) {
        return false;
      }

      const top = rect.top + window.scrollY;
      const pageY = top % pageHeight;

      return pageY > 14 && pageY + rect.height > pageHeight - 30;
    }).length;
  }, { pageHeight: PRINTABLE_HEIGHT_PX });
}

(async () => {
  const markdown = fs.readFileSync(MARKDOWN_PATH, "utf8");
  const html = buildHtml(markdown);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: PRINTABLE_WIDTH_PX,
      height: Math.round(PRINTABLE_HEIGHT_PX)
    }
  });

  await page.setContent(html, { waitUntil: "load" });
  const insertedBreaks = await applySmartPageBreaks(page);
  const awkwardSplits = await countAwkwardSplits(page);
  await page.pdf({
    path: PDF_PATH,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width:100%;padding:0 11mm;font-family:Segoe UI,Arial,sans-serif;font-size:7.4px;color:#617084;">
        <span style="display:inline-block;border-left:10px solid #1f5d93;padding-left:5px;">Defensa completa SOS2526-29</span>
      </div>
    `,
    footerTemplate: `
      <div style="width:100%;padding:0 11mm;font-family:Segoe UI,Arial,sans-serif;font-size:7.4px;color:#617084;display:flex;justify-content:space-between;">
        <span>citys-stats · SOS2526-29</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: `${PAGE_MARGIN_TOP_MM}mm`,
      right: `${PAGE_MARGIN_RIGHT_MM}mm`,
      bottom: `${PAGE_MARGIN_BOTTOM_MM}mm`,
      left: `${PAGE_MARGIN_LEFT_MM}mm`
    }
  });

  await browser.close();

  const pages = countPdfPages(PDF_PATH);
  console.log(`PDF regenerated: ${PDF_PATH}`);
  console.log(`Pages: ${pages}`);
  console.log(`Smart page breaks inserted: ${insertedBreaks}`);
  console.log(`Remaining awkward splits: ${awkwardSplits}`);
})();
