import type { KeyValue } from '@/api/types';

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
      <thead className="text-xs text-zinc-500 text-left">
        <tr>
          <th className="w-8"></th>
          <th className="px-2 py-1">Key</th>
          <th className="px-2 py-1">Value</th>
          <th className="w-8"></th>
        </tr>
      </thead>
      <tbody>
        {all.map((row, i) => {
          const isTrailer = i === all.length - 1;
          return (
            <tr key={i} className="border-t border-zinc-100">
              <td className="px-2 py-1 text-center">
                {!isTrailer ? (
                  <input
                    type="checkbox"
                    checked={!row.disabled}
                    onChange={(e) => update(i, { disabled: !e.target.checked })}
                  />
                ) : null}
              </td>
              <td className="px-2 py-1">
                <input
                  className="w-full bg-transparent border-0 outline-none px-1 py-0.5 focus:bg-zinc-50"
                  value={row.key}
                  placeholder={`${placeholder} key`}
                  onChange={(e) => update(i, { key: e.target.value })}
                />
              </td>
              <td className="px-2 py-1">
                <input
                  className="w-full bg-transparent border-0 outline-none px-1 py-0.5 focus:bg-zinc-50"
                  value={row.value}
                  placeholder="value"
                  onChange={(e) => update(i, { value: e.target.value })}
                />
              </td>
              <td className="px-2 py-1 text-center">
                {!isTrailer ? (
                  <button onClick={() => remove(i)} className="text-zinc-400 hover:text-red-600 text-xs">×</button>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
