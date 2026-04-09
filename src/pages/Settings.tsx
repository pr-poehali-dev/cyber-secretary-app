/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

// ─── Типы апелляционных сроков ────────────────────────────────────────────────

interface AppealRule {
  id: string;
  label: string;
  description: string;
  days: number;
  basis: string;
}

const DEFAULT_RULES: AppealRule[] = [
  {
    id: "sentence",
    label: "Приговор суда первой инстанции",
    description: "Срок подачи апелляционной жалобы на приговор",
    days: 10,
    basis: "ст. 389.4 УПК РФ",
  },
  {
    id: "arrest",
    label: "Заключение под стражу / домашний арест",
    description: "Срок обжалования меры пресечения",
    days: 3,
    basis: "ст. 108 УПК РФ",
  },
  {
    id: "search",
    label: "Обыск / выемка",
    description: "Срок обжалования действий следователя",
    days: 3,
    basis: "ст. 125 УПК РФ",
  },
  {
    id: "refusal",
    label: "Отказ в возбуждении дела",
    description: "Срок обжалования постановления об отказе",
    days: 3,
    basis: "ст. 125 УПК РФ",
  },
  {
    id: "cassation",
    label: "Вступивший в силу приговор (кассация)",
    description: "Срок подачи кассационной жалобы",
    days: 180,
    basis: "ст. 401.3 УПК РФ",
  },
];

// ─── Настройки уведомлений ────────────────────────────────────────────────────

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  daysBefore: number;
}

const DEFAULT_NOTIF: NotifSetting[] = [
  { id: "reminder_1", label: "За 1 день", description: "Уведомление накануне истечения срока", enabled: true, daysBefore: 1 },
  { id: "reminder_3", label: "За 3 дня", description: "Раннее предупреждение о приближающемся сроке", enabled: true, daysBefore: 3 },
  { id: "reminder_7", label: "За 7 дней", description: "Недельное предупреждение", enabled: false, daysBefore: 7 },
];

// ─── Компонент ────────────────────────────────────────────────────────────────

export function SettingsSection() {
  const [rules, setRules] = useState<AppealRule[]>(DEFAULT_RULES);
  const [notifs, setNotifs] = useState<NotifSetting[]>(DEFAULT_NOTIF);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDays, setEditDays] = useState<string>("");
  const [saved, setSaved] = useState(false);

  const startEdit = (rule: AppealRule) => {
    setEditingId(rule.id);
    setEditDays(String(rule.days));
  };

  const saveEdit = (id: string) => {
    const days = parseInt(editDays);
    if (!isNaN(days) && days > 0) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, days } : r));
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const toggleNotif = (id: string) =>
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "w-20 text-sm text-foreground bg-white border border-border rounded px-2 py-1 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors font-ibm text-center";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Настройки</h2>
        <Button
          onClick={handleSave}
          className="bg-[hsl(var(--primary))] text-white text-sm"
        >
          {saved
            ? <><Icon name="Check" size={14} className="mr-1.5" />Сохранено</>
            : <><Icon name="Save" size={14} className="mr-1.5" />Сохранить</>
          }
        </Button>
      </div>

      {/* ── Сроки обжалования ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Icon name="Clock" size={15} className="text-[hsl(var(--accent))]" />
          <h3 className="font-golos font-semibold text-sm text-foreground">Сроки обжалования</h3>
          <span className="ml-auto text-xs text-muted-foreground font-ibm">в календарных днях</span>
        </div>

        <div className="divide-y divide-border">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-ibm text-sm font-medium text-foreground">{rule.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">{rule.basis}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {editingId === rule.id ? (
                  <>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={editDays}
                      onChange={e => setEditDays(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(rule.id); if (e.key === "Escape") cancelEdit(); }}
                      autoFocus
                      className={inputCls}
                    />
                    <span className="text-xs text-muted-foreground">дн.</span>
                    <button onClick={() => saveEdit(rule.id)} className="text-emerald-600 hover:text-emerald-700 transition-colors">
                      <Icon name="Check" size={15} />
                    </button>
                    <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Icon name="X" size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className={`text-center rounded px-3 py-1 min-w-[52px] ${rule.days <= 3 ? "status-urgent" : rule.days <= 10 ? "status-paid" : "status-normal"}`}>
                      <span className="font-golos font-bold text-sm">{rule.days}</span>
                      <span className="text-[10px] ml-0.5">дн.</span>
                    </div>
                    <button onClick={() => startEdit(rule)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Icon name="Pencil" size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-secondary border-t border-border">
          <p className="text-xs text-muted-foreground font-ibm">
            <Icon name="Info" size={12} className="inline mr-1 mb-0.5" />
            По умолчанию срок обжалования меры пресечения — <strong>3 дня</strong> с даты вынесения приговора или заключения под стражу (ст. 108 УПК РФ).
            Изменения применяются при добавлении новых сроков.
          </p>
        </div>
      </div>

      {/* ── Уведомления ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Icon name="Bell" size={15} className="text-[hsl(var(--accent))]" />
          <h3 className="font-golos font-semibold text-sm text-foreground">Напоминания о сроках</h3>
        </div>
        <div className="divide-y divide-border">
          {notifs.map(n => (
            <div key={n.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-ibm text-sm font-medium text-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
              </div>
              <button
                onClick={() => toggleNotif(n.id)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${n.enabled ? "bg-[hsl(var(--primary))]" : "bg-slate-200"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${n.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Конфиденциальность ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Icon name="Shield" size={15} className="text-[hsl(var(--accent))]" />
          <h3 className="font-golos font-semibold text-sm text-foreground">Конфиденциальность и защита данных</h3>
        </div>
        <div className="p-5 space-y-4">
          {[
            { icon: "Lock", title: "Шифрование данных", desc: "Все данные хранятся в зашифрованном виде (AES-256). Ключи шифрования уникальны для каждой учётной записи.", badge: "Активно", ok: true },
            { icon: "Database", title: "Хранение данных", desc: "Данные хранятся на серверах в России. Передача за рубеж исключена.", badge: "РФ", ok: true },
            { icon: "EyeOff", title: "Конфиденциальность доверителей", desc: "Персональные данные доверителей доступны только авторизованным пользователям. Третьи лица к данным не допускаются.", badge: "Защищено", ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Icon name={item.icon as any} size={16} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-ibm text-sm font-medium text-foreground">{item.title}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded status-done shrink-0">{item.badge}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── О системе ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: "hsl(var(--accent))" }}>
            <Icon name="Scale" size={16} style={{ color: "hsl(222 45% 12%)" }} />
          </div>
          <div>
            <p className="font-golos font-bold text-sm text-foreground">LexDesk</p>
            <p className="text-xs text-muted-foreground font-ibm">Система управления адвокатской практикой</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><p className="text-muted-foreground">Версия</p><p className="font-semibold mt-0.5">1.0.0</p></div>
          <div><p className="text-muted-foreground">Лицензия</p><p className="font-semibold mt-0.5">Профессиональная</p></div>
          <div><p className="text-muted-foreground">Соответствие</p><p className="font-semibold mt-0.5">152-ФЗ, УПК РФ</p></div>
          <div><p className="text-muted-foreground">Обновление</p><p className="font-semibold mt-0.5">09.04.2026</p></div>
        </div>
      </div>
    </div>
  );
}