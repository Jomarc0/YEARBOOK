import Btn from "./Btn";
import Icon from "./Icon";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Icon name="warning" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black leading-tight text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm} icon="trash">Delete</Btn>
        </div>
      </div>
    </div>
  );
}
