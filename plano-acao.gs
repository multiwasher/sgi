/**
 * Plano de Ação Reader
 * 
 * GET  -> devolve dados da folha "Plano de Intervenção" (ou JSONP se vier ?callback=...)
 * 
 * Parâmetro: ?sheet=Plano%20de%20Interven%C3%A7%C3%A3o&callback=...
 */

const PLANO_ACAO_SPREADSHEET_ID = "1D_lN4o_bRWBNMDQwOue7TdkrZZQ6z5hQjl48A3EH_jc";

/**
 * Formata data para dd/mm/aaaa
 * Google Sheets retorna Date objects, que precisam ser formatados corretamente
 */
function formatDateToString(dateValue) {
  if (!dateValue) return "";
  
  try {
    let date;
    
    // Se é uma Data do Google Sheets (mais comum)
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Se é um número (serial date - dias desde 1899-12-30)
    else if (typeof dateValue === 'number') {
      // Google Sheets usa serial numbers, converter para Date
      date = new Date((dateValue - 25569) * 86400 * 1000);
    }
    // Se é string, tenta fazer parse
    else if (typeof dateValue === 'string') {
      const str = String(dateValue).trim();
      if (!str) return "";
      
      // Se já está no formato dd/mm/aaaa, retorna
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        return str;
      }
      
      // Tenta fazer parse
      date = new Date(str);
      
      // Se não conseguiu fazer parse, retorna original
      if (isNaN(date.getTime())) {
        return str;
      }
    }
    else {
      return "";
    }
    
    // Validar que temos uma data válida
    if (isNaN(date.getTime())) {
      return "";
    }
    
    // Formata para dd/mm/aaaa
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
    
  } catch (e) {
    // Se houver erro, retorna string vazia
    return "";
  }
}

/**
 * GET: devolve dados do separador "Plano de Intervenção"
 * Parâmetros: ?sheet=Plano%20de%20Interven%C3%A7%C3%A3o&callback=...
 */
function doGet(e) {
  try {
    // Determina qual separador ler (padrão: Plano de Intervenção)
    let sheetParam = "Plano de Intervenção";
    
    if (e && e.parameter && e.parameter.sheet) {
      const param = String(e.parameter.sheet).trim();
      if (param !== "") {
        sheetParam = param;
      }
    }

    const ss = SpreadsheetApp.openById(PLANO_ACAO_SPREADSHEET_ID);
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
      // Normaliza espaços múltiplos e quebras de linha em espaços simples
      name = name.replace(/\s+/g, " ");
      return name !== "" ? name : `COL_${idx + 1}`;
    });

    const rows = values.slice(1);

    const data = rows
      .map(r => {
        const obj = {};
        headers.forEach((h, i) => {
          const v = r[i];
          let value = "";
          
          // Se é a coluna "Data de Registo", formata como dd/mm/aaaa
          if (h === "Data de Registo" && v) {
            value = formatDateToString(v);
          }
          // Se é a coluna "Data de Conclusão", formata como dd/mm/aaaa
          else if (h === "Data de Conclusão" && v) {
            value = formatDateToString(v);
          }
          // Outras colunas: normaliza espaços
          else {
            value = (v === undefined || v === null) ? "" : String(v).trim();
            value = value.replace(/\s+/g, " ");
          }
          
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
 * Função auxiliar para retornar dados com suporte a JSONP
 */
function output_(data, e) {
  let output = null;

  if (!e || !e.parameter || !e.parameter.callback) {
    // JSON simples
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // JSONP
  const callback = e.parameter.callback;
  output = ContentService.createTextOutput(
    encodeURIComponent(callback) + '(' + JSON.stringify(data) + ')'
  );
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);

  return output;
}
