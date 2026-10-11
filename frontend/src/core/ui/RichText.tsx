import { Fragment, type ReactNode } from 'react';
import { Tex } from './Tex';

/**
 * Ders metinleri için küçük biçimlendirici:
 *   $...$ → satır içi formül, $$...$$ (tek başına paragraf) → blok formül,
 *   **...** → kalın, "- " ile başlayan satırlar → liste,
 *   boş satır → yeni paragraf.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  // Önce kalın bölümler ayrılır; içlerinde formül olabilir (ör. **$\pi$**).
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {math(part.slice(2, -2), key)}
        </strong>
      );
    }
    return math(part, key);
  });
}

function math(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\$[^$]+\$)/g).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <Tex key={key} math={part.slice(1, -1)} />;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={`space-y-2.5 ${className}`}>
      {blocks.map((block, bi) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
          return <Tex key={bi} block math={trimmed.slice(2, -2)} className="py-1" />;
        }
        const lines = block.split('\n');
        if (lines.every((l) => l.trimStart().startsWith('- '))) {
          return (
            <ul key={bi} className="space-y-1.5 pl-1">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2">
                  <span aria-hidden className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                  <span>{inline(l.trimStart().slice(2), `${bi}-${li}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={bi}>{inline(lines.join(' '), String(bi))}</p>;
      })}
    </div>
  );
}
