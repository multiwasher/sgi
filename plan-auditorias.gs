/**
 * Plano Anual de Auditorias - Reader/Writer
 *
 * Folha: "PLAN_AUDITORIAS" do ficheiro Plano Anual de Reuniões e Auditorias - SOMENGIL
 * Cabeçalho (linha 1):
 *   A Mês | B Data Planeada | C Horário | D Local | E Nome do Processo | F Nome do Auditor |
 *   G Local da Auditoria | H Data Realizada | I Nome do Gestor do Processo | J Observações | K ID
 *
 * A coluna K (ID) é criada/preenchida automaticamente e identifica cada linha de forma estável
 * (permite ordenar/filtrar a folha sem estragar as edições feitas no frontend).
 *
 * GET  ?callback=...                         -> { ok, rows: [...] } (JSONP se vier callback)
 * POST (FormData) action=create, data=JSON   -> cria linha
 * POST (FormData) action=update, id, data=JSON -> atualiza só os campos enviados
 * POST (FormData) action=delete, id          -> apaga linha
 *
 * Campos do objeto "data" (e das rows devolvidas):
 *   mes, dataPlaneada (yyyy-mm-dd), horario (HH:mm), local, processo, auditor,
 *   localAuditoria, dataRealizada (yyyy-mm-dd), gestor, observacoes, id
 *
 * Primeira utilização: correr seedPlanAuditorias() no editor (só escreve se a folha estiver vazia).
 *
 * Separador "REUNIÕES" (Calendário de Reuniões), no mesmo deploy:
 * GET  ?sheet=REUNIÕES&callback=...                                  -> { ok, rows: [{ row, title, responsible, schedule, raw }] }
 * POST (FormData) action=meetingStatus, row, title, month (1-12), status (done|planned|failed|vazio)
 */

const PLAN_AUDIT_SPREADSHEET_ID = "1_awdBC4HJRQ5geBhQ0DNYQMKmAhNsRMah4mLxRr_OJ0";
const PLAN_AUDIT_SHEET_NAME = "PLAN_AUDITORIAS";

// campo do frontend -> cabeçalho na folha (a ordem define as colunas A:K)
const PLAN_AUDIT_FIELDS = [
  ["mes", "Mês"],
  ["dataPlaneada", "Data Planeada"],
  ["horario", "Horário"],
  ["local", "Local"],
  ["processo", "Nome do Processo"],
  ["auditor", "Nome do Auditor"],
  ["localAuditoria", "Local da Auditoria"],
  ["dataRealizada", "Data Realizada"],
  ["gestor", "Nome do Gestor do Processo"],
  ["observacoes", "Observações"],
  ["id", "ID"]
];

const PLAN_AUDIT_DATE_FIELDS = ["dataPlaneada", "dataRealizada"];

// =========
// HTTP
// =========
function doGet(e) {
  try {
    if (isMeetingsRequest_(e)) {
      return output_({ ok: true, rows: readMeetings_(getMeetingsSheet_()).rows }, e);
    }
    const sheet = getPlanAuditSheet_();
    const cols = ensurePlanAuditHeaders_(sheet);
    return output_({ ok: true, rows: readPlanAuditRows_(sheet, cols) }, e);
  } catch (err) {
    return output_({ ok: false, error: String(err) }, e);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const p = (e && e.parameter) || {};
    const action = String(p.action || "").trim();
    const data = p.data ? JSON.parse(p.data) : {};

    if (action === "meetingStatus") {
      return output_(setMeetingStatus_(p), e);
    }

    const sheet = getPlanAuditSheet_();
    const cols = ensurePlanAuditHeaders_(sheet);

    if (action === "create") {
      data.id = Utilities.getUuid();
      const newRow = sheet.getLastRow() + 1;
      PLAN_AUDIT_FIELDS.forEach(([field]) => {
        if (data[field] !== undefined) writeCell_(sheet.getRange(newRow, cols[field]), field, data[field]);
      });
      return output_({ ok: true, action, id: data.id }, e);
    }

    const id = String(p.id || "").trim();
    if (!id) throw new Error("Falta o parâmetro id.");
    const rowIndex = findPlanAuditRow_(sheet, cols, id);
    if (rowIndex === -1) throw new Error(`Auditoria com ID "${id}" não encontrada.`);

    if (action === "update") {
      PLAN_AUDIT_FIELDS.forEach(([field]) => {
        if (field === "id" || data[field] === undefined) return;
        writeCell_(sheet.getRange(rowIndex, cols[field]), field, data[field]);
      });
      return output_({ ok: true, action, id }, e);
    }

    if (action === "delete") {
      sheet.deleteRow(rowIndex);
      return output_({ ok: true, action, id }, e);
    }

    throw new Error(`Ação desconhecida: "${action}"`);
  } catch (err) {
    return output_({ ok: false, error: String(err) }, e);
  } finally {
    lock.releaseLock();
  }
}

// =========
// Folha
// =========
function getPlanAuditSheet_() {
  const ss = SpreadsheetApp.openById(PLAN_AUDIT_SPREADSHEET_ID);
  let sheet = ss.getSheetByName(PLAN_AUDIT_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(PLAN_AUDIT_SHEET_NAME);
  return sheet;
}

/**
 * Garante o cabeçalho, cria a coluna ID se faltar e atribui ID às linhas sem ID.
 * Devolve { campo: nºColuna } procurando pelos nomes do cabeçalho (não pela posição).
 */
function ensurePlanAuditHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, PLAN_AUDIT_FIELDS.length).setValues([PLAN_AUDIT_FIELDS.map(f => f[1])]);
    sheet.setFrozenRows(1);
  }

  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => normHeader_(h));
  const cols = {};
  PLAN_AUDIT_FIELDS.forEach(([field, header]) => {
    const idx = headers.indexOf(normHeader_(header));
    if (idx !== -1) cols[field] = idx + 1;
  });

  const missing = PLAN_AUDIT_FIELDS.filter(([field]) => field !== "id" && !cols[field]).map(f => f[1]);
  if (missing.length) throw new Error(`Colunas em falta no cabeçalho de ${PLAN_AUDIT_SHEET_NAME}: ${missing.join(", ")}`);

  if (!cols.id) {
    cols.id = lastCol + 1;
    sheet.getRange(1, cols.id).setValue("ID");
  }

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const idRange = sheet.getRange(2, cols.id, lastRow - 1, 1);
    const ids = idRange.getValues();
    const processos = sheet.getRange(2, cols.processo, lastRow - 1, 1).getValues();
    let changed = false;
    ids.forEach((r, i) => {
      if (String(r[0]).trim() === "" && String(processos[i][0]).trim() !== "") {
        r[0] = Utilities.getUuid();
        changed = true;
      }
    });
    if (changed) idRange.setValues(ids);
  }

  return cols;
}

function readPlanAuditRows_(sheet, cols) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  const values = range.getValues();
  // O Horário é lido tal como aparece na folha: uma hora guardada como tempo vem em getValues()
  // como uma data de 30/12/1899, e converter essa data com fusos horários desloca a hora.
  const display = range.getDisplayValues();
  const tz = sheet.getParent().getSpreadsheetTimeZone();

  return values
    .map((r, i) => {
      const obj = {};
      PLAN_AUDIT_FIELDS.forEach(([field]) => {
        const c = cols[field] - 1;
        obj[field] = field === "horario"
          ? normHorario_(display[i][c])
          : fromSheetValue_(field, r[c], tz);
      });
      return obj;
    })
    .filter(obj => obj.id && Object.keys(obj).some(k => k !== "id" && obj[k] !== ""));
}

function findPlanAuditRow_(sheet, cols, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, cols.id, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === id) return i + 2;
  }
  return -1;
}

// =========
// Conversões
// =========
function fromSheetValue_(field, v, tz) {
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date) return Utilities.formatDate(v, tz, "yyyy-MM-dd");
  return String(v).trim().replace(/\s+/g, " ");
}

// "10:30:00" / "10h30" / "9.00" -> "10:30" / "9:00"; outros textos ficam como estão
function normHorario_(v) {
  const s = String(v || "").trim();
  const m = s.match(/^(\d{1,2})\s*[:hH.]\s*(\d{2})(?::\d{2})?$/);
  return m ? `${Number(m[1])}:${m[2]}` : s;
}

function toSheetValue_(field, v) {
  const s = String(v === null || v === undefined ? "" : v).trim();
  if (PLAN_AUDIT_DATE_FIELDS.includes(field)) {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return s;
}

/**
 * Escreve uma célula com o formato certo: datas como dd/mm/yyyy e Horário como texto
 * (para o Sheets não converter "10:30" numa data de 1899).
 */
function writeCell_(range, field, v) {
  if (field === "horario") range.setNumberFormat("@");
  if (PLAN_AUDIT_DATE_FIELDS.includes(field)) range.setNumberFormat("dd/mm/yyyy");
  range.setValue(toSheetValue_(field, v));
}

function normHeader_(h) {
  return String(h || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function output_(data, e) {
  if (!e || !e.parameter || !e.parameter.callback) {
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const callback = String(e.parameter.callback).replace(/[^\w$.]/g, "");
  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(data)})`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// =========
// REUNIÕES (Calendário de Reuniões)
// Cabeçalho: Tipo de Reunião | Responsável | Jan | Fev | ... | Dez  (colunas procuradas pelo nome)
// Cada célula de mês tem o estado: realizado / planeado / não realizado / vazio.
// =========
const MEETINGS_SHEET_NAME = "REUNIÕES";
const MEETING_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MEETING_STATUS_DEFAULT = { done: "🟢", planned: "🔵", failed: "🔴" };

function isMeetingsRequest_(e) {
  const sheet = e && e.parameter && e.parameter.sheet;
  return !!sheet && normHeader_(sheet) === normHeader_(MEETINGS_SHEET_NAME);
}

function getMeetingsSheet_() {
  const ss = SpreadsheetApp.openById(PLAN_AUDIT_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(MEETINGS_SHEET_NAME);
  if (!sheet) throw new Error(`Separador "${MEETINGS_SHEET_NAME}" não encontrado.`);
  return sheet;
}

function meetingCols_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(h => normHeader_(h));
  const find = (name) => headers.indexOf(normHeader_(name)) + 1;
  const cols = { tipo: find("Tipo de Reunião"), responsavel: find("Responsável"), months: MEETING_MONTHS.map(find) };
  const missing = [];
  if (!cols.tipo) missing.push("Tipo de Reunião");
  if (!cols.responsavel) missing.push("Responsável");
  cols.months.forEach((c, i) => { if (!c) missing.push(MEETING_MONTHS[i]); });
  if (missing.length) throw new Error(`Colunas em falta no cabeçalho de ${MEETINGS_SHEET_NAME}: ${missing.join(", ")}`);
  return cols;
}

// Aceita emojis (🟢🔵🔴), ✓/✔/✅/❌ e palavras (Realizado, Planeado, Não realizado...)
function parseMeetingStatus_(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  if (/🟢|✅|✔|✓/.test(s)) return "done";
  if (/🔵/.test(s)) return "planned";
  if (/🔴|❌|✖/.test(s)) return "failed";
  const n = normHeader_(s);
  if (/^(nao realizad|n\.?r\.?$|falhad|cancelad)/.test(n)) return "failed";
  if (/^(realizad|feito|feita|concluid|done|ok$)/.test(n)) return "done";
  if (/^(planead|agendad|previst|p$)/.test(n)) return "planned";
  return "other";
}

/**
 * Lê as reuniões. Devolve também "symbols": o texto que a folha já usa para cada estado,
 * para que ao gravar se mantenha a mesma convenção (em vez de impor emojis).
 */
function readMeetings_(sheet) {
  const cols = meetingCols_(sheet);
  const lastRow = sheet.getLastRow();
  const symbols = {};
  const rows = [];
  if (lastRow < 2) return { cols, rows, symbols };

  const display = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues();
  display.forEach((r, i) => {
    const title = String(r[cols.tipo - 1] || "").trim();
    if (!title) return;
    const schedule = {};
    const raw = {};
    cols.months.forEach((c, m) => {
      const text = String(r[c - 1] || "").trim();
      const status = parseMeetingStatus_(text);
      if (!status) return;
      schedule[m + 1] = status;
      if (status === "other") raw[m + 1] = text;
      else if (!symbols[status]) symbols[status] = text;
    });
    rows.push({ row: i + 2, title, responsible: String(r[cols.responsavel - 1] || "").trim(), schedule, raw });
  });
  return { cols, rows, symbols };
}

/** POST action=meetingStatus, row, title, month (1-12), status (done|planned|failed|vazio) */
function setMeetingStatus_(p) {
  const month = Number(p.month);
  const status = String(p.status || "").trim();
  if (!(month >= 1 && month <= 12)) throw new Error("Mês inválido.");
  if (status && !MEETING_STATUS_DEFAULT[status]) throw new Error(`Estado inválido: "${status}"`);

  const sheet = getMeetingsSheet_();
  const { cols, rows, symbols } = readMeetings_(sheet);

  // Confirma a linha pelo título (a folha pode ter sido reordenada entretanto)
  const title = String(p.title || "").trim();
  let target = rows.find(r => r.row === Number(p.row) && r.title === title) || rows.find(r => r.title === title);
  if (!target) throw new Error(`Reunião "${title}" não encontrada.`);

  const value = status ? (symbols[status] || MEETING_STATUS_DEFAULT[status]) : "";
  sheet.getRange(target.row, cols.months[month - 1]).setValue(value);
  return { ok: true, action: "meetingStatus", row: target.row, month, status, value };
}

// =========
// Valores iniciais (correr uma vez no editor)
// =========
function seedPlanAuditorias() {
  const sheet = getPlanAuditSheet_();
  const cols = ensurePlanAuditHeaders_(sheet);
  if (sheet.getLastRow() > 1) {
    Logger.log("A folha já tem dados — seed ignorado.");
    return;
  }

  const d = (day, month) => `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const JR_MF = "Joni Regalado & Mário Fragoso";
  const INT = "Auditoria Interna";
  const EXT = "Auditoria Externa [APCER]";

  // [mes, dataPlaneada, horario, local, processo, auditor, localAuditoria, dataRealizada, gestor, observacoes]
  const seed = [
    ["Abril", d(14, 4), "10:30", "SOMENGIL", "Compras", JR_MF, "Gabinete Compras", "", "Paulo Brioso", INT],
    ["Abril", d(14, 4), "10:30", "SOMENGIL", "Financeiro", JR_MF, "Gabinete Financeiro", "", "Lúcio Mota", INT],
    ["Abril", d(14, 4), "11:30", "SOMENGIL", "Logística Interna", JR_MF, "Armazém Logístico", "", "Carlos Tarenta", INT],
    ["Abril", d(14, 4), "12:30", "SOMENGIL", "Produção - Setor Montagem", JR_MF, "Chão de Fábrica", "", "Fábio Silva", INT],
    ["Abril", d(14, 4), "15:00", "SOMENGIL", "Pós Venda [Assistência Técnica]", JR_MF, "Gabinete de Pós-Venda", "", "Carina Robaina", INT],
    ["Abril", d(15, 4), "10:45", "SOMENGIL", "Comercial & Marketing", JR_MF, "Sala de Reuniões", "", "Tony Ventura", INT],
    ["Abril", d(15, 4), "11:30", "SOMENGIL", "Gestão de Negócio", JR_MF, "Sala de Reuniões", "", "Tony Ventura", INT],
    ["Abril", d(15, 4), "10:00", "SOMENGIL", "Gestão de Recursos", JR_MF, "Sala de Reuniões", "", "Tony Ventura", INT],
    ["Abril", d(15, 4), "10:30", "SOMENGIL", "SGQA", "Joni Regalado", "Gabinete Qualidade", "", "Mário Fragoso", INT],
    ["Abril", d(15, 4), "11:30", "SOMENGIL", "Engenharia", "Mário Fragoso", "Gabinete Qualidade", "", "Mário Fragoso", INT],
    ["Setembro", "", "14:00", "SOMENGIL", "SGQA - Ambiental", "Ana Reis", "Sala de Reuniões", "", "Mário Fragoso", INT],
    ["Outubro", "", "9:00", "SOMENGIL", "SGQA - Acompanhamento ISO 14001:2015", "Eng.º Daniel Nunes", "Somengil", "", "Daniel Nunes", EXT],
    ["Outubro", "", "9:00", "SOMENGIL", "SGQA - Renovação de Certificação ISO 9001:2015", "Eng.º Daniel Nunes", "Somengil", "", "Daniel Nunes", EXT]
  ];

  const width = sheet.getLastColumn();
  const rows = seed.map(values => {
    const row = new Array(width).fill("");
    PLAN_AUDIT_FIELDS.forEach(([field], i) => {
      if (field === "id") row[cols.id - 1] = Utilities.getUuid();
      else row[cols[field] - 1] = toSheetValue_(field, values[i]);
    });
    return row;
  });
  sheet.getRange(2, cols.horario, rows.length, 1).setNumberFormat("@");
  sheet.getRange(2, cols.dataPlaneada, rows.length, 1).setNumberFormat("dd/mm/yyyy");
  sheet.getRange(2, cols.dataRealizada, rows.length, 1).setNumberFormat("dd/mm/yyyy");
  sheet.getRange(2, 1, rows.length, width).setValues(rows);
  Logger.log(`${rows.length} auditorias inseridas.`);
}
