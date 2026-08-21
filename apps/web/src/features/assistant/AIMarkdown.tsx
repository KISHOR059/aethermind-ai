import { useState, useId, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface CodeBlockProps {
  language?: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const blockId = useId();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-3 rounded-lg border border-border/80 bg-muted/40 overflow-hidden font-mono text-xs shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/70 px-3.5 py-1.5 text-[11px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider text-foreground/80">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy code"}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3.5 leading-relaxed">
        <pre tabIndex={0} id={blockId} className="text-foreground/90 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function renderInlineFormatting(text: string): ReactNode[] {
  // Regex to split by inline code (`...`), bold (**...**), italic (*...*), and links ([...](...))
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Check for inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch && codeMatch.index === 0) {
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-foreground border border-border/40"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Check for bold (**...**)
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index === 0) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-semibold text-foreground">
          {renderInlineFormatting(boldMatch[1])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for italic (*...*)
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch && italicMatch.index === 0) {
      parts.push(
        <em key={`italic-${keyIdx++}`} className="italic text-foreground/90">
          {renderInlineFormatting(italicMatch[1])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Check for links ([text](url))
    const linkMatch = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
    if (linkMatch && linkMatch.index === 0) {
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Find next special delimiter
    const nextSpecial = remaining.search(/[`*[]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Delimiter didn't match full pattern, take 1 char
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

export interface AIMarkdownProps {
  content: string;
  className?: string;
}

export function AIMarkdown({ content, className }: AIMarkdownProps) {
  if (!content) return null;

  // Split into code blocks and normal markdown segments
  const segments: ReactNode[] = [];
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeBuffer: string[] = [];
  let textBuffer: string[] = [];
  let segmentIndex = 0;

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;

    const blockLines = [...textBuffer];
    textBuffer = [];

    let i = 0;
    while (i < blockLines.length) {
      const line = blockLines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        segments.push(
          <h4
            key={`h3-${segmentIndex++}`}
            className="mt-3 mb-1.5 text-sm font-semibold tracking-tight text-foreground"
          >
            {renderInlineFormatting(trimmed.slice(4))}
          </h4>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith("## ")) {
        segments.push(
          <h3
            key={`h2-${segmentIndex++}`}
            className="mt-4 mb-2 text-base font-semibold tracking-tight text-foreground"
          >
            {renderInlineFormatting(trimmed.slice(3))}
          </h3>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith("# ")) {
        segments.push(
          <h2
            key={`h1-${segmentIndex++}`}
            className="mt-4 mb-2 text-lg font-bold tracking-tight text-foreground"
          >
            {renderInlineFormatting(trimmed.slice(2))}
          </h2>
        );
        i++;
        continue;
      }

      // Horizontal Rule
      if (/^(\*\*\*|---|___)$/.test(trimmed)) {
        segments.push(
          <hr key={`hr-${segmentIndex++}`} className="my-3 border-border/60" />
        );
        i++;
        continue;
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        const quoteLines: string[] = [];
        while (i < blockLines.length && blockLines[i].trim().startsWith("> ")) {
          quoteLines.push(blockLines[i].trim().slice(2));
          i++;
        }
        segments.push(
          <blockquote
            key={`quote-${segmentIndex++}`}
            className="my-2.5 border-l-2 border-primary/40 bg-muted/30 px-3 py-1.5 text-xs italic text-muted-foreground rounded-r"
          >
            {quoteLines.map((qLine, qIdx) => (
              <p key={qIdx}>{renderInlineFormatting(qLine)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Unordered list
      if (/^[-*•]\s+/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < blockLines.length && /^[-*•]\s+/.test(blockLines[i].trim())) {
          listItems.push(blockLines[i].trim().replace(/^[-*•]\s+/, ""));
          i++;
        }
        segments.push(
          <ul
            key={`ul-${segmentIndex++}`}
            className="my-2 space-y-1 pl-4 text-xs sm:text-sm list-disc marker:text-muted-foreground/70"
          >
            {listItems.map((item, itemIdx) => (
              <li key={itemIdx} className="leading-relaxed">
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered list
      if (/^\d+\.\s+/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < blockLines.length && /^\d+\.\s+/.test(blockLines[i].trim())) {
          listItems.push(blockLines[i].trim().replace(/^\d+\.\s+/, ""));
          i++;
        }
        segments.push(
          <ol
            key={`ol-${segmentIndex++}`}
            className="my-2 space-y-1 pl-4 text-xs sm:text-sm list-decimal marker:text-muted-foreground/70 marker:font-medium"
          >
            {listItems.map((item, itemIdx) => (
              <li key={itemIdx} className="leading-relaxed">
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Normal paragraph
      const paraLines: string[] = [];
      while (
        i < blockLines.length &&
        blockLines[i].trim() &&
        !blockLines[i].trim().startsWith("#") &&
        !/^[-*•]\s+/.test(blockLines[i].trim()) &&
        !/^\d+\.\s+/.test(blockLines[i].trim()) &&
        !blockLines[i].trim().startsWith("> ") &&
        !/^(\*\*\*|---|___)$/.test(blockLines[i].trim())
      ) {
        paraLines.push(blockLines[i]);
        i++;
      }

      segments.push(
        <p
          key={`p-${segmentIndex++}`}
          className="my-1.5 text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap"
        >
          {renderInlineFormatting(paraLines.join("\n"))}
        </p>
      );
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        flushTextBuffer();
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        segments.push(
          <CodeBlock
            key={`codeblock-${segmentIndex++}`}
            language={codeLanguage}
            code={codeBuffer.join("\n")}
          />
        );
        inCodeBlock = false;
        codeLanguage = "";
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
    } else {
      textBuffer.push(line);
    }
  }

  // Flush remaining buffers
  if (inCodeBlock && codeBuffer.length > 0) {
    segments.push(
      <CodeBlock
        key={`codeblock-${segmentIndex++}`}
        language={codeLanguage}
        code={codeBuffer.join("\n")}
      />
    );
  } else {
    flushTextBuffer();
  }

  return <div className={cn("space-y-1 text-left", className)}>{segments}</div>;
}

export default AIMarkdown;
