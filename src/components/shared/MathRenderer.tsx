/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  // Convert standard markdown LaTeX formats ($...$, $$...$$, \(...\), \[...\]) into styled math badges
  const renderFormattedMath = (text: string) => {
    if (!text) return null;

    // Split by block math $$ ... $$ or \[ ... \]
    const blockParts = text.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g);

    return blockParts.map((blockPart, bIdx) => {
      if (
        (blockPart.startsWith('$$') && blockPart.endsWith('$$')) ||
        (blockPart.startsWith('\\[') && blockPart.endsWith('\\]'))
      ) {
        const formula = blockPart
          .replace(/^\$\$|^\\\[/, '')
          .replace(/\$\$$|\\\]$/, '')
          .trim();

        return (
          <div
            key={`block-${bIdx}`}
            className="my-3 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-300 font-mono text-base tracking-wide overflow-x-auto shadow-inner"
          >
            <span className="select-all font-semibold">{formula}</span>
          </div>
        );
      }

      // Process inline math $...$ or \(...\)
      const inlineParts = blockPart.split(/(\$[^\$\n]+\$|\\\([^\)]+\\\))/g);

      return (
        <span key={`inline-group-${bIdx}`}>
          {inlineParts.map((part, iIdx) => {
            if (
              (part.startsWith('$') && part.endsWith('$')) ||
              (part.startsWith('\\(') && part.endsWith('\\)'))
            ) {
              const inlineFormula = part
                .replace(/^\$|^\\\(/, '')
                .replace(/\$|\\\)$/, '')
                .trim();

              return (
                <code
                  key={`inline-${iIdx}`}
                  className="px-1.5 py-0.5 mx-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 rounded font-mono text-sm font-semibold"
                >
                  {inlineFormula}
                </code>
              );
            }
            return <span key={`text-${iIdx}`}>{part}</span>;
          })}
        </span>
      );
    });
  };

  return <div className={`leading-relaxed ${className}`}>{renderFormattedMath(content)}</div>;
};
