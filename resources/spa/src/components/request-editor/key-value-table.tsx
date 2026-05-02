import type { KeyValue } from '@/api/types';
import { VariableHighlightedInput } from '@/components/variable-highlighted-input';

type Props = {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  placeholder: string;
};

export function KeyValueTable({ rows, onChange, placeholder }: Props) {
  const all = [...rows, { key: '', value: '', disabled: false }];

  const update = (i: number, patch: Partial<KeyValue>) => {
    const next = all.map((r, j) => (j === i ? { ...r, ...patch } : r));
    onChange(next.filter((r, idx) => idx < next.length - 1 || r.key !== '' || r.value !== ''));
  };

  const remove = (i: number) => {
    onChange(rows.filter((_, j) => j !== i));
  };

  return (
    <table className="w-full text-sm">
      <thead className="text-[10px] text-fg-subtle text-left uppercase tracking-wide bg-surface-2">
        <tr>
          <th className="w-8"></th>
          <th className="px-2 py-1.5 font-medium">Key</th>
          <th className="px-2 py-1.5 font-medium">Value</th>
          <th className="w-8"></th>
        </tr>
      </thead>
      <tbody>
        {all.map((row, i) => {
          const isTrailer = i === all.length - 1;
          return (
            <tr
              key={i}
              className={`border-t border-line-subtle ${
                row.disabled ? 'opacity-50' : ''
              }`}
            >
              <td className="px-2 py-0.5 text-center">
                {!isTrailer ? (
                  <input
                    type="checkbox"
                    checked={!row.disabled}
                    onChange={(e) => update(i, { disabled: !e.target.checked })}
                    className="accent-accent"
                  />
                ) : null}
              </td>
              <td className="px-2 py-0.5">
                <VariableHighlightedInput
                  value={row.key}
                  onChange={(next) => update(i, { key: next })}
                  placeholder={`${placeholder} key`}
                  compact
                  className="w-full"
                />
              </td>
              <td className="px-2 py-0.5">
                <VariableHighlightedInput
                  value={row.value}
                  onChange={(next) => update(i, { value: next })}
                  placeholder="value"
                  compact
                  className="w-full"
                />
              </td>
              <td className="px-2 py-0.5 text-center">
                {!isTrailer ? (
                  <button
                    onClick={() => remove(i)}
                    className="text-fg-subtle hover:text-status-error text-base leading-none"
                    aria-label="Remove row"
                  >×</button>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
