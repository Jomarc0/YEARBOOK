import Icon from "./Icon";

export function TH({ children, className = "", style }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-slate-200 bg-slate-50 px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500 ${className}`}
      style={style}
    >
      {children}
    </th>
  );
}

export function TD({ children, className = "", style }) {
  return (
    <td className={`border-b border-slate-100 px-5 py-4 align-middle text-sm text-slate-700 ${className}`} style={style}>
      {children}
    </td>
  );
}

export function Pager({ from, to, total, hasPrev, hasNext, onPrev, onNext }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
      <span>
        {total > 0 ? `Showing ${from} to ${to} of ${total} entries` : "Showing 0 entries"}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <Icon name="chevronRight" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function TableWrapper({ children, className = "" }) {
  return (
    <div className={`admin-shell-card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-[780px] w-full border-collapse">
          {children}
        </table>
      </div>
    </div>
  );
}
