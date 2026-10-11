import katex from 'katex';
import { memo, useMemo } from 'react';

interface TexProps {
  math: string;
  block?: boolean;
  className?: string;
}

/** KaTeX ile LaTeX çizer. Yalnızca uygulamanın kendi metinleri verilir (trust kapalı). */
export const Tex = memo(function Tex({ math, block = false, className }: TexProps) {
  const html = useMemo(
    // htmlAndMathml: görsel HTML + ekran okuyucular için gizli MathML.
    () => katex.renderToString(math, { displayMode: block, throwOnError: false, output: 'htmlAndMathml', trust: false }),
    [math, block],
  );
  const Tag = block ? 'div' : 'span';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});
