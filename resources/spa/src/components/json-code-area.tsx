import { useEffect, useRef } from 'react';
import { highlightJson } from '@/lib/highlight-json';

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Editable code area with JSON syntax highlighting.
 *
 * Implementation: a transparent <textarea> stacked exactly on top of a
 * colored <pre>. The user types in the textarea (gets all native input
 * handling — caret, selection, IME, undo, copy/paste); they see the
 * colors from the pre underneath. Both share the same font, size,
 * line-height, padding, and box so cursor position lines up exactly.
 */
export function JsonCodeArea({ value, onChange, placeholder, className }: Props) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  // Keep the highlight layer's scroll in sync with the textarea so colors
  // don't lag when content overflows.
  useEffect(() => {
    const ta = taRef.current;
    const pre = preRef.current;
    if (!ta || !pre) return;
    const sync = () => {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
    };
    ta.addEventListener('scroll', sync);
    return () => ta.removeEventListener('scroll', sync);
  }, []);

  // Indent on Tab inside the textarea so JSON editing stays comfortable.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, start) + '  ' + value.substring(end);
      onChange(next);
      // restore caret position after insertion
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <pre
        ref={preRef}
        aria-hidden
        className="absolute inset-0 m-0 p-2 font-mono text-sm leading-6 whitespace-pre overflow-auto pointer-events-none"
      >
        {highlightJson(value)}
        {/* Trailing newline so caret on the last line stays visible. */}
        {'\n'}
      </pre>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        className="
          relative z-10 w-full h-full m-0 p-2 font-mono text-sm leading-6
          bg-transparent border-0 outline-none resize-none
          text-transparent caret-zinc-800
          selection:bg-blue-200 selection:text-zinc-800
          placeholder:text-zinc-400
        "
        style={{ caretColor: '#27272a' }}
      />
    </div>
  );
}
