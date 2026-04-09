/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { adminFetchUsers, adminUpdateUser, adminFetchSettings, adminUpdateSettings } from "@/api";

const STATUS_LABEL: Record<string, string> = {
  free: "Бесплатный",
  active: "Оплачен",
  trial: "Пробный",
  trial_expired: "Истёк",
  blocked: "Заблокирован",
};

const STATUS_COLOR: Record<string, string> = {
  free: "bg-emerald-50 text-emerald-700 border-emerald-200",
  active: "bg-blue-50 text-blue-700 border-blue-200",
  trial: "bg-amber-50 text-amber-700 border-amber-200",
  trial_expired: "bg-red-50 text-red-700 border-red-200",
  blocked: "bg-gray-100 text-gray-500 border-gray-300",
};

export function AdminPanel() {
  const [tab, setTab] = useState<"users" | "settings">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<any>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    Promise.all([adminFetchUsers(), adminFetchSettings()]).then(([u, s]) => {
      setUsers(u);
      setSettings(s);
      setSettingsForm({ price_rub: s.price_rub, period_days: s.period_days, payment_info: s.payment_info });
    }).finally(() => setLoading(false));
  }, []);

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({
      status: user.status || "trial",
      paid_until: user.paid_until ? user.paid_until.split("T")[0] : "",
      trial_days: user.trial_days ?? 10,
      note: user.note || "",
    });
  };

  const saveUser = async (id: number) => {
    setSaving(true);
    try {
      const payload: any = {
        status: editForm.status,
        trial_days: Number(editForm.trial_days),
        note: editForm.note,
        paid_until: editForm.status === "active" && editForm.paid_until ? editForm.paid_until : null,
      };
      const updated = await adminUpdateUser(id, payload);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated, access: computeAccess(updated) } : u));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const computeAccess = (sub: any) => {
    const s = sub.status;
    if (s === "free") return { status: "free" };
    if (s === "blocked") return { status: "blocked" };
    if (s === "active" && sub.paid_until && new Date(sub.paid_until) > new Date()) return { status: "active" };
    const trialStart = new Date(sub.trial_started_at || Date.now());
    const days = sub.trial_days ?? 10;
    const daysLeft = days - Math.floor((Date.now() - trialStart.getTime()) / 86400000);
    return { status: daysLeft > 0 ? "trial" : "trial_expired" };
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const updated = await adminUpdateSettings({
        price_rub: Number(settingsForm.price_rub),
        period_days: Number(settingsForm.period_days),
        payment_info: settingsForm.payment_info,
      });
      setSettings(updated);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } finally {
      setSettingsSaving(false);
    }
  };

  const inputCls = "w-full text-sm text-foreground bg-secondary border border-border rounded px-3 py-1.5 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors font-ibm";

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--primary))]">
          <Icon name="ShieldCheck" size={16} className="text-white" />
        </div>
        <h2 className="font-golos font-bold text-xl text-foreground">Панель администратора</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {(["users", "settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded text-sm font-ibm transition-all ${tab === t ? "bg-[hsl(var(--primary))] text-white" : "bg-white border border-border text-foreground hover:bg-secondary"}`}>
            {t === "users" ? <><Icon name="Users" size={14} className="inline mr-1.5" />Пользователи</> : <><Icon name="Settings" size={14} className="inline mr-1.5" />Настройки оплаты</>}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-4 lg:px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="font-golos font-semibold text-sm">Пользователи ({users.length})</h3>
            <p className="text-xs text-muted-foreground font-ibm">Кликните на строку для редактирования</p>
          </div>
          <div className="divide-y divide-border">
            {users.map(user => {
              const accessStatus = user.access?.status || user.status || "trial";
              const isEditing = editingId === user.id;
              return (
                <div key={user.id} className="px-4 lg:px-5 py-3">
                  {!isEditing ? (
                    <div className="flex items-start gap-3 cursor-pointer" onClick={() => startEdit(user)}>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 font-golos font-bold text-xs text-foreground">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-golos font-semibold text-sm text-foreground truncate">{user.full_name || "—"}</p>
                          {user.is_admin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Admin</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLOR[accessStatus] ?? "bg-secondary text-muted-foreground border-border"}`}>
                            {STATUS_LABEL[accessStatus] ?? accessStatus}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-ibm">{user.email}</p>
                        {user.note && <p className="text-xs text-muted-foreground mt-0.5 italic truncate">{user.note}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {user.access?.expires_label || ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-golos font-semibold text-sm">{user.full_name || user.email}</p>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Статус</p>
                          <select className={inputCls} value={editForm.status} onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))}>
                            <option value="trial">Пробный (trial)</option>
                            <option value="active">Оплачен (active)</option>
                            <option value="free">Бесплатный (free)</option>
                            <option value="blocked">Заблокирован (blocked)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Пробных дней</p>
                          <input type="number" className={inputCls} value={editForm.trial_days} onChange={e => setEditForm((f: any) => ({ ...f, trial_days: e.target.value }))} min={1} max={365} />
                        </div>
                        {editForm.status === "active" && (
                          <div className="col-span-2 space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Оплачено до</p>
                            <input type="date" className={inputCls} value={editForm.paid_until} onChange={e => setEditForm((f: any) => ({ ...f, paid_until: e.target.value }))} />
                          </div>
                        )}
                        <div className="col-span-2 space-y-1">
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Заметка</p>
                          <input className={inputCls} value={editForm.note} onChange={e => setEditForm((f: any) => ({ ...f, note: e.target.value }))} placeholder="Внутренняя заметка об оплате..." />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveUser(user.id)} disabled={saving} className="bg-[hsl(var(--primary))] text-white text-xs">
                          {saving ? "Сохранение..." : <><Icon name="Check" size={13} className="mr-1" />Сохранить</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="text-xs">Отмена</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-4 lg:px-5 py-3.5 border-b border-border">
            <h3 className="font-golos font-semibold text-sm">Настройки оплаты</h3>
          </div>
          <div className="p-4 lg:p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Цена подписки (₽)</p>
                <input type="number" className={inputCls} value={settingsForm.price_rub}
                  onChange={e => setSettingsForm((f: any) => ({ ...f, price_rub: e.target.value }))} min={0} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Срок подписки (дней)</p>
                <input type="number" className={inputCls} value={settingsForm.period_days}
                  onChange={e => setSettingsForm((f: any) => ({ ...f, period_days: e.target.value }))} min={1} max={365} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Реквизиты / инструкция оплаты</p>
              <textarea className={inputCls + " resize-none"} rows={5} value={settingsForm.payment_info}
                onChange={e => setSettingsForm((f: any) => ({ ...f, payment_info: e.target.value }))}
                placeholder="Перевод на карту Сбербанк: 4276 XXXX XXXX XXXX&#10;В комментарии укажите ваш email." />
              <p className="text-[10px] text-muted-foreground">Этот текст увидит пользователь при истечении пробного периода</p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={saveSettings} disabled={settingsSaving} className="bg-[hsl(var(--primary))] text-white text-sm">
                {settingsSaving ? "Сохранение..." : <><Icon name="Save" size={15} className="mr-1.5" />Сохранить настройки</>}
              </Button>
              {settingsSaved && (
                <span className="text-sm text-emerald-600 flex items-center gap-1 font-ibm">
                  <Icon name="CheckCircle" size={15} /> Сохранено
                </span>
              )}
            </div>

            <div className="bg-secondary rounded-lg p-4 border border-border mt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Как работает система доступа</p>
              <div className="space-y-1.5 text-xs text-muted-foreground font-ibm">
                <p><span className="font-semibold text-amber-600">Пробный</span> — пользователь работает N дней бесплатно (по умолчанию 10)</p>
                <p><span className="font-semibold text-blue-600">Оплачен</span> — доступ открыт до указанной даты</p>
                <p><span className="font-semibold text-emerald-600">Бесплатный</span> — бессрочный доступ без оплаты (для партнёров)</p>
                <p><span className="font-semibold text-gray-500">Заблокирован</span> — доступ закрыт принудительно</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
