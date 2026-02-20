/**
 * SWOT + R&O + Partes Interessadas Reader/Writer
 * 
 * GET  -> devolve dados do separador especificado (ou JSONP se vier ?callback=...)
 * POST -> adiciona um registo ao separador "SWOT"
 * 
 * Parâmetro: ?sheet=SWOT|R&O|Partes%20Interessadas (padrão: SWOT)
 */

const SPREADSHEET_ID = "1A0id_1DRMdpATDCB3Ctp8OZMqwwdj46BG5Pcdw2ULhw";

/**
 * GET: devolve dados de qualquer separador
 * Parâmetros: ?sheet=NomeSeparador&callback=...
 */
function doGet(e) {
  try {
    // Determina qual separador ler (padrão: Partes Interessadas)
    let sheetParam = "Partes Interessadas";
    
    if (e && e.parameter && e.parameter.sheet) {
      const param = String(e.parameter.sheet).trim();
      if (param !== "") {
        sheetParam = param;
      }
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetParam);

    if (!sheet) {
      const available = ss.getSheets().map(s => s.getName()).join(" | ");
      return output_({ ok: false, error: `Separador "${sheetParam}" não encontrado. Disponíveis: ${available}` }, e);
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    // Se não tem dados, retorna array vazio
    if (lastRow < 1 || lastCol < 1) {
      return output_([], e);
    }

    // Se tem só cabeçalho (1 linha), retorna array vazio
    if (lastRow < 2) {
      return output_([], e);
    }

    const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = values[0].map((h, idx) => {
      let name = String(h || "").trim();
      // Normalizas espaços múltiplos e quebras de linha em espaços simples
      name = name.replace(/\s+/g, " ");
      return name !== "" ? name : `COL_${idx + 1}`;
    });

    const rows = values.slice(1);

    const data = rows
      .map(r => {
        const obj = {};
        headers.forEach((h, i) => {
          const v = r[i];
          let value = (v === undefined || v === null) ? "" : String(v).trim();
          // Normalizas espaços múltiplos e quebras de linha em espaços simples
          value = value.replace(/\s+/g, " ");
          obj[h] = value;
        });
        return obj;
      })
      .filter(obj => Object.values(obj).some(v => v !== ""));

    return output_(data, e);

  } catch (err) {
    return output_({ ok: false, error: String(err), stack: err.stack }, e);
  }
}

/**
 * POST: adiciona registo ao separador SWOT
 *
 * Payload esperado (JSON):
 * {
 *   "swot": "INTERNAL STRENGTHS" | "FORÇAS" | ...,
 *   "codigo": "F01",
 *   "descricao": "texto...",
 *   "tomadaAcao": "S" | "N" | "SIM" | "NÃO",
 *   "acoes": [
 *      {"codigo":"A-01","acao":"..."},
 *      {"codigo":"A-02","acao":"..."}
 *   ]
 * }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return output_({ ok: false, error: "Pedido inválido: sem corpo (postData.contents)." }, e);
    }

    const payload = JSON.parse(e.postData.contents);

    // Normaliza campos base
    const swot = mapSwotToPt_(payload.swot);
    const codigo = safeStr_(payload.codigo);
    const descricao = safeStr_(payload.descricao);
    const tomada = mapTomadaAcao_(payload.tomadaAcao);

    if (!swot) return output_({ ok: false, error: "Campo obrigatório em falta: swot." }, e);
    if (!codigo) return output_({ ok: false, error: "Campo obrigatório em falta: codigo." }, e);
    if (!descricao) return output_({ ok: false, error: "Campo obrigatório em falta: descricao." }, e);

    // Ações: até 6
    const acoesIn = Array.isArray(payload.acoes) ? payload.acoes : [];
    const acoes = acoesIn.slice(0, 6).map(a => ({
      codigo: safeStr_(a && a.codigo),
      acao: safeStr_(a && a.acao)
    }));

    // Headers esperados para SWOT
    const headers = [
      "SWOT",
      "código",
      "Descrição",
      "TOMADA DE AÇÃO?",
      "CÓDIGO_AÇÃO 1", "AÇÃO 1",
      "CÓDIGO_AÇÃO 2", "AÇÃO 2",
      "CÓDIGO_AÇÃO 3", "AÇÃO 3",
      "CÓDIGO_AÇÃO 4", "AÇÃO 4",
      "CÓDIGO_AÇÃO 5", "AÇÃO 5",
      "CÓDIGO_AÇÃO 6", "AÇÃO 6"
    ];

    // Monta linha na ordem do cabeçalho SWOT
    const row = new Array(headers.length).fill("");

    row[0] = swot;
    row[1] = codigo;
    row[2] = descricao;
    row[3] = tomada; // "S" ou "N"

    // Preenche colunas de ações (pares)
    for (let i = 0; i < 6; i++) {
      const baseIdx = 4 + (i * 2);
      row[baseIdx] = acoes[i] ? acoes[i].codigo : "";
      row[baseIdx + 1] = acoes[i] ? acoes[i].acao : "";
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("SWOT");
    if (!sheet) throw new Error(`Separador "SWOT" não encontrado.`);

    // Validar que o cabeçalho bate certo
    ensureHeader_(sheet, headers);

    // Escreve no fim
    sheet.appendRow(row);

    return output_({ ok: true }, e);

  } catch (err) {
    return output_({ ok: false, error: String(err) }, e);
  }
}

/**
 * Devolve JSON normal ou JSONP (se vier callback)
 */
function output_(obj, e) {
  const callback = e && e.parameter ? e.parameter.callback : null;
  const payload = JSON.stringify(obj);

  if (callback && String(callback).trim() !== "") {
    return ContentService
      .createTextOutput(`${callback}(${payload});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

/* -------------------- Helpers -------------------- */

function safeStr_(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function norm_(s) {
  return safeStr_(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

/**
 * Mapeia os rótulos EN -> PT (SWOT)
 * INTERNAL STRENGTHS     = FORÇAS
 * INTERNAL WEAKNESSES    = FRAQUEZAS
 * EXTERNAL OPPORTUNITIES = OPORTUNIDADES
 * EXTERNAL THREATS       = AMEAÇAS
 */
function mapSwotToPt_(swotValue) {
  const v = norm_(swotValue);
  if (!v) return "";

  // EN (normalizado)
  if (v.includes("INTERNAL STRENGTHS")) return "FORÇAS";
  if (v.includes("INTERNAL WEAKNESSES")) return "FRAQUEZAS";
  if (v.includes("EXTERNAL OPPORTUNITIES")) return "OPORTUNIDADES";
  if (v.includes("EXTERNAL THREATS")) return "AMEAÇAS";

  // PT (normalizado)
  if (v.includes("FORCAS") || v === "F") return "FORÇAS";
  if (v.includes("FRAQUEZAS") || v.includes("FRAQUEZA")) return "FRAQUEZAS";
  if (v.includes("OPORTUNIDADES") || v === "O") return "OPORTUNIDADES";
  if (v.includes("AMEACAS") || v === "A") return "AMEAÇAS";

  // Se vier algo inesperado, guarda como está
  return safeStr_(swotValue);
}

/**
 * Aceita S/N, SIM/NÃO, YES/NO, TRUE/FALSE…
 * Normaliza para "S" ou "N".
 */
function mapTomadaAcao_(value) {
  const v = norm_(value);
  if (!v) return "N";

  const yes = ["S", "SIM", "Y", "YES", "TRUE", "1"];
  const no = ["N", "NAO", "NÃO", "NO", "FALSE", "0"];

  if (yes.includes(v)) return "S";
  if (no.includes(v)) return "N";

  return "N";
}

/**
 * Garante que o cabeçalho da folha está alinhado com a configuração esperada.
 */
function ensureHeader_(sheet, expectedHeaders) {
  const headerRow = sheet.getRange(1, 1, 1, expectedHeaders.length).getDisplayValues()[0]
    .map(h => String(h || "").trim());

  // Se a folha estiver vazia, escreve cabeçalho
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    return;
  }

  // Verifica se os cabeçalhos base batem
  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headerRow[i] !== expectedHeaders[i]) {
      throw new Error(
        `Cabeçalho inesperado na coluna ${i + 1}. Esperado "${expectedHeaders[i]}", encontrado "${headerRow[i]}".`
      );
    }
  }
}
