export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
  id,
  monospace,
}) {
  const inputId = id || (label ? `f-${label}` : undefined);
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          'input resize-y leading-relaxed',
          monospace ? 'font-mono text-[13px]' : 'text-sm',
        ].join(' ')}
      />
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
