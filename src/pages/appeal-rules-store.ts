// Shared store для правил апелляционных сроков.
// Используется и в Настройках (редактирование), и при создании нового срока.

export interface AppealRule {
  id: string;
  label: string;
  description: string;
  days: number;
  basis: string;
  deadlineType: "appeal" | "complaint" | "motion" | "response";
}

export const DEFAULT_RULES: AppealRule[] = [
  {
    id: "sentence",
    label: "Приговор суда первой инстанции",
    description: "Срок подачи апелляционной жалобы на приговор",
    days: 10,
    basis: "ст. 389.4 УПК РФ",
    deadlineType: "appeal",
  },
  {
    id: "arrest",
    label: "Заключение под стражу / домашний арест",
    description: "Срок обжалования меры пресечения",
    days: 3,
    basis: "ст. 108 УПК РФ",
    deadlineType: "appeal",
  },
  {
    id: "search",
    label: "Обыск / выемка",
    description: "Срок обжалования действий следователя",
    days: 3,
    basis: "ст. 125 УПК РФ",
    deadlineType: "complaint",
  },
  {
    id: "refusal",
    label: "Отказ в возбуждении дела",
    description: "Срок обжалования постановления об отказе",
    days: 3,
    basis: "ст. 125 УПК РФ",
    deadlineType: "motion",
  },
  {
    id: "cassation",
    label: "Вступивший в силу приговор (кассация)",
    description: "Срок подачи кассационной жалобы",
    days: 180,
    basis: "ст. 401.3 УПК РФ",
    deadlineType: "complaint",
  },
];

// Простой in-memory синглтон — оба раздела читают одно и то же
let _rules: AppealRule[] = DEFAULT_RULES.map(r => ({ ...r }));
const _listeners = new Set<() => void>();

export function getRules(): AppealRule[] {
  return _rules;
}

export function setRules(updated: AppealRule[]) {
  _rules = updated.map(r => ({ ...r }));
  _listeners.forEach(fn => fn());
}

export function subscribeRules(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
