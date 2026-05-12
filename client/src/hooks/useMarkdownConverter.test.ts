import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMarkdownConverter } from "./useMarkdownConverter";

describe("useMarkdownConverter", () => {
  it("renders headings, bold, and lists as HTML", () => {
    const { result } = renderHook(() => useMarkdownConverter());

    act(() => {
      result.current.setMarkdown("# Title\n\n**bold** text\n\n- one\n- two");
    });

    const html = result.current.htmlOutput();
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>two</li>");
  });

  it("emits inline border styles on tables so rich-text targets keep them", () => {
    const { result } = renderHook(() => useMarkdownConverter());

    act(() => {
      result.current.setMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    });

    const html = result.current.htmlOutput();
    expect(html).toContain('<table border="1"');
    expect(html).toContain("border:1px solid #ccc");
  });
});
