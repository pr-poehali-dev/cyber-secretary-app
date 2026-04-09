// Генераторы документов: PDF (печать) и DOC (скачивание)
import type { Client } from "./types-and-data";

export interface PetitionItem {
  id: string;
  name: string;
  rate: number;
  fromInv: boolean;
  invDate?: string;
  checked: boolean;
}

// ─── Число прописью ───────────────────────────────────────────────────────────

export function numberToWords(n: number): string {
  if (n === 0) return "ноль";
  const ones = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять",
    "десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать",
    "шестнадцать","семнадцать","восемнадцать","девятнадцать"];
  const tens = ["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
  const hundreds = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];
  const onesF = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять",
    "десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать",
    "шестнадцать","семнадцать","восемнадцать","девятнадцать"];

  function chunk(num: number, feminine: boolean): string {
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;
    const rem = num % 100;
    let res = "";
    if (h) res += hundreds[h] + " ";
    if (rem < 20) {
      res += (feminine ? onesF[rem] : ones[rem]);
    } else {
      res += tens[t];
      if (o) res += " " + (feminine ? onesF[o] : ones[o]);
    }
    return res.trim();
  }

  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  let result = "";
  if (th) {
    result += chunk(th, true) + " ";
    const lastTwo = th % 100;
    const lastOne = th % 10;
    if (lastTwo >= 11 && lastTwo <= 19) result += "тысяч ";
    else if (lastOne === 1) result += "тысяча ";
    else if (lastOne >= 2 && lastOne <= 4) result += "тысячи ";
    else result += "тысяч ";
  }
  if (rest) result += chunk(rest, false);
  return result.trim();
}

// ─── Общий шаблон документа ──────────────────────────────────────────────────

function buildDocumentBody(client: Client, items: PetitionItem[], total: number, forWord = false): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const totalInWords = numberToWords(total);

  const tdStyle = forWord
    ? `border:1px solid #ccc;padding:6px 10px;`
    : `padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;`;

  const rows = items.map((it, idx) => `
    <tr>
      <td style="${tdStyle}text-align:center;color:#374151;">${idx + 1}.</td>
      <td style="${tdStyle}">
        ${it.name}${it.invDate ? ` <span style="color:#6b7280;font-size:11px;">(${it.invDate})</span>` : ""}
      </td>
      <td style="${tdStyle}text-align:right;white-space:nowrap;">${it.rate.toLocaleString("ru-RU")} руб.</td>
    </tr>`).join("");

  return `
  <div style="text-align:right;margin-bottom:${forWord ? "24pt" : "32px"};">
    <p style="margin:2px 0;font-size:${forWord ? "13pt" : "13px"};">В суд по уголовному делу № ${client.caseNumber}</p>
    <p style="margin:2px 0;font-size:${forWord ? "13pt" : "13px"};">от адвоката, действующего в интересах</p>
    <p style="margin:2px 0;font-weight:bold;">${client.name}</p>
  </div>

  <h1 style="text-align:center;font-size:${forWord ? "14pt" : "16px"};font-weight:bold;text-transform:uppercase;margin:${forWord ? "20pt 0 10pt" : "24px 0 20px"};">Ходатайство</h1>
  <p style="text-align:center;font-size:${forWord ? "13pt" : "13px"};margin-bottom:${forWord ? "20pt" : "24px"};">об оплате труда адвоката по назначению</p>

  <p style="text-align:justify;">В производстве находится уголовное дело по обвинению <strong>${client.name}</strong>
  в совершении преступления, предусмотренного ${client.category}.</p>

  <p style="text-align:justify;">В период предварительного следствия мной были выполнены следующие процессуальные действия:</p>

  <table style="width:100%;border-collapse:collapse;margin:${forWord ? "12pt 0" : "16px 0"};">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="${forWord ? "border:1px solid #ccc;" : "border-bottom:2px solid #d1d5db;"} padding:8px 12px;text-align:center;font-size:12px;width:40px;">№</th>
        <th style="${forWord ? "border:1px solid #ccc;" : "border-bottom:2px solid #d1d5db;"} padding:8px 12px;text-align:left;font-size:12px;">Наименование действия</th>
        <th style="${forWord ? "border:1px solid #ccc;" : "border-bottom:2px solid #d1d5db;"} padding:8px 12px;text-align:right;font-size:12px;width:130px;">Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr style="background:#f9fafb;">
        <td colspan="2" style="${tdStyle}font-weight:bold;font-size:14px;${forWord ? "" : "border-top:2px solid #374151;"}padding:10px 12px;">ИТОГО к выплате:</td>
        <td style="${tdStyle}font-weight:bold;font-size:14px;text-align:right;${forWord ? "" : "border-top:2px solid #374151;"}padding:10px 12px;">${total.toLocaleString("ru-RU")} руб.</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align:justify;">Общая сумма вознаграждения составляет <strong>${total.toLocaleString("ru-RU")} (${totalInWords}) рублей</strong>.</p>

  <p style="text-align:justify;">На основании изложенного и в соответствии со ст. 50, 51 УПК РФ, Постановлением Правительства РФ
  № 1240 от 01.12.2012, прошу:</p>

  <p style="text-align:justify;"><strong>Вынести постановление об оплате труда адвоката в размере ${total.toLocaleString("ru-RU")} рублей.</strong></p>

  <div style="margin-top:${forWord ? "40pt" : "40px"};display:flex;justify-content:space-between;align-items:flex-end;">
    <div><p style="margin:0;font-size:${forWord ? "12pt" : "13px"};">${dateStr}</p></div>
    <div style="text-align:center;">
      <div style="border-top:1px solid #000;width:200px;padding-top:4px;font-size:${forWord ? "12pt" : "12px"};">Адвокат</div>
    </div>
  </div>`;
}

// ─── PDF через iframe + window.print() ───────────────────────────────────────

export function generatePetitionPdf(client: Client, items: PetitionItem[], total: number) {
  const body = buildDocumentBody(client, items, total, false);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ходатайство об оплате труда адвоката</title>
  <style>
    @page { margin: 20mm 25mm; size: A4; }
    body { font-family: "Times New Roman", Times, serif; font-size: 14px; line-height: 1.6; color: #000; margin: 0; padding: 0; }
    p { margin: 12px 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>${body}</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow!.document;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow!.focus();
  setTimeout(() => {
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 300);
}

// ─── DOC скачивание (HTML-in-Word) ───────────────────────────────────────────

export function generatePetitionHtml(client: Client, items: PetitionItem[], total: number) {
  const body = buildDocumentBody(client, items, total, true);
  const content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Ходатайство</title>
<style>
  body { font-family: "Times New Roman", Times, serif; font-size: 14pt; margin: 2cm 3cm; }
  p { text-align: justify; margin: 8pt 0; }
</style></head>
<body>${body}</body>
</html>`;

  const blob = new Blob(["\uFEFF" + content], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ходатайство_${client.name.split(" ")[0]}_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}