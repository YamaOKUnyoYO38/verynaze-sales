export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  id,
}) {
  const inputId = id || (label ? `s-${label}` : undefined);
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <select
        id={inputId}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="input pr-9"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}
