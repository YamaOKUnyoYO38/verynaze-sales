import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { NAV_ITEMS } from './BottomNav.jsx';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-primaryDark text-slate-100 border-r border-slate-800">
      <div className="px-5 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white">
            <Shield size={20} />
          </span>
          <div>
            <p className="text-base font-bold leading-tight">要件定義クエスト</p>
            <p className="text-[11px] text-slate-400">
              プロ現場準拠のSE要件定義トレーニング
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-accent text-primaryDark shadow-soft'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon size={18} strokeWidth={2.2} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-5 py-4 border-t border-slate-800 text-[11px] text-slate-500">
        v0.1.0 / Local-first
      </div>
    </aside>
  );
}
