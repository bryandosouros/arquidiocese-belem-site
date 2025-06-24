# 🏛️ Arquidiocese de Belém do Pará - Habbo V2.0

## 📋 Sobre o Projeto

Portal oficial da Arquidiocese de Belém do Pará no Habbo Hotel. Um sistema completo de gerenciamento de conteúdo (CMS) com design Vatican-inspired, autenticação segura e interface administrativa moderna.

## 🚀 Status do Desenvolvimento

### ✅ **CONCLUÍDO**

**Release 0: Fundação Visual**
- ✅ Homepage responsiva com carrossel automático
- ✅ Design Vatican-inspired elegante  
- ✅ Menu hambúrguer para mobile
- ✅ Footer dinâmico com ano atual

**Release 1: Infrastructure** 
- ✅ Firebase projeto configurado
- ✅ Hosting setup
- ✅ Database & Authentication
- ✅ Git repository
- 🚀 Deploy automatizado (próximo)

**Release 2: Sistema de Autenticação**
- ✅ Login seguro com Firebase Authentication
- ✅ Área administrativa protegida
- ✅ Sistema de logout automático
- ✅ Redirecionamento inteligente

**Release 3A: CMS Core**
- ✅ CRUD completo para posts/decretos
- ✅ Editor de texto com toolbar
- ✅ Sistema de categorias e tags
- ✅ Dashboard com estatísticas
- ✅ Filtros e busca avançados

### 🚧 **PRÓXIMO: Release 3B - CMS Avançado**
- ✅ Editor WYSIWYG avançado (TinyMCE com fallback)
- [ ] Upload de imagens para Firebase Storage
- [ ] Versionamento de posts
- [ ] Agendamento de publicações
- [ ] Preview mode

### 📋 **ROADMAP COMPLETO**

**Release 4: Frontend Dinâmico**
- [ ] Integração posts na homepage
- [ ] Página individual de notícias
- [ ] Sistema de busca público
- [ ] Paginação e SEO

**Release 5-10: Ecossistema Multi-Site**
- [ ] 3 sites: Arquidiocese + RCC + Shalom
- [ ] Multi-tenant system
- [ ] PWA features
- [ ] AI-powered features

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 (SCSS), JavaScript ES6+
- **Backend**: Firebase (Authentication + Firestore + Hosting)
- **Editor**: TinyMCE 6 com fallback para textarea
- **Build**: Sass para compilação CSS
- **Deploy**: GitHub Actions + Firebase Hosting
- **CMS**: Sistema próprio headless

## ⚙️ Configuração e Deploy

### Desenvolvimento Local
```bash
# Instalar dependências
npm install

# Desenvolvimento (watch SCSS)
npm run dev

# Build para produção  
npm run build
```

### Deploy Automático
- Push para `main` branch → Auto-deploy via GitHub Actions
- URL: https://belem-hb.web.app

### Firebase CLI
```bash
# Login
firebase login

# Deploy manual
firebase deploy

# Deploy apenas hosting
firebase deploy --only hosting
```

## 📁 Estrutura do Projeto
```
├── public/                 # Arquivos públicos
│   ├── css/               # CSS compilado
│   ├── images/            # Imagens e assets
│   ├── js/                # JavaScript
│   ├── index.html         # Homepage
│   ├── admin.html         # Painel administrativo
│   ├── login.html         # Página de login
│   └── 404.html          # Página de erro
├── src/                   # Código fonte
│   └── scss/             # Arquivos SCSS
├── package.json          # Dependências e scripts
└── .gitignore           # Arquivos ignorados
```

## 🎯 Roadmap

### 📋 **Próximas Releases**

**Release 1: Infrastructure (Em Andamento)**
- [ ] Git + GitHub setup
- [ ] Firebase Hosting deploy
- [ ] CI/CD com GitHub Actions

**Release 3B: CMS Avançado**
- [ ] Upload de imagens
- [ ] Versionamento de posts
- [ ] Agendamento de publicações

**Release 4: Frontend Dinâmico**
- [ ] Integração posts na homepage
- [ ] Página individual de notícias
- [ ] Sistema de busca
- [ ] Paginação

## 👥 Ecossistema Multi-Site (Futuro)

O projeto está sendo preparado para suportar 3 sites:

1. **Arquidiocese Principal** (atual)
2. **Renovação Carismática** - Estilo jovem e vibrante
3. **Comunidade Shalom** - Estilo contemplativo e minimalista

## 📄 Licença

Este é um projeto fictício para o jogo Habbo Hotel.

## 📞 Contato

Para dúvidas sobre o desenvolvimento, entre em contato com a equipe técnica.

---

*"A paz esteja convosco"* ✠
