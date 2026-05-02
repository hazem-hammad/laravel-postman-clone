import { useRef, useState } from 'react';
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
  const [hovering, setHovering] = useState(false);

  const inputVars = listVarsInInput(value, vars);
  const hasVars = inputVars.length > 0;

  // Keep the overlay's horizontal scroll in sync with the input so colors
  // don't drift when the value is wider than the box.
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
      {hovering && hasVars ? <VarHoverPopover vars={inputVars} compact={compact} /> : null}
    </div>
  );
}

function VarHoverPopover({
  vars,
  compact,
}: {
  vars: ReturnType<typeof listVarsInInput>;
  compact: boolean;
}) {
  return (
    <div
      className={`absolute z-30 top-full left-0 mt-1 bg-surface border border-line rounded-md shadow-lg p-2 min-w-[16rem] max-w-md text-xs ${compact ? '' : ''}`}
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
                <span style={{ color: v.isSecret ? 'var(--pc-var-secret-fg)' : 'var(--pc-var-resolved-fg)' }}>
                  {v.isSecret ? '••••••' : v.value || <span className="italic text-fg-subtle">(empty)</span>}
                </span>
              ) : (
                <span style={{ color: 'var(--pc-var-missing-fg)' }}>unresolved</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
