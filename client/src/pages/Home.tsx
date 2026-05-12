/*
 * Design: "Clean Workspace" - Minimalist Writing Tool
 * - Warm off-white background, ink-black text, muted teal accent
 * - Asymmetric two-column: editor left, preview right
 * - Content-first, generous whitespace, thin borders
 * - DM Sans for UI, JetBrains Mono for editor
 */

import { useMarkdownConverter } from "@/hooks/useMarkdownConverter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";

import {
  ClipboardCopy,
  Code2,
  Check,
  AlertCircle,
  FileText,
  Eye,
  Eraser,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const {
    markdown,
    setMarkdown,
    htmlOutput,
    copyAsRichText,
    copyAsHtml,
    copyState,
  } = useMarkdownConverter();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState("preview");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Focus textarea on mount
  useEffect(() => {
    if (!isMobile) {
      textareaRef.current?.focus();
    }
  }, [isMobile]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to copy
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleCopyRichText();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [markdown]);

  const handleCopyRichText = useCallback(async () => {
    await copyAsRichText();
    toast.success("Copied as rich text", {
      description: "Paste into any app to use the formatted content.",
    });
  }, [copyAsRichText]);

  const handleCopyHtml = useCallback(async () => {
    await copyAsHtml();
    toast.success("Copied as HTML", {
      description: "Raw HTML source copied to clipboard.",
    });
  }, [copyAsHtml]);

  const handleClear = useCallback(() => {
    setMarkdown("");
    textareaRef.current?.focus();
  }, [setMarkdown]);

  const wordCount = markdown
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;
  const charCount = markdown.length;

  const html = htmlOutput();

  const CopyIcon =
    copyState === "copied"
      ? Check
      : copyState === "error"
        ? AlertCircle
        : ClipboardCopy;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none">
                Stripdown
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Copy as unstyled rich text
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyHtml}
                  className="gap-1.5 text-xs"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy HTML</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy raw HTML source code</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleCopyRichText}
                  className="gap-1.5 text-xs"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={copyState}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-1.5"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {copyState === "copied"
                          ? "Copied!"
                          : copyState === "error"
                            ? "Failed"
                            : "Copy Rich Text"}
                      </span>
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span className="flex items-center gap-2">
                  Copy as unstyled rich text
                  <Kbd>
                    {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}+↵
                  </Kbd>
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col md:border-r border-border/60">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] font-mono uppercase tracking-wider"
              >
                Markdown
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {wordCount} words · {charCount} chars
              </span>
              {markdown.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleClear}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear editor</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              className="w-full h-full min-h-[300px] md:min-h-0 md:absolute md:inset-0 resize-none bg-transparent p-4 md:p-6 font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none"
              placeholder="Paste or type your Markdown here..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col bg-card/50">
          {/* Preview tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-7">
                <TabsTrigger
                  value="preview"
                  className="text-xs gap-1 px-2.5 h-6"
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="html" className="text-xs gap-1 px-2.5 h-6">
                  <Code2 className="w-3 h-3" />
                  HTML
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge
              variant="outline"
              className="text-[10px] font-mono uppercase tracking-wider"
            >
              Output
            </Badge>
          </div>

          {/* Preview content */}
          <div className="flex-1 relative">
            <div className="md:absolute md:inset-0 overflow-auto">
              {activeTab === "preview" ? (
                <div
                  className="p-4 md:p-6 prose-preview"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <pre className="p-4 md:p-6 text-xs font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
                  {html}
                </pre>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
