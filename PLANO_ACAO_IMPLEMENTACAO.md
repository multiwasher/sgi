# Implementação do Módulo "Plano de Ação" - Resumo

## ✅ O que foi implementado

### 1. **Menu de Navegação**
- Adicionado botão "PLANO DE AÇÃO" no menu desktop
- Adicionado botão "PLANO DE AÇÃO" no menu mobile
- Integrado com o sistema de abas existente

### 2. **Interface Visual**
Uma nova seção com:

#### Header
- Título e descrição do módulo
- Botão "DOCUMENTO ORIGINAL" → Abre a planilha Google Sheets
  - Link: https://docs.google.com/spreadsheets/d/1D_lN4o_bRWBNMDQwOue7TdkrZZQ6z5hQjl48A3EH_jc/edit?usp=sharing
- Botão "Atualizar Dados" → Sincroniza com a planilha

#### Filtros e Pesquisa
- Caixa de pesquisa por palavra-chave
- Filtro por Status (dinâmico baseado nos dados)

#### Tabela de Dados
Com as colunas:
- Código
- Descrição da Ação
- Origem
- Responsável
- Data Início
- Data Fim Prevista
- Data Fim Real
- Status (com badge colorido)
- % Realização
- Observações

#### Estatísticas
Cards mostrando:
- 🔵 Total de Ações
- 🟢 Realizadas
- 🟡 Em Progresso
- 🔴 Por Realizar

### 3. **Funcionalidades JavaScript**

Funções implementadas:
- `fetchPlanoAcao()` - Carrega dados da planilha via Apps Script
- `buildPlanoAcaoFilters()` - Constrói filtros dinamicamente
- `setPlanoAcaoStatusFilter(status)` - Aplica filtro de status
- `filterPlanoAcao()` - Filtra dados por status e busca
- `renderPlanoAcao(data)` - Renderiza a tabela com cores de status
- `updatePlanoAcaoStats()` - Atualiza estatísticas

### 4. **Arquivos Criados/Modificados**

#### ✏️ Modificados
- `index.html` - Menu, view, variáveis e funções

#### 📄 Novos
- `plano-acao.gs` - Google Apps Script para ler a planilha
- `PLANO_ACAO_SETUP.md` - Instruções de configuração

## 📋 Próximos Passos para o Usuário

### 1. Criar Apps Script
- Abra a planilha do Plano de Ação
- Crie um Apps Script usando o código em `plano-acao.gs`
- Publique como "Web app"
- Copie a URL gerada

**Importante:** A planilha deve ter uma folha chamada **"Plano de Intervenção"**

### 2. Configurar URL no index.html
Substitua a linha:
```javascript
const PLANO_ACAO_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/SUBSTITUIR_COM_URL_REAL/exec';
```

Pela URL verdadeira do seu Apps Script.

### 3. Testar
- Recarregue o portal SGI
- Clique em "PLANO DE AÇÃO"
- Clique em "Atualizar Dados"
- Verifique se os dados aparecem (da folha "Plano de Intervenção")

## 🎨 Design

O módulo segue o design do portal:
- Cores: Esmeralda (#065f46) e tons neutros
- Fonte: Plus Jakarta Sans
- Responsivo para desktop e mobile
- Cards com efeito glass-morphism
- Badges coloridas para status

## 🔍 Detalhes Técnicos

### Origem de Dados
- **Planilha:** https://docs.google.com/spreadsheets/d/1D_lN4o_bRWBNMDQwOue7TdkrZZQ6z5hQjl48A3EH_jc
- **Folha:** "Plano de Intervenção"

### Status Reconhecidos
- Status com "realizada" ou "concluído" → Verde (#dcfce7)
- Status com "em" → Âmbar (#fed7aa)
- Status com "não" ou "aberto" → Amarelo (#fef08a)
- Outros status → Cinzento (#f3f4f6)

### Estrutura de Dados Esperada
A folha **"Plano de Intervenção"** deve ter estas colunas (na linha 1):
```
Código | Descrição da Ação | Origem | Responsável | Data Início | Data Fim Prevista | Data Fim Real | Status | % Realização | Observações
```

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android tablets)
- ✅ Mobile (iPhone, Android phones)

## 🚀 Como Usar

### Visualizar Dados
1. Clique em "PLANO DE AÇÃO" no menu
2. Dados aparecem automaticamente na primeira visita (se Apps Script estiver configurado)

### Pesquisar
1. Digite na caixa "Filtrar por palavra-chave..."
2. Os resultados atualizam em tempo real

### Filtrar por Status
1. Clique nos botões de status
2. Apenas ações com esse status serão exibidas

### Atualizar
1. Clique em "Atualizar Dados"
2. Os dados mais recentes serão carregados da planilha

### Abrir Planilha Original
1. Clique em "📄 DOCUMENTO ORIGINAL"
2. A planilha Google Sheets abre numa nova aba

---

**Implementação Concluída** ✏️ - Março 2026
