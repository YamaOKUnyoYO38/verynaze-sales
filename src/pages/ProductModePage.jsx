import { useEffect, useState } from 'react';
import {
  Lightbulb,
  Users,
  AlertTriangle,
  Sparkles,
  Layers,
  Coins,
  Rocket,
  Map,
  ShieldAlert,
  Save,
  Trash2,
  Plus,
} from 'lucide-react';
import { db } from '../db/db.js';
import SectionCard from '../components/SectionCard.jsx';
import TextAreaField from '../components/TextAreaField.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { formatDateTime } from '../utils/date.js';
import { useToast } from '../components/ToastProvider.jsx';

const EMPTY = {
  productName: '',
  targetUser: '',
  problem: '',
  idea: '',
  preferredTech: '',
  monetization: '',
  mvpFeatures: '',
  futureFeatures: '',
  concerns: '',
};

export default function ProductModePage() {
  const [ideas, setIdeas] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const toast = useToast();

  const load = async () => {
    const rows = await db.productIdeas.orderBy('updatedAt').reverse().toArray();
    setIdeas(rows);
    return rows;
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY);
  };

  const handleSelect = (idea) => {
    setSelectedId(idea.id);
    setForm({ ...EMPTY, ...idea });
  };

  const handleSave = async () => {
    if (!form.productName.trim()) {
      toast.error('プロダクト名を入力してください');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (selectedId) {
        await db.productIdeas.update(selectedId, { ...form, updatedAt: now });
        toast.success('プロダクト要件を更新しました');
      } else {
        const id = await db.productIdeas.add({
          ...form,
          createdAt: now,
          updatedAt: now,
        });
        setSelectedId(id);
        toast.success('プロダクト要件を保存しました');
      }
      await load();
    } catch (e) {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    await db.productIdeas.delete(id);
    if (selectedId === id) handleNew();
    await load();
    toast.success('削除しました');
  };

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-4">
      <aside className="card p-3 space-y-2 lg:max-h-[calc(100vh-9rem)] lg:overflow-auto">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-sm font-bold text-primaryDark">
            保存済みアイデア
          </h2>
          <button onClick={handleNew} className="btn-accent px-3 py-1.5 text-xs">
            <Plus size={12} /> 新規
          </button>
        </div>
        {ideas.length === 0 ? (
          <p className="text-xs text-slate-500 px-1 py-3">
            まだ登録されていません。右のフォームから保存できます。
          </p>
        ) : (
          <ul className="space-y-1.5">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <button
                  onClick={() => handleSelect(idea)}
                  className={[
                    'w-full text-left rounded-xl px-3 py-2 transition border',
                    selectedId === idea.id
                      ? 'border-accent bg-accent/10'
                      : 'border-transparent hover:bg-primary-50',
                  ].join(' ')}
                >
                  <p className="font-semibold text-sm text-primaryDark truncate">
                    {idea.productName || '(無題)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    更新 {formatDateTime(idea.updatedAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="space-y-4">
        <SectionCard icon={Lightbulb} title="自分のプロダクト要件定義">
          <TextAreaField
            label="作りたいもの (プロダクト名)"
            value={form.productName}
            onChange={update('productName')}
            rows={2}
            placeholder="例: 美容サロン向け予約管理アプリ"
          />
        </SectionCard>

        <div className="grid md:grid-cols-2 gap-4">
          <SectionCard icon={Users} title="ターゲット">
            <TextAreaField
              value={form.targetUser}
              onChange={update('targetUser')}
              rows={4}
              placeholder="ペルソナ / 利用シーン"
            />
          </SectionCard>
          <SectionCard icon={AlertTriangle} title="解決したい課題">
            <TextAreaField
              value={form.problem}
              onChange={update('problem')}
              rows={4}
            />
          </SectionCard>
          <SectionCard icon={Sparkles} title="今あるアイデア">
            <TextAreaField
              value={form.idea}
              onChange={update('idea')}
              rows={4}
            />
          </SectionCard>
          <SectionCard icon={Layers} title="使いたい技術">
            <TextAreaField
              value={form.preferredTech}
              onChange={update('preferredTech')}
              rows={4}
              placeholder="例: React / Vite / Tailwind / Dexie / Cloudflare"
            />
          </SectionCard>
          <SectionCard icon={Coins} title="収益化イメージ">
            <TextAreaField
              value={form.monetization}
              onChange={update('monetization')}
              rows={4}
            />
          </SectionCard>
          <SectionCard icon={Rocket} title="MVPで作る機能">
            <TextAreaField
              value={form.mvpFeatures}
              onChange={update('mvpFeatures')}
              rows={4}
            />
          </SectionCard>
          <SectionCard icon={Map} title="将来拡張">
            <TextAreaField
              value={form.futureFeatures}
              onChange={update('futureFeatures')}
              rows={4}
            />
          </SectionCard>
          <SectionCard icon={ShieldAlert} title="不安な点">
            <TextAreaField
              value={form.concerns}
              onChange={update('concerns')}
              rows={4}
            />
          </SectionCard>
        </div>

        <div className="card p-4 flex flex-wrap justify-between gap-2">
          <button
            onClick={handleNew}
            className="btn-outline"
            disabled={saving}
          >
            <Plus size={14} /> 新規作成
          </button>
          <div className="flex gap-2">
            {selectedId && (
              <button
                onClick={() => setConfirmDeleteId(selectedId)}
                className="btn-danger"
              >
                <Trash2 size={14} /> 削除
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              <Save size={14} /> {selectedId ? '更新する' : '保存する'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="このアイデアを削除しますか？"
        description="削除した内容は元に戻せません。"
        confirmLabel="削除する"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
