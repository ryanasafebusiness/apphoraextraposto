# 🕐 JBRETAS HREXTRA - Sistema de Controle de Horas Extras

Sistema completo e seguro para controle e cálculo automático de horas extras de funcionários, desenvolvido especificamente para a **REDE JB - Postos de Combustível**.

## 🚀 Funcionalidades Principais

### 👥 **Dashboard Administrativo**
- ✅ **Visão Geral Completa**: Estatísticas globais de todos os funcionários
- ✅ **Analytics Avançado**: Gráficos interativos com Recharts
- ✅ **Top 5 Funcionários**: Ranking dos funcionários com mais horas extras
- ✅ **Gerenciamento de Funcionários**: Lista completa com busca e filtros
- ✅ **Relatórios Detalhados**: Visualização individual de cada funcionário
- ✅ **Exportação CSV**: Download de relatórios completos

### 🔐 **Sistema de Autenticação Seguro**
- ✅ **Login/Cadastro**: Interface moderna e responsiva
- ✅ **Controle de Acesso**: Diferenciação entre Admin e Funcionários
- ✅ **Rate Limiting**: Proteção contra ataques de força bruta
- ✅ **Validação Robusta**: CPF, email e senhas seguras

### 📱 **Interface Responsiva**
- ✅ **Mobile First**: Otimizado para dispositivos móveis
- ✅ **Design Moderno**: Interface limpa e intuitiva
- ✅ **Logo REDE JB**: Identidade visual corporativa
- ✅ **Tema Escuro/Claro**: Suporte a ambos os temas

### 🛡️ **Segurança Robusta**
- ✅ **Múltiplas Camadas**: Proteção em profundidade
- ✅ **Validação de Entrada**: Sanitização de todos os dados
- ✅ **Proteção XSS**: Prevenção de ataques de script
- ✅ **Auditoria Completa**: Logs de todas as ações
- ✅ **Headers de Segurança**: Proteção HTTP completa

## 🛠️ Stack Tecnológica

### **Frontend**
- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderno
- **Tailwind CSS** - Framework CSS
- **Shadcn/ui** - Componentes de interface
- **Recharts** - Gráficos interativos
- **React Router DOM** - Roteamento
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Banco de dados
- **Row Level Security (RLS)** - Segurança no banco
- **Auth** - Autenticação integrada

### **Segurança**
- **Rate Limiting** - Controle de tentativas
- **Input Validation** - Validação robusta
- **XSS Protection** - Prevenção de ataques
- **SQL Injection Protection** - Proteção do banco
- **CSRF Protection** - Tokens de segurança
- **Audit Logging** - Logs de segurança

## 📦 Instalação e Configuração

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### **1. Clone o Repositório**
```bash
git clone https://github.com/ryanasafebusiness/apphoraextraposto.git
cd apphoraextraposto
```

### **2. Instalar Dependências**
```bash
npm install
```

### **3. Configurar Variáveis de Ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase
```

### **4. Configurar Banco de Dados**
Execute as migrações no Supabase:
```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Aplicar migrações
supabase db push
```

### **5. Executar o Projeto**
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🗄️ Estrutura do Banco de Dados

### **Tabelas Principais**
- **`profiles`** - Dados dos usuários
- **`user_roles`** - Controle de acesso (admin/employee)
- **`overtime_records`** - Registros de horas extras
- **`audit_logs`** - Logs de auditoria
- **`rate_limits`** - Controle de rate limiting
- **`security_settings`** - Configurações de segurança

### **Políticas de Segurança (RLS)**
- ✅ Usuários só veem seus próprios dados
- ✅ Admins podem ver todos os dados
- ✅ Validação de roles em todas as operações
- ✅ Logs de auditoria automáticos

## 🔒 Recursos de Segurança

### **Validação de Entrada**
- ✅ **Email**: Formato válido e sanitizado
- ✅ **CPF**: Algoritmo brasileiro de validação
- ✅ **Senhas**: Critérios de força obrigatórios
- ✅ **Datas**: Validação de formato e lógica
- ✅ **Horários**: Validação de formato e sequência

### **Proteção contra Ataques**
- ✅ **XSS**: Sanitização de HTML
- ✅ **SQL Injection**: Validação de padrões
- ✅ **CSRF**: Tokens de segurança
- ✅ **Path Traversal**: Validação de caminhos
- ✅ **Rate Limiting**: Controle de tentativas

### **Monitoramento**
- ✅ **Audit Logs**: Todas as ações registradas
- ✅ **Security Events**: Eventos suspeitos logados
- ✅ **Rate Limiting**: Controle por IP/usuário
- ✅ **Session Monitoring**: Monitoramento de sessões

## 📱 Responsividade

O sistema foi desenvolvido com **mobile-first**, garantindo:
- ✅ **Interface Adaptável**: Funciona em todos os dispositivos
- ✅ **Touch Friendly**: Botões e elementos otimizados para toque
- ✅ **Performance**: Carregamento rápido em dispositivos móveis
- ✅ **UX Intuitiva**: Navegação simples e clara

## 🎨 Design System

### **Identidade Visual**
- **Logo**: REDE JB com cores corporativas
- **Cores**: Preto, branco e vermelho (#EF4444)
- **Tipografia**: Sistema de fontes responsivo
- **Componentes**: Biblioteca Shadcn/ui

### **Tema**
- **Modo Claro**: Interface limpa e profissional
- **Modo Escuro**: Redução de fadiga visual
- **Transições**: Animações suaves e elegantes

## 📊 Analytics e Relatórios

### **Dashboard Administrativo**
- **Métricas Globais**: Total de horas, valores e funcionários
- **Gráficos Interativos**: Visualização de tendências
- **Top Performers**: Ranking dos funcionários
- **Exportação**: Relatórios em CSV

### **Relatórios Individuais**
- **Histórico Completo**: Todos os registros do funcionário
- **Filtros por Data**: Busca por período específico
- **Cálculos Detalhados**: Horas líquidas e valores
- **Exportação**: Dados individuais em CSV

## 🚀 Deploy e Produção

### **Build Otimizado**
- ✅ **Minificação**: Código otimizado para produção
- ✅ **Tree Shaking**: Remoção de código não utilizado
- ✅ **Source Maps**: Apenas em desenvolvimento
- ✅ **Security Headers**: Headers de segurança configurados

### **Configurações de Segurança**
- ✅ **CSP**: Content Security Policy configurado
- ✅ **HSTS**: HTTP Strict Transport Security
- ✅ **X-Frame-Options**: Proteção contra clickjacking
- ✅ **X-Content-Type-Options**: Prevenção de MIME sniffing

## 👥 Equipe e Suporte

**Desenvolvido para**: REDE JB - Postos de Combustível  
**Sistema**: Controle de Horas Extras  
**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025

## 📄 Licença

Este projeto é propriedade da **REDE JB** e está protegido por direitos autorais.

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint

# Type Check
npx tsc --noEmit
```

## 📈 Próximas Funcionalidades

- [ ] **Notificações Push**: Alertas em tempo real
- [ ] **API REST**: Endpoints para integração
- [ ] **Mobile App**: Aplicativo nativo
- [ ] **Integração ERP**: Sincronização com sistemas
- [ ] **Relatórios Avançados**: Mais opções de análise

---

**Sistema desenvolvido com foco em segurança, performance e usabilidade para a REDE JB.** 🚀