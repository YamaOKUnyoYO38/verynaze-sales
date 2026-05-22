export default function SectionCard({ icon: Icon, title, action, children, tone }) {
  const toneClass =
    tone === 'accent'
      ? 'border-accent/50 bg-accent/5'
      : tone === 'danger'
      ? 'border-red-200 bg-red-50/40'
      : 'border-slate-100';

  return (
    <section className={`card p-4 ${toneClass}`}>
      <header className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-50 text-primary-700">
              <Icon size={16} />
            </span>
          )}
          <h2 className="text-sm font-bold text-primaryDark">{title}</h2>
        </div>
        {action}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
