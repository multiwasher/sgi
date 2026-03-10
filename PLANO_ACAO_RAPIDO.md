# 🎯 Guia Rápido - "Plano de Ação"

## ✨ O que mudou?

Um novo botão **"PLANO DE AÇÃO"** foi adicionado ao menu do portal SGI!

Lê os dados da folha **"Plano de Intervenção"** da planilha Google Sheets.

## 🏗️ Como Configurar (3 Passos)

### Passo 1️⃣ - Criar o Leitor da Planilha

1. Abra a planilha: https://docs.google.com/spreadsheets/d/1D_lN4o_bRWBNMDQwOue7TdkrZZQ6z5hQjl48A3EH_jc
2. Clique em **Extensões** → **Apps Script**
3. Cole o código de `plano-acao.gs` (delete o código padrão)
4. Clique **Guardar** (💾)

### Passo 2️⃣ - Publicar

1. Clique **Deploy** (canto superior direito)
2. **New deployment**
3. Escolha: **Web app**
4. "Execute as": seu email
5. "Who has access": **Anyone**
6. **Deploy**
7. **Autorize** as permissões pedidas
8. **Copie a URL** que aparece (formato: `https://script.google.com/macros/s/...../exec`)

### Passo 3️⃣ - Colar a URL

1. Abra `index.html`
2. Procure a linha com: `PLANO_ACAO_APPS_SCRIPT_URL`
3. Substitua `SUBSTITUIR_COM_URL_REAL` pela URL do Passo 2
4. **Guarde** o arquivo

## ✅ Pronto!

Recarregue o portal e clique em "PLANO DE AÇÃO"!

---

## 📚 Para Mais Detalhes

Veja: `PLANO_ACAO_SETUP.md` (configuração detalhada)
Veja: `PLANO_ACAO_IMPLEMENTACAO.md` (informações técnicas)
