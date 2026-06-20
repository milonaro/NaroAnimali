import React from 'react';

/**
 * Parses markdown-like safe structures to beautiful styled React components.
 * Supports:
 * - Headlines (#, ##, ###)
 * - Bold (**text**)
 * - Custom External Links ([text](https://...))
 * - Bullet lists (•, -, *)
 * - Clean paragraphs separated by lines
 */
export function parseMarkdownToReact(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-6 space-y-1.5 my-4 text-slate-600">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInlineStyles = (lineText: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = lineText;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      const linkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);

      let firstMatch: { type: 'bold' | 'link'; index: number; length: number; content: string; extra?: string } | null = null;

      if (boldMatch && boldMatch.index !== undefined) {
        firstMatch = {
          type: 'bold',
          index: boldMatch.index,
          length: boldMatch[0].length,
          content: boldMatch[1]
        };
      }

      if (linkMatch && linkMatch.index !== undefined) {
        if (!firstMatch || linkMatch.index < firstMatch.index) {
          firstMatch = {
            type: 'link',
            index: linkMatch.index,
            length: linkMatch[0].length,
            content: linkMatch[1],
            extra: linkMatch[2]
          };
        }
      }

      if (!firstMatch) {
        parts.push(<span key={`text-${keyIdx++}`}>{remaining}</span>);
        break;
      }

      if (firstMatch.index > 0) {
        parts.push(<span key={`text-${keyIdx++}`}>{remaining.substring(0, firstMatch.index)}</span>);
      }

      if (firstMatch.type === 'bold') {
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-extrabold text-[#1e3a5f]">
            {firstMatch.content}
          </strong>
        );
      } else if (firstMatch.type === 'link') {
        const url = firstMatch.extra || '#';
        parts.push(
          <a
            key={`link-${keyIdx++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#15803d] font-bold underline hover:text-[#166534] transition-colors"
          >
            {firstMatch.content}
          </a>
        );
      }

      remaining = remaining.substring(firstMatch.index + firstMatch.length);
    }

    return parts;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Check headings
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-sm font-black text-[#1e3a5f] uppercase tracking-wider mt-4 mb-2">
          {parseInlineStyles(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-lg font-black text-[#1e3a5f] border-b border-slate-100 pb-2 mt-6 mb-3">
          {parseInlineStyles(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-xl sm:text-2xl font-black text-[#101b3a] tracking-tight mt-8 mb-4">
          {parseInlineStyles(trimmed.substring(2))}
        </h1>
      );
    } else if (
      trimmed.startsWith('•') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('*')
    ) {
      // Clean Bullet marker
      const bulletContent = trimmed.replace(/^([•\-\*]\s*)/, '');
      currentList.push(
        <li key={`li-${index}`} className="text-sm font-medium leading-relaxed">
          {parseInlineStyles(bulletContent)}
        </li>
      );
    } else {
      flushList();
      elements.push(
        <p key={index} className="text-sm sm:text-base leading-relaxed text-slate-650 font-medium mb-3 last:mb-0">
          {parseInlineStyles(line)}
        </p>
      );
    }
  });

  flushList();
  return elements;
}
