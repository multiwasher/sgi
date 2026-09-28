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
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const tz = Session.getScriptTimeZone();

  return values
    .map(r => {
      const obj = {};
      PLAN_AUDIT_FIELDS.forEach(([field]) => {
        obj[field] = fromSheetValue_(field, r[cols[field] - 1], tz);
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
  if (v instanceof Date) {
    if (field === "horario") return Utilities.formatDate(v, tz, "HH:mm");
    return Utilities.formatDate(v, tz, "yyyy-MM-dd");
  }
  return String(v).trim().replace(/\s+/g, " ");
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
