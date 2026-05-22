export default function StatCard({ icon: Icon, label, value, unit, accent }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      {Icon && (
        <span
          className={[
            'flex items-center justify-center w-10 h-10 rounded-xl',
            accent ? 'bg-accent text-primaryDark' : 'bg-primary-50 text-primary-700',
          ].join(' ')}
        >
          <Icon size={20} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
        <p className="text-xl font-bold text-primaryDark leading-tight">
          {value}
          {unit && (
            <span className="text-xs font-medium text-slate-500 ml-1">{unit}</span>
          )}
        </p>
      </div>
    </div>
  );
}
