# Configuração do Módulo "Plano de Ação"

## Resumo

O módulo "Plano de Ação" foi adicionado ao portal SGI. Este documento descreve como conetar o módulo à planilha Google Sheets do Plano de Ação.

## Requisitos

- URL de um Apps Script que leia a planilha "Plano de Ação" do Google Sheets
- Permissões de acesso à planilha Google Sheets

## Passo 1: Criar o Apps Script

1. Aceda à sua planilha Google Sheets do Plano de Ação:
   https://docs.google.com/spreadsheets/d/1D_lN4o_bRWBNMDQwOue7TdkrZZQ6z5hQjl48A3EH_jc/edit?usp=sharing

2. Clique em **Extensões** > **Apps Script**

3. Delete o código padrão e copie o seguinte código do arquivo `plano-acao.gs` deste projeto

4. Guarde o projeto com o nome "Plano de Ação Reader"

## Nota Importante

A planilha deve ter uma folha chamada **"Plano de Intervenção"** (é este o separador que será lido).

## Passo 2: Publicar como Aplicação Web

1. Clique em **Deploy** (canto superior direito)

2. Clique em **New deployment**

3. Escolha o tipo: **Web app**

4. Preencha com as seguintes configurações:
   - Execute as: `Me` (seu email)
   - Who has access: `Anyone`

5. Clique em **Deploy**

6. Será solicitado permissão. Autorize o acesso.

7. **Copie a URL** que aparece após sucesso. Terá o seguinte formato:
   ```
   https://script.google.com/macros/s/...../exec
   ```

## Passo 3: Atualizar o index.html

1. Abra o arquivo `index.html`

2. Procure pela linha:
   ```javascript
   const PLANO_ACAO_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/...../exec';
   ```

3. Substitua a URL pela URL que copiou no Passo 2

4. Guarde o arquivo

## Passo 4: Testar o Módulo

1. Recarregue o portal SGI no seu navegador (Ctrl+F5 para limpar cache)

2. Clique no botão "PLANO DE AÇÃO" no menu

3. Clique em "Atualizar Dados" para carregar os dados da planilha

4. Os dados devem aparecer na tabela com as seguintes colunas:
   - Código
   - Descrição da Ação
   - Origem
   - Responsável
   - Data Início
   - Data Fim Prevista
   - Data Fim Real
   - Status
   - % Realização
   - Observações

## Recursos

- **Filtro por Status**: Use os botões de filtro para visualizar apenas as ações com certo status
- **Pesquisa Rápida**: Use a caixa de pesquisa para filtrar por palavra-chave
- **Link ao Documento Original**: Clique no botão "DOCUMENTO ORIGINAL" para abrir a planilha Google Sheets
- **Atualizar Dados**: Clique em "Atualizar Dados" para sincronizar com a planilha

## Colunas Esperadas na Planilha

A folha **"Plano de Intervenção"** deve ter as seguintes colunas (no cabeçalho/linha 1):

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| Código | Texto | Código identificador da ação (ex: PA-001) |
| Descrição da Ação | Texto | Descrição detalhada da ação |
| Origem | Texto | Origem da ação (SWOT, R&O, Auditoria, etc.) |
| Responsável | Texto | Pessoa responsável pela execução |
| Data Início | Data | Data de início prevista |
| Data Fim Prevista | Data | Data de conclusão prevista |
| Data Fim Real | Data | Data de conclusão real (quando concluída) |
| Status | Texto | Status da ação (ex: "Aberta", "Em Progresso", "Realizada") |
| % Realização | Texto/Número | Percentual de realização (0-100%) |
| Observações | Texto | Observações adicionais |

**Nota:** Os nomes das colunas devem corresponder exatamente aos nomes listados acima.

## Suporte

Se encontrar algum problema, verifique:
- A URL do Apps Script está correta
- A planilha tem uma folha chamada **"Plano de Intervenção"**
- As colunas da planilha correspondem aos nomes esperados

---

**Data**: Março 2026
**Versão**: 1.0
