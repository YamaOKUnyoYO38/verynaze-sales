import { Outlet, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import BottomNav from './BottomNav.jsx';
import Sidebar from './Sidebar.jsx';

const TITLES = {
  '/': 'ホーム',
  '/exercise': '今日の演習',
  '/feedback': 'フィードバック入力',
  '/records': '記録一覧',
  '/product': '自分のプロダクト',
  '/settings': '設定',
};

function pickTitle(pathname) {
  if (pathname.startsWith('/records/')) return '記録詳細';
  return TITLES[pathname] || '要件定義クエスト';
}

export default function Layout() {
  const { pathname } = useLocation();
  const title = pickTitle(pathname);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <header className="md:ml-64 sticky top-0 z-30 bg-primaryDark text-white shadow-soft">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary md:hidden">
            <Shield size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-300 leading-none mb-0.5 md:hidden">
              要件定義クエスト
            </p>
            <h1 className="text-base font-bold truncate">{title}</h1>
          </div>
          <span className="hidden sm:inline-flex chip bg-accent text-primaryDark">
            Local DB
          </span>
        </div>
      </header>

      <main className="md:ml-64">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-28 md:pb-12">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
