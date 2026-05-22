import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Database,
  Palette,
  Info,
  FileJson,
} from 'lucide-react';
import { db } from '../db/db.js';
import SectionCard from '../components/SectionCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import {
  exportAllAsJson,
  downloadJson,
  importFromJson,
} from '../utils/exportJson.js';
import { useToast } from '../components/ToastProvider.jsx';

const APP_VERSION = '0.1.0';

export default function SettingsPage() {
  const [counts, setCounts] = useState({ records: 0, drafts: 0, ideas: 0 });
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmImport, setConfirmImport] = useState(null);
  const fileRef = useRef(null);
  const toast = useToast();

  const refresh = async () => {
    const [records, drafts, ideas] = await Promise.all([
      db.records.count(),
      db.drafts.count(),
      db.productIdeas.count(),
    ]);
    setCounts({ records, drafts, ideas });
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleExport = async () => {
    try {
      const data = await exportAllAsJson();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(`requirement-quest-${stamp}.json`, data);
      toast.success('全データを書き出しました');
    } catch (e) {
      toast.error('エクスポートに失敗しました');
    }
  };

  const handleImportPick = () => {
    fileRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload || (!payload.records && !payload.productIdeas)) {
        toast.error('対応形式のJSONではありません');
        return;
      }
      setConfirmImport(payload);
    } catch (err) {
      toast.error('JSONの読み込みに失敗しました');
    }
  };

  const performImport = async (replace) => {
    const payload = confirmImport;
    setConfirmImport(null);
    if (!payload) return;
    try {
      await importFromJson(payload, { replace });
      await refresh();
      toast.success(
        replace ? '既存データを置き換えて読み込みました' : '追記で読み込みました'
      );
    } catch (e) {
      toast.error('インポートに失敗しました');
    }
  };

  const handleClearAll = async () => {
    setConfirmClear(false);
    try {
      await Promise.all([
        db.records.clear(),
        db.drafts.clear(),
        db.productIdeas.clear(),
      ]);
      await refresh();
      toast.success('全データを削除しました');
    } catch (e) {
      toast.error('削除に失敗しました');
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard icon={Database} title="DB内の記録件数">
        <div className="grid grid-cols-3 gap-2 text-center">
          <CountBox label="記録" value={counts.records} />
          <CountBox label="下書き" value={counts.drafts} />
          <CountBox label="プロダクト" value={counts.ideas} />
        </div>
        <p className="text-[11px] text-slate-500">
          データはこの端末のブラウザ内 (IndexedDB) に保存されています。
        </p>
      </SectionCard>

      <SectionCard icon={FileJson} title="データ管理">
        <div className="grid sm:grid-cols-2 gap-2">
          <button onClick={handleExport} className="btn-primary justify-center">
            <Download size={14} /> 全データJSONエクスポート
          </button>
          <button
            onClick={handleImportPick}
            className="btn-outline justify-center"
          >
            <Upload size={14} /> JSONインポート
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFile}
        />
        <p className="text-[11px] text-slate-500">
          インポート時は「追記」と「置き換え」を選択できます。
        </p>
      </SectionCard>

      <SectionCard icon={Trash2} title="危険な操作" tone="danger">
        <button
          onClick={() => setConfirmClear(true)}
          className="btn-danger w-full justify-center"
        >
          <Trash2 size={14} /> 全データを削除する
        </button>
        <p className="text-[11px] text-red-700">
          記録 / 下書き / プロダクトを含む全データを削除します。元に戻せません。
        </p>
      </SectionCard>

      <SectionCard icon={Palette} title="カラーテーマ">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Swatch name="Primary" hex="#1D4ED8" />
          <Swatch name="Primary Dark" hex="#0F172A" />
          <Swatch name="Accent" hex="#FACC15" />
          <Swatch name="Background" hex="#EFF6FF" />
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          青ベース + 黄色アクセント。学習・業務ツールとして使いやすく、
          重要操作は青、現在地と強調は黄色で表現しています。
        </p>
      </SectionCard>

      <SectionCard icon={Info} title="アプリ情報">
        <ul className="text-sm space-y-1">
          <li>
            アプリ名:{' '}
            <span className="font-semibold text-primaryDark">
              要件定義クエスト
            </span>
          </li>
          <li>サブタイトル: プロ現場準拠のSE要件定義トレーニング</li>
          <li>バージョン: v{APP_VERSION}</li>
          <li>保存方式: IndexedDB (Dexie.js)</li>
        </ul>
      </SectionCard>

      <ConfirmDialog
        open={confirmClear}
        title="本当に全データを削除しますか？"
        description="記録・下書き・プロダクト要件をすべて削除します。事前にJSONエクスポートをおすすめします。"
        confirmLabel="削除する"
        danger
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />

      {confirmImport && (
        <ImportDialog
          payload={confirmImport}
          onCancel={() => setConfirmImport(null)}
          onAppend={() => performImport(false)}
          onReplace={() => performImport(true)}
        />
      )}
    </div>
  );
}

function ImportDialog({ payload, onCancel, onAppend, onReplace }) {
  const rec = Array.isArray(payload.records) ? payload.records.length : 0;
  const ideas = Array.isArray(payload.productIdeas)
    ? payload.productIdeas.length
    : 0;
  const drafts = Array.isArray(payload.drafts) ? payload.drafts.length : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primaryDark/40 px-4 py-6">
      <div className="card max-w-md w-full p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-primaryDark">
            JSONをどう取り込みますか？
          </h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            読み込みファイル: 記録 {rec} 件 / プロダクト {ideas} 件 / 下書き{' '}
            {drafts} 件
          </p>
        </div>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>
            ・<b className="text-primary-700">追記</b>:
            既存データを残し、ファイル内容を追加します
          </li>
          <li>
            ・<b className="text-danger">置き換え</b>:
            既存データを全削除してから取り込みます (元に戻せません)
          </li>
        </ul>
        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={onCancel} className="btn-outline">
            キャンセル
          </button>
          <button type="button" onClick={onAppend} className="btn-primary">
            追記して取り込む
          </button>
          <button type="button" onClick={onReplace} className="btn-danger">
            置き換えて取り込む
          </button>
        </div>
      </div>
    </div>
  );
}

function CountBox({ label, value }) {
  return (
    <div className="rounded-xl bg-primary-50 px-3 py-3">
      <p className="text-[11px] text-primary-700 font-semibold">{label}</p>
      <p className="text-2xl font-bold text-primaryDark">{value}</p>
    </div>
  );
}

function Swatch({ name, hex }) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="h-10" style={{ background: hex }} />
      <div className="px-2 py-1.5">
        <p className="text-[11px] font-bold text-primaryDark">{name}</p>
        <p className="text-[10px] text-slate-500 font-mono">{hex}</p>
      </div>
    </div>
  );
}
