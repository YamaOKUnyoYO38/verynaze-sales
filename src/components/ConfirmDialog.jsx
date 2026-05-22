import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title = '確認',
  description,
  confirmLabel = '実行',
  cancelLabel = 'キャンセル',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primaryDark/40 px-4 py-6">
      <div className="card max-w-md w-full p-5 space-y-4">
        <div className="flex items-start gap-3">
          {danger && (
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-100 text-danger shrink-0">
              <AlertTriangle size={18} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-bold text-primaryDark">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
