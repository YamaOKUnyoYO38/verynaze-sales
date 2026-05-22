import { NavLink } from 'react-router-dom';
import {
  Home,
  ClipboardList,
  Database,
  Lightbulb,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'ホーム', end: true },
  { to: '/exercise', icon: ClipboardList, label: '演習' },
  { to: '/records', icon: Database, label: '記録' },
  { to: '/product', icon: Lightbulb, label: 'プロダクト' },
  { to: '/settings', icon: Settings, label: '設定' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden safe-bottom">
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition',
                  isActive
                    ? 'text-primaryDark'
                    : 'text-slate-500 hover:text-primary-700',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'flex items-center justify-center w-10 h-7 rounded-full transition',
                      isActive ? 'bg-accent text-primaryDark' : '',
                    ].join(' ')}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export { NAV_ITEMS };
