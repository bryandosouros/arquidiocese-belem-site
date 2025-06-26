// Multi-Site Template Engine - Release 4A
// Sistema de templates únicos para Arquidiocese, RCC e Shalom

class MultiSiteTemplateEngine {
    constructor() {
        this.currentSite = this.detectCurrentSite();
        this.templates = this.getTemplateConfigs();
        this.init();
    }

    detectCurrentSite() {
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];
        
        // Detectar site baseado no hostname ou parâmetros
        if (hostname.includes('rcc') || subdomain === 'rcc') {
            return 'rcc';
        } else if (hostname.includes('shalom') || subdomain === 'shalom') {
            return 'shalom';
        } else {
            return 'arquidiocese'; // Default
        }
    }

    getTemplateConfigs() {
        return {
            arquidiocese: {
                name: 'Arquidiocese de Belém do Pará',
                tagline: 'Igreja Mãe da Amazônia',
                colors: {
                    primary: '#1a365d',
                    secondary: '#2d5a87',
                    accent: '#d4af37',
                    background: '#ffffff',
                    surface: '#f8f9fa',
                    text: '#2c3e50',
                    textSecondary: '#6c757d'
                },
                logo: 'images/logo-arquidiocese-belem.png',
                favicon: 'images/favicon-arquidiocese.ico',
                fonts: {
                    heading: 'Montserrat',
                    body: 'Open Sans'
                },
                layout: {
                    headerStyle: 'formal',
                    navigationStyle: 'horizontal',
                    footerStyle: 'institutional'
                },
                features: {
                    darkMode: true,
                    newsletter: true,
                    events: true,
                    donations: true
                },
                content: {
                    welcomeMessage: 'Bem-vindos à Casa do Pai',
                    mission: 'Evangelizar e servir o povo de Deus na Amazônia',
                    categories: ['decretos', 'comunicados', 'liturgia', 'pastoral']
                }
            },
            rcc: {
                name: 'RCC Belém',
                tagline: 'Renovação Carismática Católica',
                colors: {
                    primary: '#ff6b35',
                    secondary: '#f7931e',
                    accent: '#ffd700',
                    background: '#fff8f0',
                    surface: '#fff4e6',
                    text: '#2c1810',
                    textSecondary: '#8b4513'
                },
                logo: 'images/logo-rcc-belem.png',
                favicon: 'images/favicon-rcc.ico',
                fonts: {
                    heading: 'Roboto',
                    body: 'Source Sans Pro'
                },
                layout: {
                    headerStyle: 'dynamic',
                    navigationStyle: 'sidebar',
                    footerStyle: 'community'
                },
                features: {
                    darkMode: true,
                    newsletter: true,
                    events: true,
                    testimonials: true,
                    prayer: true
                },
                content: {
                    welcomeMessage: 'Vem Espírito Santo!',
                    mission: 'Renovar a Igreja pelo poder do Espírito Santo',
                    categories: ['formacao', 'juventude', 'oracao', 'eventos']
                }
            },
            shalom: {
                name: 'Comunidade Shalom',
                tagline: 'Paz e Contemplação',
                colors: {
                    primary: '#2e8b57',
                    secondary: '#20b2aa',
                    accent: '#ffd700',
                    background: '#f0fff0',
                    surface: '#f5fffa',
                    text: '#1c3a1c',
                    textSecondary: '#556b55'
                },
                logo: 'images/logo-shalom-belem.png',
                favicon: 'images/favicon-shalom.ico',
                fonts: {
                    heading: 'Crimson Text',
                    body: 'Lora'
                },
                layout: {
                    headerStyle: 'minimalist',
                    navigationStyle: 'centered',
                    footerStyle: 'simple'
                },
                features: {
                    darkMode: true,
                    newsletter: true,
                    meditation: true,
                    retreats: true,
                    family: true
                },
                content: {
                    welcomeMessage: 'A paz esteja convosco',
                    mission: 'Viver e anunciar o Evangelho em família',
                    categories: ['familia', 'espiritualidade', 'retiros', 'contemplacao']
                }
            }
        };
    }

    init() {
        this.applyTemplate();
        this.loadSiteSpecificStyles();
        this.updateContent();
        this.setupSiteSpecificFeatures();
        console.log(`🎨 Template ${this.currentSite} aplicado com sucesso!`);
    }

    applyTemplate() {
        const template = this.templates[this.currentSite];
        
        // Aplicar cores CSS custom properties
        this.applyColors(template.colors);
        
        // Aplicar fontes
        this.applyFonts(template.fonts);
        
        // Atualizar title e favicon
        this.updateMetadata(template);
        
        // Aplicar layout específico
        this.applyLayout(template.layout);
    }

    applyColors(colors) {
        const root = document.documentElement;
        
        root.style.setProperty('--site-primary', colors.primary);
        root.style.setProperty('--site-secondary', colors.secondary);
        root.style.setProperty('--site-accent', colors.accent);
        root.style.setProperty('--site-background', colors.background);
        root.style.setProperty('--site-surface', colors.surface);
        root.style.setProperty('--site-text', colors.text);
        root.style.setProperty('--site-text-secondary', colors.textSecondary);
        
        // Aplicar cores nos elementos principais
        document.body.style.backgroundColor = colors.background;
        document.body.style.color = colors.text;
    }

    applyFonts(fonts) {
        // Carregar fontes do Google Fonts se necessário
        this.loadGoogleFonts([fonts.heading, fonts.body]);
        
        // Aplicar fontes
        const root = document.documentElement;
        root.style.setProperty('--site-font-heading', fonts.heading);
        root.style.setProperty('--site-font-body', fonts.body);
    }

    loadGoogleFonts(fonts) {
        const existingLink = document.querySelector('#google-fonts');
        if (existingLink) {
            existingLink.remove();
        }

        const fontFamilies = fonts.map(font => font.replace(' ', '+')).join('|');
        const link = document.createElement('link');
        link.id = 'google-fonts';
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
    }

    updateMetadata(template) {
        // Atualizar title
        document.title = `${template.name} - ${template.tagline}`;
        
        // Atualizar favicon
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = template.favicon;
        
        // Atualizar meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = `${template.name} - ${template.mission}`;
    }

    applyLayout(layout) {
        document.body.setAttribute('data-layout-header', layout.headerStyle);
        document.body.setAttribute('data-layout-nav', layout.navigationStyle);
        document.body.setAttribute('data-layout-footer', layout.footerStyle);
    }

    updateContent() {
        const template = this.templates[this.currentSite];
        
        // Atualizar textos específicos do site
        this.updateElement('.site-name', template.name);
        this.updateElement('.site-tagline', template.tagline);
        this.updateElement('.welcome-message', template.content.welcomeMessage);
        this.updateElement('.mission-statement', template.content.mission);
        
        // Atualizar logo se existir
        const logoElement = document.querySelector('.site-logo, .admin-logo');
        if (logoElement) {
            logoElement.src = template.logo;
            logoElement.alt = template.name;
        }
    }

    updateElement(selector, content) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = content;
        }
    }

    loadSiteSpecificStyles() {
        // Carregar CSS específico do site
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = `css/${this.currentSite}-theme.css`;
        styleLink.onerror = () => {
            console.log(`CSS específico para ${this.currentSite} não encontrado, usando padrão.`);
        };
        document.head.appendChild(styleLink);
    }

    setupSiteSpecificFeatures() {
        const template = this.templates[this.currentSite];
        
        // Configurar funcionalidades específicas
        if (template.features.prayer && this.currentSite === 'rcc') {
            this.setupPrayerFeatures();
        }
        
        if (template.features.meditation && this.currentSite === 'shalom') {
            this.setupMeditationFeatures();
        }
        
        if (template.features.donations && this.currentSite === 'arquidiocese') {
            this.setupDonationFeatures();
        }
    }

    setupPrayerFeatures() {
        // Adicionar seção de oração para RCC
        const prayerSection = document.createElement('div');
        prayerSection.className = 'prayer-section';
        prayerSection.innerHTML = `
            <div class="prayer-widget">
                <h3>🙏 Momento de Oração</h3>
                <p>Vem Espírito Santo, enche os corações dos Teus fiéis...</p>
                <button class="btn btn-prayer">Fazer uma Oração</button>
            </div>
        `;
        
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.appendChild(prayerSection);
        }
    }

    setupMeditationFeatures() {
        // Adicionar seção de meditação para Shalom
        const meditationSection = document.createElement('div');
        meditationSection.className = 'meditation-section';
        meditationSection.innerHTML = `
            <div class="meditation-widget">
                <h3>🕊️ Palavra do Dia</h3>
                <p class="meditation-text">A paz esteja convosco...</p>
                <button class="btn btn-meditation">Refletir</button>
            </div>
        `;
        
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.appendChild(meditationSection);
        }
    }

    setupDonationFeatures() {
        // Não adicionar seção de doações no admin
        if (window.location.pathname.includes('admin.html')) {
            return;
        }
        
        // Adicionar seção de doações para Arquidiocese
        const donationSection = document.createElement('div');
        donationSection.className = 'donation-section';
        donationSection.innerHTML = `
            <div class="donation-widget">
                <h3>💝 Apoie Nossa Missão</h3>
                <p>Ajude-nos a continuar evangelizando na Amazônia</p>
                <button class="btn btn-donation">Fazer Doação</button>
            </div>
        `;
        
        const sidebar = document.querySelector('.sidebar') || document.querySelector('aside');
        if (sidebar) {
            sidebar.appendChild(donationSection);
        }
    }

    // Métodos públicos para mudança de site
    switchSite(siteKey) {
        if (this.templates[siteKey]) {
            this.currentSite = siteKey;
            this.init();
            
            // Salvar preferência
            localStorage.setItem('preferred-site', siteKey);
        }
    }

    getCurrentSite() {
        return {
            key: this.currentSite,
            config: this.templates[this.currentSite]
        };
    }

    // Sistema de preview para admin
    previewSite(siteKey) {
        const originalSite = this.currentSite;
        this.switchSite(siteKey);
        
        // Retornar função para restaurar
        return () => {
            this.switchSite(originalSite);
        };
    }

    // Gerar CSS dinâmico para o site atual
    generateDynamicCSS() {
        const template = this.templates[this.currentSite];
        const css = `
            :root {
                --site-primary: ${template.colors.primary};
                --site-secondary: ${template.colors.secondary};
                --site-accent: ${template.colors.accent};
                --site-background: ${template.colors.background};
                --site-surface: ${template.colors.surface};
                --site-text: ${template.colors.text};
                --site-text-secondary: ${template.colors.textSecondary};
                --site-font-heading: '${template.fonts.heading}', serif;
                --site-font-body: '${template.fonts.body}', sans-serif;
            }

            body {
                background-color: var(--site-background);
                color: var(--site-text);
                font-family: var(--site-font-body);
            }

            h1, h2, h3, h4, h5, h6 {
                font-family: var(--site-font-heading);
                color: var(--site-primary);
            }

            .btn-primary {
                background-color: var(--site-primary);
                border-color: var(--site-primary);
            }

            .btn-secondary {
                background-color: var(--site-secondary);
                border-color: var(--site-secondary);
            }

            .header-${this.currentSite} {
                background: linear-gradient(135deg, var(--site-primary), var(--site-secondary));
            }

            .card-${this.currentSite} {
                background-color: var(--site-surface);
                border-left: 4px solid var(--site-accent);
            }
        `;
        
        return css;
    }
}

// Sistema de Site Switcher para desenvolvimento/admin
class SiteSwitcher {
    constructor(templateEngine) {
        this.templateEngine = templateEngine;
        this.createSwitcher();
    }

    createSwitcher() {
        // Só mostrar em desenvolvimento ou para admins
        if (this.shouldShowSwitcher()) {
            const switcher = document.createElement('div');
            switcher.className = 'site-switcher';
            switcher.innerHTML = `
                <div class="switcher-header">
                    <span>🏛️ Site Theme</span>
                    <button class="switcher-toggle">⚙️</button>
                </div>
                <div class="switcher-options">
                    <button data-site="arquidiocese" class="site-option ${this.templateEngine.currentSite === 'arquidiocese' ? 'active' : ''}">
                        🏛️ Arquidiocese
                    </button>
                    <button data-site="rcc" class="site-option ${this.templateEngine.currentSite === 'rcc' ? 'active' : ''}">
                        🔥 RCC
                    </button>
                    <button data-site="shalom" class="site-option ${this.templateEngine.currentSite === 'shalom' ? 'active' : ''}">
                        🕊️ Shalom
                    </button>
                </div>
            `;
            
            document.body.appendChild(switcher);
            this.setupSwitcherEvents(switcher);
        }
    }

    shouldShowSwitcher() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('dev=true');
    }

    setupSwitcherEvents(switcher) {
        const toggle = switcher.querySelector('.switcher-toggle');
        const options = switcher.querySelector('.switcher-options');
        
        toggle.addEventListener('click', () => {
            options.classList.toggle('open');
        });

        const siteButtons = switcher.querySelectorAll('.site-option');
        siteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const siteKey = button.dataset.site;
                this.templateEngine.switchSite(siteKey);
                
                // Atualizar botões ativos
                siteButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Fechar switcher
                options.classList.remove('open');
            });
        });
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    window.multiSiteTemplateEngine = new MultiSiteTemplateEngine();
    window.siteSwitcher = new SiteSwitcher(window.multiSiteTemplateEngine);
    
    console.log('🚀 Release 4A: Multi-Site Template Engine inicializado!');
});

export { MultiSiteTemplateEngine, SiteSwitcher };
