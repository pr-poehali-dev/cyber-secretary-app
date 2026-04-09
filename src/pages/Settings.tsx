/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { getRules, setRules as storeSetRules, subscribeRules } from "./appeal-rules-store";
import type { AppealRule } from "./appeal-rules-store";
import type { User } from "@/auth";
import { apiUpdateMe } from "@/auth";

const NOTIFY_URL = "https://functions.poehali.dev/f2fb4c5c-3848-4fe1-b5f6-727a2a12636a";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  user: User;
  onUserUpdate: (u: User) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_DAYS = [1, 3, 7, 14] as const;
const DAY_LABELS: Record<number, string> = {
  1: "За 1 день",
  3: "За 3 дня",
  7: "За 7 дней",
  14: "За 14 дней",
};
const DAY_DESC: Record<number, string> = {
  1: "Уведомление накануне истечения срока",
  3: "Раннее предупреждение о приближающемся сроке",
  7: "Недельное предупреждение",
  14: "Двухнедельное предупреждение",
};

// ─── Компонент ────────────────────────────────────────────────────────────────

export function SettingsSection({ user, onUserUpdate }: Props) {
  // Сроки обжалования
  const [rules, setRulesState] = useState<AppealRule[]>(getRules());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDays, setEditDays] = useState<string>("");

  // Профиль
  const [fullName, setFullName] = useState(user.full_name);
  const [notifyEmail, setNotifyEmail] = useState(user.notify_email || user.email);
  const [notifyDays, setNotifyDays] = useState<number[]>(user.notify_days_before ?? [1, 3]);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Статусы
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => subscribeRules(() => setRulesState(getRules())), []);

  // ── Сроки обжалования ──────────────────────────────────────────────────────

  const startEdit = (rule: AppealRule) => {
    setEditingId(rule.id);
    setEditDays(String(rule.days));
  };

  const saveEdit = (id: string) => {
    const days = parseInt(editDays);
    if (!isNaN(days) && days > 0) {
      const updated = rules.map(r => r.id === id ? { ...r, days } : r);
      setRulesState(updated);
      storeSetRules(updated);
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  // ── Напоминания — переключение дней ─────────────────────────────────────────

  const toggleDay = (d: number) =>
    setNotifyDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b)
    );

  // ── Сохранить профиль ──────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setProfileError("");
    if (newPassword && newPassword.length < 6) {
      setProfileError("Новый пароль должен быть не менее 6 символов");
      return;
    }
    if (newPassword && !oldPassword) {
      setProfileError("Введите текущий пароль для его смены");
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await apiUpdateMe({
        fullName,
        notifyEmail,
        notifyDaysBefore: notifyDays,
        ...(newPassword ? { oldPassword, newPassword } : {}),
      });
      onUserUpdate(updated);
      setOldPassword("");
      setNewPassword("");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err: any) {
      setProfileError(err.message ?? "Ошибка сохранения");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Тестовое письмо ────────────────────────────────────────────────────────

  const handleTestEmail = async () => {
    if (!notifyEmail.trim()) {
      setTestMsg("Введите email перед отправкой");
      setTestStatus("error");
      return;
    }
    setTestStatus("sending");
    setTestMsg("");
    try {
      const res = await fetch(NOTIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: notifyEmail.trim(), test: true }),
      });
      const data = await res.json();
      if (res.ok && data.sent) {
        setTestStatus("ok");
        setTestMsg(`Письмо отправлено на ${notifyEmail}`);
      } else {
        setTestStatus("error");
        setTestMsg(data.error ?? "Ошибка отправки");
      }
    } catch {
      setTestStatus("error");
      setTestMsg("Не удалось связаться с сервером");
    }
    setTimeout(() => { setTestStatus("idle"); setTestMsg(""); }, 5000);
  };

  const inputCls = "w-full text-sm text-foreground bg-secondary border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors font-ibm placeholder:text-muted-foreground";
  const inputSmCls = "w-20 text-sm text-foreground bg-white border border-border rounded px-2 py-1 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors font-ibm text-center";
  const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h2 className="font-golos font-bold text-xl text-foreground">Настройки</h2>

      {/* ── Профиль ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Icon name="User" size={15} className="text-[hsl(var(--accent))]" />
          <h3 className="font-golos font-semibold text-sm text-foreground">Профиль</h3>
          <span className="ml-auto text-xs text-muted-foreground font-ibm">{user.email}</span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Полное имя</label>
            <input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
          </div>

          {/* Смена пароля */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelCls + " mb-0"}>Смена пароля</p>
              <button onClick={() => setShowPasswords(v => !v)} className="text-xs text-blue-600 hover:underline font-ibm">
                {showPasswords ? "Скрыть" : "Изменить пароль"}
              </button>
            </div>
            {showPasswords && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Текущий пароль</label>
                  <input type="password" className={inputCls} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Введите текущий пароль" autoComplete="current-password" />
                </div>
                <div>
                  <label className={labelCls}>Новый пароль</label>
                  <input type="password" className={inputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Не менее 6 символов" autoComplete="new-password" />
                </div>
              </div>
            )}
          </div>

          {profileError && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-xs">
              <Icon name="AlertCircle" size={14} className="shrink-0 mt-0.5" />
              <span className="font-ibm">{profileError}</span>
            </div>
          )}

          <Button onClick={handleSaveProfile} disabled={profileSaving} className="w-full bg-[hsl(var(--primary))] text-white text-sm">
            {profileSaving
              ? <><Icon name="Loader" size={14} className="mr-1.5 animate-spin" />Сохранение...</>
              : profileSaved
              ? <><Icon name="Check" size={14} className="mr-1.5" />Сохранено</>
              : <><Icon name="Save" size={14} className="mr-1.5" />Сохранить профиль</>
            }
          </Button>
        </div>
      </div>

      {/* ── Email-уведомления ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Icon name="Mail" size={15} className="text-[hsl(var(--accent))]" />
          <h3 className="font-golos font-semibold text-sm text-foreground">Email-уведомления</h3>
        </div>
        <div className="p-5 space-y-5">

          {/* Адрес */}
          <div>
            <label className={labelCls}>Адрес для напоминаний</label>
            <div className="flex gap-2">
              <input type="email" className={`${inputCls} flex-1`} placeholder="advocate@yandex.ru" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} />
              <Button onClick={handleTestEmail} disabled={testStatus === "sending"} variant="outline" className="shrink-0 text-sm">
                {testStatus === "sending" && <Icon name="Loader" size={14} className="mr-1.5 animate-spin" />}
                {testStatus === "ok" && <Icon name="Check" size={14} className="mr-1.5 text-emerald-600" />}
                {testStatus === "error" && <Icon name="AlertCircle" size={14} className="mr-1.5 text-red-500" />}
                {testStatus === "idle" && <Icon name="Send" size={14} className="mr-1.5" />}
                {testStatus === "sending" ? "Отправка..." : "Тест"}
              </Button>
            </div>
            {testMsg && (
              <p className={`text-xs mt-1.5 ${testStatus === "ok" ? "text-emerald-600" : "text-red-500"}`}>{testMsg}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">Можно указать другой адрес, отличный от login-email</p>
          </div>

          {/* Когда отправлять */}
          <div>
            <label className={labelCls}>Когда отправлять напоминания</label>
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {ALL_DAYS.map(d => (
                <div key={d} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-ibm text-sm font-medium text-foreground">{DAY_LABELS[d]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{DAY_DESC[d]}</p>
                  </div>
                  <button
                    onClick={() => toggleDay(d)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${notifyDays.includes(d) ? "bg-[hsl(var(--primary))]" : "bg-slate-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${notifyDays.includes(d) ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Выбрано: {notifyDays.length > 0 ? notifyDays.map(d => `за ${d} ${d === 1 ? "день" : "дня"}`).join(", ") : "нет напоминаний"}
            </p>
          </div>

          <Button onClick={handleSaveProfile} disabled={profileSaving} className="w-full bg-[hsl(var(--primary))] text-white text-sm">
            {profileSaved
              ? <><Icon name="Check" size={14} className="mr-1.5" />Сохранено</>
              : <><Icon name="Save" size={14} className="mr-1.5" />Сохранить настройки уведомлений</>
            }
          </Button>

          {/* SMTP инструкция */}
          <div className="bg-secondary rounded-lg p-3.5 space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Icon name="Info" size={13} className="text-muted-foreground" />
              Настройка почтового сервера (для администратора)
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Для работы почты добавьте в настройки проекта два секрета:
            </p>
            <div className="space-y-1">
              {[
                { key: "SMTP_LOGIN", val: "ваш email отправителя" },
                { key: "SMTP_PASSWORD", val: "пароль приложения (не основной)" },
              ].map(({ key, val }) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <code className="bg-white border border-border rounded px-1.5 py-0.5 text-foreground font-mono shrink-0">{key}</code>
                  <span className="text-muted-foreground">{val}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { name: "Яндекс", url: "https://id.yandex.ru/security/app-passwords" },
                { name: "Gmail", url: "https://myaccount.google.com/apppasswords" },
                { name: "Mail.ru", url: "https://account.mail.ru/user/2-step-auth/passwords/" },
              ].map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] bg-white border border-border rounded px-2 py-1 text-blue-600 hover:text-blue-800 transition-colors">
                  {p.name}
                </a>
              ))}
            </div>
          </div>
        </div>
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
                    <input type="number" min="1" max="365" value={editDays} onChange={e => setEditDays(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(rule.id); if (e.key === "Escape") cancelEdit(); }}
                      autoFocus className={inputSmCls} />
                    <span className="text-xs text-muted-foreground">дн.</span>
                    <button onClick={() => saveEdit(rule.id)} className="text-emerald-600 hover:text-emerald-700 transition-colors"><Icon name="Check" size={15} /></button>
                    <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground transition-colors"><Icon name="X" size={15} /></button>
                  </>
                ) : (
                  <>
                    <div className={`text-center rounded px-3 py-1 min-w-[52px] ${rule.days <= 3 ? "status-urgent" : rule.days <= 10 ? "status-paid" : "status-normal"}`}>
                      <span className="font-golos font-bold text-sm">{rule.days}</span>
                      <span className="text-[10px] ml-0.5">дн.</span>
                    </div>
                    <button onClick={() => startEdit(rule)} className="text-muted-foreground hover:text-foreground transition-colors"><Icon name="Pencil" size={14} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-secondary border-t border-border">
          <p className="text-xs text-muted-foreground font-ibm">
            <Icon name="Info" size={12} className="inline mr-1 mb-0.5" />
            По умолчанию срок обжалования меры пресечения — <strong>3 дня</strong> (ст. 108 УПК РФ).
          </p>
        </div>
      </div>

      {/* ── Конфиденциальность ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Icon name="Shield" size={15} className="text-[hsl(var(--accent))]" />
          <h3 className="font-golos font-semibold text-sm text-foreground">Конфиденциальность</h3>
        </div>
        <div className="p-5 space-y-4">
          {[
            { icon: "Lock", title: "Шифрование данных", desc: "AES-256. Ключи уникальны для каждой учётной записи.", badge: "Активно" },
            { icon: "Database", title: "Хранение данных", desc: "Серверы в России, 152-ФЗ. Передача за рубеж исключена.", badge: "РФ" },
            { icon: "EyeOff", title: "Конфиденциальность", desc: "Данные доверителей доступны только авторизованному пользователю.", badge: "Защищено" },
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
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
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
          <div><p className="text-muted-foreground">Аккаунт</p><p className="font-semibold mt-0.5 truncate">{user.email}</p></div>
        </div>
      </div>
    </div>
  );
}
