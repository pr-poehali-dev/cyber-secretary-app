/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { apiLogin, apiRegister } from "@/auth";
import type { User } from "@/auth";

type Mode = "login" | "register";

interface Props {
  onAuth: (user: User) => void;
}

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!fullName.trim()) { setError("Введите ваше имя"); return; }
      if (password !== confirmPassword) { setError("Пароли не совпадают"); return; }
      if (password.length < 6) { setError("Пароль должен быть не менее 6 символов"); return; }
    }

    setLoading(true);
    try {
      const user = mode === "login"
        ? await apiLogin(email, password)
        : await apiRegister(email, password, fullName);
      onAuth(user);
    } catch (err: any) {
      setError(err.message ?? "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full text-sm text-foreground bg-white border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))/20] transition-colors font-ibm placeholder:text-muted-foreground";
  const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(220 20% 96%)" }}
    >
      {/* Card */}
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "hsl(var(--accent))" }}
          >
            <Icon name="Scale" size={20} style={{ color: "hsl(222 45% 12%)" }} />
          </div>
          <div>
            <p className="font-golos font-bold text-xl" style={{ color: "hsl(222 45% 14%)" }}>LexDesk</p>
            <p className="text-xs text-muted-foreground font-ibm">Адвокатская практика</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {([["login", "Вход"], ["register", "Регистрация"]] as [Mode, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`flex-1 py-3.5 text-sm font-golos font-semibold transition-colors ${
                  mode === key
                    ? "text-foreground border-b-2 border-[hsl(var(--primary))] -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* ФИО — только для регистрации */}
            {mode === "register" && (
              <div>
                <label className={labelCls}>Полное имя</label>
                <input
                  className={inputCls}
                  placeholder="Иванов Иван Иванович"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className={labelCls}>Email</label>
              <div className="relative">
                <Icon name="Mail" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={`${inputCls} pl-10`}
                  type="email"
                  placeholder="advocate@yandex.ru"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete={mode === "login" ? "username" : "email"}
                  required
                />
              </div>
              {mode === "register" && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  На этот адрес будут приходить напоминания о сроках
                </p>
              )}
            </div>

            {/* Пароль */}
            <div>
              <label className={labelCls}>Пароль</label>
              <div className="relative">
                <Icon name="Lock" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={`${inputCls} pl-10 pr-10`}
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Не менее 6 символов" : "••••••••"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={15} />
                </button>
              </div>
            </div>

            {/* Подтверждение пароля — только для регистрации */}
            {mode === "register" && (
              <div>
                <label className={labelCls}>Подтвердите пароль</label>
                <div className="relative">
                  <Icon name="Lock" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={`${inputCls} pl-10`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            )}

            {/* Ошибка */}
            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm">
                <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
                <span className="font-ibm">{error}</span>
              </div>
            )}

            {/* Кнопка */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(var(--primary))] text-white text-sm py-2.5 h-auto"
            >
              {loading
                ? <><Icon name="Loader" size={15} className="mr-2 animate-spin" />Подождите...</>
                : mode === "login" ? "Войти в систему" : "Создать аккаунт"
              }
            </Button>

            {/* Переключение режима */}
            <p className="text-center text-xs text-muted-foreground font-ibm">
              {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="text-[hsl(var(--primary))] hover:underline font-semibold"
              >
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-6 font-ibm">
          Данные защищены · AES-256 · 152-ФЗ
        </p>
      </div>
    </div>
  );
}