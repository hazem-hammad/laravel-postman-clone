import type { ReactNode } from 'react';

type TokenType =
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'punct'
  | 'whitespace'
  | 'other';

const STYLE: Record<TokenType, { color?: string } | undefined> = {
  key: { color: 'var(--pc-code-key)' },
  string: { color: 'var(--pc-code-string)' },
  number: { color: 'var(--pc-code-number)' },
  literal: { color: 'var(--pc-code-literal)' },
  punct: { color: 'var(--pc-code-punct)' },
  whitespace: undefined,
  other: { color: 'var(--pc-code-text)' },
};

/**
 * Minimal JSON syntax highlighter — single-pass regex over a pre-formatted
 * JSON string. Returns React fragments rather than HTML to avoid
 * dangerouslySetInnerHTML.
 *
 * Recognizes: object keys, string values, numbers, true/false/null,
 * structural punctuation. Anything that doesn't match is rendered as
 * plain text so non-JSON input degrades to readable plain output.
 */
export function highlightJson(input: string): ReactNode {
  if (input === '') return null;

  // Capture groups:
  //   1: object key (a string immediately followed by `:`) — matched by 1+2
  //   2: the trailing `:` (always present when group 1 matches)
  //   3: standalone string value
  //   4: number
  //   5: literal (true/false/null)
  //   6: structural punct ({ } [ ] , :)
  //   7: whitespace
  //   8: anything else (single char fallback)
  const re =
    /("(?:\\.|[^"\\])*")(\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([\{\}\[\],:])|(\s+)|([\s\S])/g;

  const out: ReactNode[] = [];
  let i = 0;
  let match: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((match = re.exec(input)) !== null) {
    if (match[1] !== undefined && match[2] !== undefined) {
      out.push(<span key={i++} style={STYLE.key}>{match[1]}</span>);
      out.push(<span key={i++} style={STYLE.punct}>{match[2]}</span>);
    } else if (match[3] !== undefined) {
      out.push(<span key={i++} style={STYLE.string}>{match[3]}</span>);
    } else if (match[4] !== undefined) {
      out.push(<span key={i++} style={STYLE.number}>{match[4]}</span>);
    } else if (match[5] !== undefined) {
      out.push(<span key={i++} style={STYLE.literal}>{match[5]}</span>);
    } else if (match[6] !== undefined) {
      out.push(<span key={i++} style={STYLE.punct}>{match[6]}</span>);
    } else if (match[7] !== undefined) {
      out.push(<span key={i++}>{match[7]}</span>);
    } else if (match[8] !== undefined) {
      out.push(<span key={i++} style={STYLE.other}>{match[8]}</span>);
    }
  }
  return out;
}
