/**
 * PDCA Reader + Writer (Google Apps Script)
 * GET  -> devolve registos do separador "PDCA" em JSON (ou JSONP se vier ?callback=...)
 * POST -> adiciona (ou atualiza) um registo no separador "PDCA"
 *
 * Deployment:
 *  - Publica como Web App (Executar como: eu | Acesso: Qualquer pessoa com o link)
 *
 * Parâmetros GET:
 *  - ?item=123                  -> devolve só o Item=123
 *  - ?limit=100&offset=0        -> paginação
 *
 * POST:
 *  - JSON (application/json) OU
 *  - text/plain com JSON OU
 *  - application/x-www-form-urlencoded (FormData)
 */

const SPREADSHEET_ID = "1kep8pBEA2ZS0e-dKZKhrvJeOd-BghpZiXRJ2_WSFmzM";
const SHEET_NAME = "PDCA";

// Cabeçalhos oficiais (Sheets)
const HEADERS = [
  "Item",
  "Data de Registo",
  "Ano",
  "Origem da Ação",
  "Processo",
  "Ação a ser Realizada",
  "Requisito",
  "Norma",
  "Responsável",
  "Pertinência da ação",
  "Prazo",
  "Data de Conclusão",
  "Descrição",
  "Ação Corretiva",
  "Causa",
  "Status das Ações",
  "Análise da Eficácia",
  "Discussão Eficácia",
  "TIPO",
  "Análise",
  "contar OM",
  "contar NC",
  "Status CONCLUÍDO",
  "Status EFICAZ",
  "SOMATÓRIO DE AÇÕES"
];

/**
 * Aliases aceites vindos do frontend (as tuas labels “curtas”).
 * Chave = como pode vir do frontend | Valor = header oficial do Sheets
 */
const ALIASES = {
  // O teu frontend
  "Origem": "Origem da Ação",
  "Ação a Realizar": "Ação a ser Realizada",
  "Data Conclusão": "Data de Conclusão",
  "Status": "Status das Ações",
  "Eficácia": "Análise da Eficácia",

  // Variações comuns (para evitar chatices)
  "Data de conclusao": "Data de Conclusão",
  "Data conclusao": "Data de Conclusão",
  "Acao a Realizar": "Ação a ser Realizada",
  "Acao a ser Realizada": "Ação a ser Realizada",
  "Origem da Acao": "Origem da Ação",
  "Status das Acoes": "Status das Ações",
  "Analise da Eficacia": "Análise da Eficácia"
};

/* ----------------------- Handlers ----------------------- */

function doGet(e) {
  try {
    const sheet = getSheet_();
    ensureHeaders_(sheet);

    const params = (e && e.parameter) ? e.parameter : {};
    const action = (params.action || "").trim().toLowerCase();
    const item = (params.item || "").trim();
    const limit = clampInt_(params.limit, 1, 5000, 2000);
    const offset = clampInt_(params.offset, 0, 1000000, 0);

    // GET action=statusDistribution: retorna contagem de cada status
    if (action === "statusdistribution") {
      const data = sheet.getDataRange().getValues();
      const rows = data.slice(1);

      // Coluna "Status das Ações" está no índice 15
      const statusColumnIndex = HEADERS.indexOf("Status das Ações");
      if (statusColumnIndex === -1) {
        return output_({ ok: false, error: 'Coluna "Status das Ações" não encontrada' }, e);
      }

      // Contar ocorrências de cada status
      const statusCount = {};
      rows.forEach(row => {
        const status = String(row[statusColumnIndex] || "").trim();
        if (status) {
          statusCount[status] = (statusCount[status] || 0) + 1;
        }
      });

      return output_({ ok: true, statusDistribution: statusCount }, e);
    }

    // GET por item: lê só a linha (rápido)
    if (item) {
      const rowIndex = findRowByItem_(sheet, item);
      if (rowIndex === -1) return output_({ ok: true, data: null }, e);

      const row = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
      return output_({ ok: true, data: rowToObject_(row) }, e);
    }

    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1);

    let list = rows
      .filter(r => r.slice(0, HEADERS.length).some(v => String(v).trim() !== "")) // só colunas relevantes
      .map(row => rowToObject_(row));

    const total = list.length;
    list = list.slice(offset, offset + limit);

    return output_({ ok: true, total, offset, limit, data: list }, e);

  } catch (err) {
    return output_({ ok: false, error: String(err) }, e);
  }
}

function doPost(e) {
  try {
    const sheet = getSheet_();
    ensureHeaders_(sheet);

    const payload = getPayload_(e);
    if (!payload || typeof payload !== "object") {
      throw new Error("Payload não é um objeto.");
    }

    // Normaliza keys para os HEADERS (com aliases)
    const record = normalizeIncoming_(payload);

    // Gera Item se não vier
    if (!record["Item"] || String(record["Item"]).trim() === "") {
      record["Item"] = generateItemId_();
    }

    // Se "Data de Registo" estiver vazia
    if (!record["Data de Registo"] || String(record["Data de Registo"]).trim() === "") {
      record["Data de Registo"] = new Date();
    }

    const item = String(record["Item"]).trim();
    const rowIndex = findRowByItem_(sheet, item);

    if (rowIndex === -1) {
      sheet.appendRow(objectToRow_(record));
      return output_({ ok: true, action: "created", item }, e);
    } else {
      const existing = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
      const merged = mergeRowWithRecord_(existing, record);
      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([merged]);
      return output_({ ok: true, action: "updated", item, row: rowIndex }, e);
    }

  } catch (err) {
    return output_({ ok: false, error: String(err) }, e);
  }
}

/* ----------------------- Helpers ----------------------- */

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Separador "${SHEET_NAME}" não encontrado.`);
  return sheet;
}

/**
 * Verifica headers de forma tolerante:
 * - compara normalizado (ignora espaços repetidos, underscores, acentos/variações)
 * - não liga a colunas extra depois dos HEADERS
 * - se a linha 1 estiver vazia, escreve os HEADERS
 */
function ensureHeaders_(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const normRow = firstRow.map(v => normalizeKey_(v));
  const normExpected = HEADERS.map(h => normalizeKey_(h));

  const isEmpty = normRow.every(v => v === "");
  if (isEmpty) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  const matches = normExpected.every((h, i) => (normRow[i] || "") === h);
  if (!matches) {
    const got = firstRow.map(v => String(v || "").trim()).join(" | ");
    throw new Error(
      "Cabeçalhos do separador PDCA não correspondem ao esperado (nas primeiras " + HEADERS.length + " colunas).\n" +
      "Linha 1 atual: " + got
    );
  }
}

function rowToObject_(row) {
  const obj = {};
  HEADERS.forEach((h, i) => {
    obj[h] = (row[i] === undefined) ? "" : row[i];
  });
  return obj;
}

function objectToRow_(obj) {
  return HEADERS.map(h => (obj[h] === undefined ? "" : obj[h]));
}

function mergeRowWithRecord_(existingRow, record) {
  const merged = existingRow.slice();
  HEADERS.forEach((h, i) => {
    if (Object.prototype.hasOwnProperty.call(record, h)) {
      merged[i] = record[h];
    }
  });
  return merged;
}

function findRowByItem_(sheet, item) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const idx0 = values.findIndex(v => String(v).trim() === item);
  return (idx0 === -1) ? -1 : (idx0 + 2);
}

function generateItemId_() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `PDCA-${y}${m}${day}-${hh}${mm}${ss}`;
}

function clampInt_(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function getPayload_(e) {
  if (!e) return {};

  if (e.postData && typeof e.postData.contents === "string") {
    const raw = e.postData.contents.trim();

    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {
        const qs = parseQueryString_(raw);
        if (qs && Object.keys(qs).length > 0) return qs;
      }
    }
  }

  if (e.parameter) return e.parameter;

  throw new Error("Body inválido. Enviar JSON, text/plain, querystring ou FormData.");
}

function parseQueryString_(s) {
  const out = {};
  const str = String(s || "").replace(/^\?/, "");
  if (!str || str.indexOf("=") === -1) return out;

  str.split("&").forEach(part => {
    if (!part) return;
    const eq = part.indexOf("=");
    const k = eq >= 0 ? part.slice(0, eq) : part;
    const v = eq >= 0 ? part.slice(eq + 1) : "";
    const key = decodeURIComponent((k || "").replace(/\+/g, " ")).trim();
    const val = decodeURIComponent((v || "").replace(/\+/g, " "));
    if (key) out[key] = val;
  });

  return out;
}

/**
 * Normaliza incoming keys para os HEADERS.
 * - aceita aliases (ex.: "Origem" -> "Origem da Ação")
 * - aceita variações tipo "dataConclusao", "Data_conclusão", etc.
 */
function normalizeIncoming_(payload) {
  const out = {};

  // Mapa base: chave normalizada -> header oficial
  const map = {};
  HEADERS.forEach(h => (map[normalizeKey_(h)] = h));

  // Mapa de aliases: chave normalizada do alias -> header oficial
  const aliasMap = {};
  Object.keys(ALIASES).forEach(k => {
    const official = ALIASES[k];
    aliasMap[normalizeKey_(k)] = official;
  });

  Object.keys(payload).forEach(k => {
    const nk = normalizeKey_(k);

    // 1) tenta match direto nos HEADERS
    let header = map[nk];

    // 2) tenta match via alias
    if (!header && aliasMap[nk]) header = aliasMap[nk];

    if (header) out[header] = payload[k];
  });

  return out;
}

function normalizeKey_(k) {
  return String(k || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\wáàâãäéèêëíìîïóòôõöúùûüç]/g, "_")
    .replace(/_+/g, "_");
}

function output_(data, e) {
  const callback = e && e.parameter ? (e.parameter.callback || "").trim() : "";

  if (!callback) {
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    output.addHeader("Access-Control-Allow-Origin", "*");
    output.addHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    output.addHeader("Access-Control-Allow-Headers", "Content-Type");
    return output;
  }

  const safeCallback = callback.replace(/[^\w$.]/g, "");
  const body = `${safeCallback}(${JSON.stringify(data)});`;
  const output = ContentService.createTextOutput(body);
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  output.addHeader("Access-Control-Allow-Origin", "*");
  output.addHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  output.addHeader("Access-Control-Allow-Headers", "Content-Type");
  return output;
}