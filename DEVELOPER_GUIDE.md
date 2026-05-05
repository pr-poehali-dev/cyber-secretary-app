# LexDesk — Руководство разработчика

## Содержание

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Требования к окружению](#2-требования-к-окружению)
3. [Получение исходного кода](#3-получение-исходного-кода)
4. [Запуск фронтенда локально](#4-запуск-фронтенда-локально)
5. [Бэкенд: облачные функции](#5-бэкенд-облачные-функции)
6. [База данных](#6-база-данных)
7. [Структура проекта](#7-структура-проекта)
8. [Ключевые файлы и их назначение](#8-ключевые-файлы-и-их-назначение)
9. [Как добавить новый раздел](#9-как-добавить-новый-раздел)
10. [Как добавить новый API-эндпоинт](#10-как-добавить-новый-api-эндпоинт)
11. [Стилизация и UI-компоненты](#11-стилизация-и-ui-компоненты)
12. [Деплой изменений](#12-деплой-изменений)
13. [Частые ошибки и их решение](#13-частые-ошибки-и-их-решение)

---

## 1. Обзор архитектуры

LexDesk — Single Page Application (SPA). Состоит из трёх независимых слоёв:

```
┌─────────────────────────────────────────┐
│           БРАУЗЕР (React SPA)           │
│  src/ — Vite + React + TypeScript       │
│  Все запросы к бэкенду через src/api.ts │
└──────────────┬──────────────────────────┘
               │ HTTPS (fetch)
               │ ?path=/clients  ← путь через query-параметр
               ▼
┌─────────────────────────────────────────┐
│        ОБЛАЧНЫЕ ФУНКЦИИ (Python)        │
│  backend/api/       — основное API      │
│  backend/auth/      — авторизация       │
│  backend/billing/   — подписки/оплата   │
│  backend/notify/    — email-уведомления │
│  Хостинг: poehali.dev                   │
└──────────────┬──────────────────────────┘
               │ psycopg2 (DATABASE_URL)
               ▼
┌─────────────────────────────────────────┐
│         PostgreSQL (облачная БД)        │
│  Схема: t_p21225702_cyber_secretary_app │
│  Хостинг: poehali.dev                   │
└─────────────────────────────────────────┘
```

**Важные особенности платформы:**
- Облачные функции не поддерживают sub-paths в URL. Путь передаётся через `?path=/endpoint`
- БД доступна только из облачных функций (не с локального компьютера)
- Секреты (`DATABASE_URL`, ключи) — только через переменные окружения в облаке

---

## 2. Требования к окружению

| Инструмент | Версия | Зачем |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18+ | Запуск фронтенда |
| [Bun](https://bun.sh/) | последняя | Менеджер пакетов (вместо npm/yarn) |
| [Python](https://python.org/) | 3.11 | Локальная разработка бэкенда |
| [Git](https://git-scm.com/) | любая | Работа с кодом |
| [VS Code](https://code.visualstudio.com/) | любая | Рекомендуемый редактор |

**Установка Bun:**
```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Рекомендуемые расширения VS Code:**
- `dbaeumer.vscode-eslint` — линтер TypeScript
- `bradlc.vscode-tailwindcss` — подсказки Tailwind
- `ms-python.python` — поддержка Python
- `Prisma.prisma` — подсветка SQL (опционально)

---

## 3. Получение исходного кода

Скачать код можно двумя способами:

### Способ А — GitHub (рекомендуется)

На платформе poehali.dev: **Скачать → Подключить GitHub** → выбрать аккаунт → код уйдёт в репозиторий.

```bash
git clone https://github.com/ВАШ_АККАУНТ/ВАШ_РЕПОЗИТОРИЙ.git
cd ВАШ_РЕПОЗИТОРИЙ
```

### Способ Б — Скачать архив

**Скачать → Скачать код** → распакуйте ZIP.

---

## 4. Запуск фронтенда локально

```bash
# 1. Установить зависимости
bun install

# 2. Запустить dev-сервер
bun dev
```

Откройте браузер: **http://localhost:5173**

Фронтенд сразу работает в связке с облачным бэкендом — никаких дополнительных настроек не нужно. Все API-запросы уходят на `https://functions.poehali.dev/...`.

### Сборка продакшн-версии

```bash
bun build
# Результат в папке dist/
```

### Доступные команды

| Команда | Описание |
|---|---|
| `bun dev` | Dev-сервер с hot reload |
| `bun build` | Продакшн-сборка |
| `bun lint` | Проверка кода ESLint |
| `bun preview` | Предпросмотр сборки |

---

## 5. Бэкенд: облачные функции

Каждая функция — это отдельный Python-сервис в папке `backend/`.

### Структура функции

```
backend/
└── api/
    ├── index.py          ← точка входа, функция handler()
    ├── requirements.txt  ← Python-зависимости
    └── tests.json        ← тест-кейсы для деплоя
```

### Точка входа (index.py)

```python
def handler(event: dict, context) -> dict:
    """Описание функции."""
    # event содержит:
    # - event["httpMethod"]              — GET, POST, PUT, PATCH, DELETE
    # - event["queryStringParameters"]   — dict с query-параметрами
    # - event["body"]                    — строка, нужно json.loads()
    # - event["headers"]                 — заголовки запроса
    # - event["path"]                    — путь (НЕ надёжен, используй ?path=)
    
    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"ok": True})
    }
```

### Роутинг через ?path=

Платформа poehali.dev не передаёт sub-paths в функцию стандартно. Решение — передавать путь через query-параметр:

```
# Фронтенд делает запрос:
GET https://functions.poehali.dev/49e90f24...?path=/clients

# Бэкенд читает:
qs = event.get("queryStringParameters") or {}
path = qs.get("path") or event.get("path", "/")
```

### Переменные окружения в функциях

Секреты доступны через `os.environ`:

```python
import os
db_url = os.environ["DATABASE_URL"]      # строка подключения к БД
aws_key = os.environ["AWS_ACCESS_KEY_ID"] # ключ S3-хранилища
```

Управление секретами — через интерфейс poehali.dev (раздел **Ядро → Секреты**).

### Локальное тестирование функций

БД доступна только из облака, поэтому полностью локально функции не запустить. Для отладки используйте заглушки:

```python
# Запуск локально для проверки логики (без БД)
import json

def mock_event(method, path, body=None, qs=None):
    return {
        "httpMethod": method,
        "queryStringParameters": {"path": path, **(qs or {})},
        "body": json.dumps(body) if body else None,
        "headers": {}
    }

class MockContext:
    request_id = "local-test"

if __name__ == "__main__":
    event = mock_event("GET", "/clients")
    result = handler(event, MockContext())
    print(result)
```

---

## 6. База данных

PostgreSQL, схема: `t_p21225702_cyber_secretary_app`

### Таблицы

| Таблица | Описание |
|---|---|
| `users` | Пользователи системы |
| `sessions` | Сессии авторизации |
| `clients` | Доверители |
| `client_history` | История работы по доверителю |
| `tasks` | Задачи/расписание |
| `investigations` | Следственные действия |
| `investigation_types` | Типы следственных действий |
| `deadlines` | Сроки обжалования |
| `admin_settings` | Настройки системы |
| `subscriptions` | Подписки пользователей |

### Как посмотреть данные

Через платформу: **Ядро → База данных** — там есть SQL-консоль.

### Миграции (изменение схемы БД)

Все изменения схемы — только через файлы миграций в `db_migrations/`:

```
db_migrations/
├── V0001__init_schema.sql
├── V0002__add_users.sql
...
└── V0011__update_test_data.sql
```

**Правило именования:** `V{номер}__{описание}.sql`

Пример новой миграции:
```sql
-- db_migrations/V0012__add_notes_to_clients.sql
ALTER TABLE t_p21225702_cyber_secretary_app.clients
  ADD COLUMN notes TEXT DEFAULT '';
```

Применяется через интерфейс poehali.dev или через инструмент `migrate_db`.

### Работа с БД из функции (psycopg2)

```python
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p21225702_cyber_secretary_app"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

# Чтение
with get_conn() as conn:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {SCHEMA}.clients WHERE id = %s", (client_id,))
        row = dict(cur.fetchone())

# Запись
with get_conn() as conn:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.clients (name) VALUES (%s) RETURNING *",
            (name,)
        )
        row = dict(cur.fetchone())
    conn.commit()  # ← обязательно для INSERT/UPDATE/DELETE
```

**Важно:** использовать только `psycopg2` (Simple Query Protocol). `asyncpg` и `psycopg3` не поддерживаются.

---

## 7. Структура проекта

```
lexdesk/
├── src/                          ← Фронтенд (React)
│   ├── App.tsx                   ← Главный роутер
│   ├── api.ts                    ← Все вызовы к бэкенду
│   ├── auth.ts                   ← Логика авторизации
│   ├── index.css                 ← Глобальные стили + CSS-переменные
│   ├── components/
│   │   └── ui/                   ← UI-компоненты (shadcn/ui + кастомные)
│   ├── hooks/                    ← Переиспользуемые React-хуки
│   ├── lib/
│   │   └── utils.ts              ← Утилиты (cn(), и др.)
│   └── pages/                    ← Разделы приложения
│       ├── DashboardPlanning.tsx ← Дашборд + Планирование
│       ├── ClientDetailPanel.tsx ← Доверители
│       ├── InvestigationsSection.tsx
│       ├── DeadlinesSection.tsx
│       ├── PetitionsSection.tsx  ← Ходатайства на оплату
│       ├── AnalyticsSection.tsx
│       ├── Settings.tsx
│       ├── AuthPage.tsx          ← Вход/регистрация
│       ├── api.ts                ← Все вызовы к бэкенду
│       └── types-and-data.ts    ← TypeScript-типы
│
├── backend/                      ← Бэкенд (Python облачные функции)
│   ├── api/                      ← Основной API (доверители, задачи, дела...)
│   ├── auth/                     ← Авторизация и сессии
│   ├── billing/                  ← Управление подпиской
│   ├── notify/                   ← Email-уведомления
│   └── func2url.json             ← URL каждой функции (авто)
│
├── db_migrations/                ← SQL-миграции БД (Flyway)
│
├── public/                       ← Статичные файлы
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 8. Ключевые файлы и их назначение

### `src/api.ts`

Единственное место где фронтенд обращается к бэкенду. Все функции экспортируются и используются в компонентах:

```typescript
// Пример использования в компоненте:
import { fetchClients, createClient } from "@/api";

const clients = await fetchClients();
const newClient = await createClient({ name: "Иванов", ... });
```

**Как устроен URL:**
```typescript
const BASE = "https://functions.poehali.dev/49e90f24-...";
// Путь /clients превращается в:
// https://functions.poehali.dev/49e90f24-...?path=/clients
```

### `src/App.tsx`

Главный роутер. Здесь описана навигация и какой компонент рендерится на какой вкладке.

### `src/index.css`

CSS-переменные цветовой палитры. Чтобы изменить цвета во всём приложении — меняйте только здесь:

```css
:root {
  --primary: 222 45% 25%;    /* Основной цвет (кнопки, акценты) */
  --accent: 43 85% 55%;      /* Цвет акцента (золотой) */
  --background: 210 20% 97%; /* Фон */
  /* ... */
}
```

### `tailwind.config.ts`

Конфигурация Tailwind. Цвета подключены через CSS-переменные из `index.css`. Здесь же — кастомные шрифты и анимации.

### `backend/func2url.json`

Автоматически обновляется платформой при деплое. Содержит URL каждой облачной функции. **Не редактировать вручную.**

---

## 9. Как добавить новый раздел

Пример: добавляем раздел «Договоры».

### Шаг 1 — Создать компонент страницы

```typescript
// src/pages/ContractsSection.tsx
import { useState, useEffect } from "react";
import { fetchContracts } from "@/api";
import { LoadError } from "@/components/ui/load-error";

export function ContractsSection() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setLoadError(false);
    fetchContracts()
      .then(setContracts)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Загрузка...</div>;
  if (loadError) return <LoadError onRetry={loadData} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="font-golos font-bold text-xl">Договоры</h2>
      {/* ... */}
    </div>
  );
}
```

### Шаг 2 — Добавить API-функцию

```typescript
// src/api.ts — добавить в конец файла
export function fetchContracts() {
  return request<any[]>("/contracts");
}

export function createContract(data: Record<string, any>) {
  return request<any>("/contracts", { method: "POST", body: JSON.stringify(data) });
}
```

### Шаг 3 — Добавить роут в App.tsx

Найти массив вкладок навигации и добавить новый пункт по аналогии с существующими.

### Шаг 4 — Добавить эндпоинт в бэкенд

В `backend/api/index.py` добавить блок перед последней строкой `return resp({"error": "Not found"}, 404)`:

```python
# ── /contracts ────────────────────────────────────────────────────────────
if path == "/contracts":
    if method == "GET":
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT * FROM {SCHEMA}.contracts ORDER BY id")
                rows = cur.fetchall()
        return resp([dict(r) for r in rows])
```

### Шаг 5 — Создать таблицу в БД

```sql
-- db_migrations/V0012__add_contracts.sql
CREATE TABLE t_p21225702_cyber_secretary_app.contracts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES t_p21225702_cyber_secretary_app.clients(id),
    title TEXT NOT NULL,
    amount INTEGER DEFAULT 0,
    signed_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 10. Как добавить новый API-эндпоинт

### На фронтенде (src/api.ts)

```typescript
// GET /documents
export function fetchDocuments() {
  return request<any[]>("/documents");
}

// GET /documents?type=contract
export function fetchDocumentsByType(type: string) {
  return request<any[]>(`/documents?type=${encodeURIComponent(type)}`);
}

// POST /documents
export function createDocument(data: { title: string; client: string }) {
  return request<any>("/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PUT /documents/123
export function updateDocument(id: number, data: Record<string, any>) {
  return request<any>(`/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE /documents/123
export function deleteDocument(id: number) {
  return request<any>(`/documents/${id}`, { method: "DELETE" });
}
```

### На бэкенде (backend/api/index.py)

```python
# ── /documents ────────────────────────────────────────────────────────────
if path == "/documents":
    type_filter = extra_qs.get("type", "")
    if method == "GET":
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if type_filter:
                    cur.execute(f"SELECT * FROM {SCHEMA}.documents WHERE type=%s", (type_filter,))
                else:
                    cur.execute(f"SELECT * FROM {SCHEMA}.documents ORDER BY id")
                rows = cur.fetchall()
        return resp([dict(r) for r in rows])

    if method == "POST":
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.documents (title, client) VALUES (%s, %s) RETURNING *",
                    (body["title"], body["client"])
                )
                row = dict(cur.fetchone())
            conn.commit()
        return resp(row, 201)

if path.startswith("/documents/"):
    doc_id = int(path.split("/")[2])
    if method == "DELETE":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {SCHEMA}.documents WHERE id=%s", (doc_id,))
            conn.commit()
        return resp({"ok": True})
```

---

## 11. Стилизация и UI-компоненты

### Цвета

Все цвета — CSS-переменные в `src/index.css`. В Tailwind используются через `hsl(var(--primary))`:

```tsx
// В компоненте:
<button className="bg-[hsl(var(--primary))] text-white">Кнопка</button>
<div className="border-[hsl(var(--accent))]">Акцент</div>
```

### Готовые UI-компоненты (shadcn/ui)

Все компоненты в `src/components/ui/`. Импортируются напрямую:

```tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon";  // Иконки lucide-react

// Использование иконок — ТОЛЬКО через компонент Icon, не напрямую из lucide-react:
<Icon name="User" size={20} />
<Icon name="AlertCircle" size={16} className="text-red-500" />
```

### Шрифты

В проекте два шрифта (подключены в `index.css`):
- `font-golos` — заголовки
- `font-ibm` — основной текст (IBM Plex Mono)

### Типичные паттерны вёрстки

```tsx
// Карточка с заголовком
<div className="bg-white rounded-lg border border-border overflow-hidden">
  <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
    <Icon name="Users" size={15} className="text-[hsl(var(--accent))]" />
    <h3 className="font-golos font-semibold text-sm">Заголовок</h3>
  </div>
  <div className="p-5">
    {/* содержимое */}
  </div>
</div>

// Поле ввода
<input className="w-full text-sm text-foreground bg-secondary border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors font-ibm" />

// Состояние загрузки
<div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">
  Загрузка...
</div>
```

---

## 12. Деплой изменений

### Фронтенд

Достаточно сделать `git push` — платформа автоматически соберёт и задеплоит.

Или вручную через интерфейс poehali.dev: **Опубликовать → Обновить**.

### Бэкенд

После изменения файлов в `backend/` — деплой через платформу poehali.dev (раздел **Ядро → Функции**) или через инструменты разработки в чате.

При деплое платформа:
1. Устанавливает зависимости из `requirements.txt`
2. Прогоняет тесты из `tests.json`
3. Активирует новую версию функции

### Миграции БД

Новые SQL-файлы в `db_migrations/` применяются через интерфейс poehali.dev (**Ядро → База данных → Миграции**).

---

## 13. Частые ошибки и их решение

### «Failed to fetch» / «Не удалось загрузить данные»

**Причина:** Cold start облачной функции (первый запрос после простоя занимает 2–5 сек).

**Решение:** В коде уже реализован retry — 3 попытки с интервалом 1.5с. Если ошибка повторяется — нажмите кнопку «Повторить» в интерфейсе.

### Функция возвращает 400 Bad Request на `/endpoint`

**Причина:** Платформа не передаёт sub-paths в функцию.

**Решение:** Путь передаётся через `?path=/endpoint`. Уже реализовано в `src/api.ts` — вручную менять не нужно.

### TypeScript-ошибка «noUnusedLocals»

```typescript
// Ошибка: переменная объявлена но не используется
const unused = 123; // ← удалить или использовать

// Или добавить в tsconfig.json:
"noUnusedLocals": false  // не рекомендуется
```

### psycopg2 не находит модуль

Убедитесь что `requirements.txt` содержит:
```
psycopg2-binary>=2.9.0
```
И передеплойте функцию.

### CORS-ошибка в браузере

Каждый endpoint в `backend/api/index.py` должен:
1. Обрабатывать `OPTIONS`-запрос в начале handler:
```python
if event.get("httpMethod") == "OPTIONS":
    return {"statusCode": 200, "headers": CORS, "body": ""}
```
2. Возвращать заголовки CORS во всех ответах (через `resp()` — уже включено).

### Данные не обновляются после изменения

React не перезагружает данные автоматически. Нужно вызвать `loadData()` вручную после мутации:

```typescript
const handleCreate = async () => {
  await createClient(formData);
  loadData(); // ← перезагрузить список
};
```

---

## Контакты и поддержка

- **Центр поддержки платформы:** https://poehali.dev/help
- **Сообщество Telegram:** https://t.me/+QgiLIa1gFRY4Y2Iy
- **Документация платформы:** https://docs.poehali.dev
