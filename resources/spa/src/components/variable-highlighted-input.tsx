import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  listVarsInInput,
  renderTokens,
  tokenizeWithVariables,
  useActiveVariables,
} from '@/lib/highlight-variables';

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Smaller "compact" styling for use inside table rows. */
  compact?: boolean;
  type?: 'text' | 'url';
};

/**
 * Single-line text input that visually highlights `{{var}}` occurrences
 * and shows a hover popover listing each variable in the value with its
 * resolved value (or "unresolved" tag). Implementation mirrors the
 * JsonCodeArea overlay pattern: a transparent <input> stacked on top of
 * a styled <div> so the user types in plain text but sees colored vars.
 *
 * The popover is portaled to <body> with fixed positioning so it escapes
 * any ancestor with `overflow: hidden` (e.g. the rounded URL bar shell).
 */
export function VariableHighlightedInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  compact = false,
  type = 'text',
}: Props) {
  const vars = useActiveVariables();
  const tokens = tokenizeWithVariables(value, vars);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);

  const inputVars = listVarsInInput(value, vars);
  const hasVars = inputVars.length > 0;

  const syncScroll = () => {
    const ta = inputRef.current;
    const ov = overlayRef.current;
    if (!ta || !ov) return;
    ov.scrollLeft = ta.scrollLeft;
  };

  const padCls = compact ? 'px-1 py-0.5' : 'px-3 py-1.5';
  const fontCls = compact ? 'text-xs' : 'text-sm font-mono';

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className ?? ''}`}
      onMouseEnter={() => hasVars && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        ref={overlayRef}
        aria-hidden
        className={`absolute inset-0 m-0 ${padCls} ${fontCls} whitespace-pre overflow-hidden pointer-events-none flex items-center`}
        style={{ lineHeight: '1.5rem' }}
      >
        <span className="whitespace-pre">{renderTokens(tokens)}</span>
      </div>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className={`
          relative z-10 w-full m-0 ${padCls} ${fontCls}
          bg-transparent outline-none
          text-transparent
          selection:bg-blue-500/40
          placeholder:text-fg-subtle
          ${inputClassName ?? ''}
        `}
        style={{ lineHeight: '1.5rem', caretColor: 'var(--pc-fg)' }}
      />
      {hovering && hasVars ? (
        <VarHoverPopover anchorRef={wrapperRef} vars={inputVars} />
      ) : null}
    </div>
  );
}

function VarHoverPopover({
  anchorRef,
  vars,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  vars: ReturnType<typeof listVarsInInput>;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const node = anchorRef.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [anchorRef]);

  // Keep the popover anchored when the user scrolls or resizes mid-hover.
  useEffect(() => {
    const update = () => {
      const node = anchorRef.current;
      if (!node) return;
      const r = node.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div
      className="fixed z-50 bg-surface border border-line rounded-md shadow-lg p-2 min-w-[16rem] max-w-md text-xs"
      style={{ top: pos.top, left: pos.left }}
      role="tooltip"
    >
      <div className="text-fg-subtle mb-1 text-[10px] uppercase tracking-wide font-semibold">
        Variables in this field
      </div>
      <ul className="flex flex-col gap-1">
        {vars.map((v) => {
          if (v.type !== 'var') return null;
          return (
            <li key={v.name} className="flex items-baseline gap-2">
              <code className="font-mono text-fg">{`{{${v.name}}}`}</code>
              <span className="text-fg-subtle">→</span>
              {v.resolved ? (
                <span
                  style={{
                    color: v.isSecret
                      ? 'var(--pc-var-secret-fg)'
                      : 'var(--pc-var-resolved-fg)',
                  }}
                >
                  {v.isSecret ? '••••••' : v.value || <span className="italic text-fg-subtle">(empty)</span>}
                </span>
              ) : (
                <span style={{ color: 'var(--pc-var-missing-fg)' }}>unresolved</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>,
    document.body,
  );
}
