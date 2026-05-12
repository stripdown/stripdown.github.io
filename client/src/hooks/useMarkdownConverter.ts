import { useState, useCallback, useRef, useEffect } from "react";
import { marked } from "marked";

// Custom renderer that adds minimal inline border styles to tables.
// Google Docs (and many rich-text targets) ignore CSS classes and only
// respect inline styles / the legacy border attribute on <table>.
const renderer = new marked.Renderer();

renderer.table = function ({ header, rows }) {
  const headerCells = header.map(
    cell =>
      `<th style="border:1px solid #ccc;padding:4px 8px">${this.parser.parseInline(cell.tokens)}</th>`
  );
  const headerRow = `<tr>${headerCells.join("")}</tr>`;

  const bodyRows = rows
    .map(row => {
      const cells = row.map(
        cell =>
          `<td style="border:1px solid #ccc;padding:4px 8px">${this.parser.parseInline(cell.tokens)}</td>`
      );
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `<table border="1" style="border-collapse:collapse;border:1px solid #ccc"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>\n`;
};

marked.setOptions({
  gfm: true,
  breaks: false,
  renderer,
});

const DEFAULT_MARKDOWN = `# Welcome to Stripdown

Paste or type your **Markdown** here and copy it as *rich text* to use anywhere.

## Features

- Converts Markdown to **unstyled** rich text
- Preserves structure: headings, lists, links, code
- No opinionated fonts, colors, or sizes
- Just clean HTML that inherits your destination's styling

## Example Content

Here's a [link to GitHub](https://github.com) and some \`inline code\`.

\`\`\`
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`

### A Table

| Feature | Supported |
|---------|-----------|
| **Bold** | Yes |
| *Italic* | Yes |
| [Links](https://example.com) | Yes |
| Lists | Yes |
| Tables | Yes |
| \`Code\` | Yes |

> Blockquotes are also supported, making it easy to format
> quoted text in your documents.

1. First ordered item
2. Second ordered item
3. Third ordered item

---

That's it. Write markdown, copy rich text, paste anywhere.`;

export function useMarkdownConverter() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const htmlOutput = useCallback(() => {
    try {
      return marked.parse(markdown, { async: false }) as string;
    } catch {
      return "<p>Error parsing markdown</p>";
    }
  }, [markdown]);

  const copyAsRichText = useCallback(async () => {
    const html = htmlOutput();

    try {
      // Use the Clipboard API to write rich text (HTML)
      const blob = new Blob([html], { type: "text/html" });
      const plainBlob = new Blob([markdown], { type: "text/plain" });

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": plainBlob,
        }),
      ]);

      setCopyState("copied");
    } catch {
      // Fallback: try execCommand approach
      try {
        const container = document.createElement("div");
        container.innerHTML = html;
        // Remove all inline styles to keep it unstyled
        container.querySelectorAll("*").forEach(el => {
          el.removeAttribute("style");
        });

        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        document.body.appendChild(container);

        const range = document.createRange();
        range.selectNodeContents(container);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        document.execCommand("copy");
        selection?.removeAllRanges();
        document.body.removeChild(container);

        setCopyState("copied");
      } catch {
        setCopyState("error");
      }
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopyState("idle"), 2000);
  }, [htmlOutput, markdown]);

  const copyAsHtml = useCallback(async () => {
    const html = htmlOutput();
    try {
      await navigator.clipboard.writeText(html);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopyState("idle"), 2000);
  }, [htmlOutput]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    markdown,
    setMarkdown,
    htmlOutput,
    copyAsRichText,
    copyAsHtml,
    copyState,
  };
}
