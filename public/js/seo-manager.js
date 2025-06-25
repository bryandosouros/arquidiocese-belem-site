// SEO Manager - Release 5A
// Sistema avançado de SEO para a Arquidiocese

class SEOManager {
    constructor() {
        this.isInitialized = false;
        this.debug = window.location.hostname === 'localhost';
        this.baseUrl = this.debug ? 'http://localhost:3000' : 'https://belem-hb.web.app';
        this.siteName = 'Arquidiocese de Belém do Pará';
        this.defaultImage = `${this.baseUrl}/images/logo-arquidiocese-belem.png`;
        
        this.init();
    }

    async init() {
        console.log('🔍 SEO Manager initializing...');
        
        // Initialize basic SEO
        this.setupBasicSEO();
        
        // Setup dynamic meta tags
        this.setupDynamicMeta();
        
        // Setup structured data
        this.setupStructuredData();
        
        // Setup Open Graph
        this.setupOpenGraph();
        
        // Setup Twitter Cards
        this.setupTwitterCards();
        
        // Setup breadcrumbs
        this.setupBreadcrumbs();
        
        // Monitor Core Web Vitals
        this.monitorWebVitals();
        
        this.isInitialized = true;
        console.log('✅ SEO Manager initialized');
    }

    // Basic SEO Setup
    setupBasicSEO() {
        // Canonical URL
        this.setCanonicalURL();
        
        // Language and charset
        this.setLanguageAndCharset();
        
        // Viewport and responsive
        this.ensureViewport();
        
        // Robots meta
        this.setRobotsMeta();
        
        // Theme color for PWA
        this.setThemeColor();
    }

    setCanonicalURL() {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = window.location.href.split('?')[0];
    }

    setLanguageAndCharset() {
        document.documentElement.lang = 'pt-BR';
        
        let charset = document.querySelector('meta[charset]');
        if (!charset) {
            charset = document.createElement('meta');
            charset.charset = 'UTF-8';
            document.head.insertBefore(charset, document.head.firstChild);
        }
    }

    ensureViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewport);
        }
    }

    setRobotsMeta() {
        let robots = document.querySelector('meta[name="robots"]');
        if (!robots) {
            robots = document.createElement('meta');
            robots.name = 'robots';
            robots.content = 'index, follow';
            document.head.appendChild(robots);
        }
    }

    setThemeColor() {
        let themeColor = document.querySelector('meta[name="theme-color"]');
        if (!themeColor) {
            themeColor = document.createElement('meta');
            themeColor.name = 'theme-color';
            themeColor.content = '#1a365d';
            document.head.appendChild(themeColor);
        }
    }

    // Dynamic Meta Tags
    setupDynamicMeta() {
        // Get page data
        const pageData = this.getPageData();
        
        // Update title
        this.updateTitle(pageData.title);
        
        // Update meta description
        this.updateDescription(pageData.description);
        
        // Update keywords
        this.updateKeywords(pageData.keywords);
        
        // Update author
        this.updateAuthor(pageData.author);
    }

    getPageData() {
        const path = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        
        let pageData = {
            title: this.siteName,
            description: 'Portal oficial da Arquidiocese de Belém do Pará - Igreja Mãe da Amazônia',
            keywords: ['Arquidiocese', 'Belém', 'Pará', 'Igreja Católica', 'Amazônia'],
            author: 'Arquidiocese de Belém do Pará',
            type: 'website'
        };

        // Homepage
        if (path === '/' || path === '/index.html') {
            pageData.title = `${this.siteName} - Igreja Mãe da Amazônia`;
            pageData.description = 'Portal oficial da Arquidiocese de Belém do Pará. Notícias, decretos, eventos e orientações pastorais da Igreja Mãe da Amazônia.';
            pageData.keywords.push('Portal', 'Igreja', 'Notícias', 'Eventos');
        }
        
        // Post page
        else if (path.includes('post.html')) {
            const postId = urlParams.get('id');
            if (postId) {
                pageData.type = 'article';
                // Title and description will be updated when post loads
                pageData.title = 'Carregando...';
                pageData.description = 'Conteúdo da Arquidiocese de Belém do Pará';
                pageData.keywords.push('Artigo', 'Decreto', 'Comunicado');
            }
        }
        
        // Admin page
        else if (path.includes('admin.html')) {
            pageData.title = 'Painel Administrativo - ' + this.siteName;
            pageData.description = 'Sistema de gerenciamento de conteúdo da Arquidiocese de Belém do Pará';
            pageData.keywords.push('Admin', 'CMS', 'Gestão');
        }
        
        // PWA Demo
        else if (path.includes('pwa-demo.html')) {
            pageData.title = 'PWA Demo - ' + this.siteName;
            pageData.description = 'Demonstração das funcionalidades Progressive Web App da Arquidiocese';
            pageData.keywords.push('PWA', 'App', 'Demo');
        }

        return pageData;
    }

    updateTitle(title) {
        document.title = title;
        
        // Update Open Graph title
        this.updateMetaProperty('og:title', title);
        
        // Update Twitter title
        this.updateMetaName('twitter:title', title);
    }

    updateDescription(description) {
        this.updateMetaName('description', description);
        this.updateMetaProperty('og:description', description);
        this.updateMetaName('twitter:description', description);
    }

    updateKeywords(keywords) {
        const keywordString = Array.isArray(keywords) ? keywords.join(', ') : keywords;
        this.updateMetaName('keywords', keywordString);
    }

    updateAuthor(author) {
        this.updateMetaName('author', author);
        this.updateMetaProperty('article:author', author);
    }

    updateMetaName(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    updateMetaProperty(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.property = property;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    // Structured Data (JSON-LD)
    setupStructuredData() {
        const structuredData = this.generateStructuredData();
        this.insertStructuredData(structuredData);
    }

    generateStructuredData() {
        const path = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);

        const baseData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.siteName,
            "url": this.baseUrl,
            "logo": this.defaultImage,
            "description": "Arquidiocese de Belém do Pará - Igreja Mãe da Amazônia",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Avenida Nazaré, 1256",
                "addressLocality": "Belém",
                "addressRegion": "PA",
                "postalCode": "66035-170",
                "addressCountry": "BR"
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+55-91-3202-3000",
                "contactType": "customer service",
                "areaServed": "BR",
                "availableLanguage": "Portuguese"
            },
            "sameAs": [
                "https://www.facebook.com/arquidiocesebelem",
                "https://www.instagram.com/arquidiocesebelem",
                "https://twitter.com/arquidiocesebelem"
            ]
        };

        // Homepage
        if (path === '/' || path === '/index.html') {
            return baseData;
        }

        // Article page
        if (path.includes('post.html') && urlParams.get('id')) {
            return {
                "@context": "https://schema.org",
                "@type": "Article",
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": window.location.href
                },
                "headline": document.title,
                "description": document.querySelector('meta[name="description"]')?.content || '',
                "image": document.querySelector('meta[property="og:image"]')?.content || this.defaultImage,
                "author": {
                    "@type": "Organization",
                    "name": this.siteName
                },
                "publisher": baseData,
                "datePublished": new Date().toISOString(),
                "dateModified": new Date().toISOString(),
                "articleSection": "Religious",
                "inLanguage": "pt-BR",
                "keywords": document.querySelector('meta[name="keywords"]')?.content || ''
            };
        }

        return baseData;
    }

    insertStructuredData(data) {
        // Remove existing structured data
        const existing = document.querySelector('script[type="application/ld+json"]');
        if (existing) {
            existing.remove();
        }

        // Insert new structured data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data, null, 2);
        document.head.appendChild(script);
    }

    // Open Graph
    setupOpenGraph() {
        const pageData = this.getPageData();
        
        this.updateMetaProperty('og:site_name', this.siteName);
        this.updateMetaProperty('og:type', pageData.type);
        this.updateMetaProperty('og:url', window.location.href);
        this.updateMetaProperty('og:image', this.defaultImage);
        this.updateMetaProperty('og:locale', 'pt_BR');
        
        if (pageData.type === 'article') {
            this.updateMetaProperty('article:publisher', this.baseUrl);
            this.updateMetaProperty('article:section', 'Religious');
            this.updateMetaProperty('article:tag', pageData.keywords.join(', '));
        }
    }

    // Twitter Cards
    setupTwitterCards() {
        this.updateMetaName('twitter:card', 'summary_large_image');
        this.updateMetaName('twitter:site', '@arquidiocesebelem');
        this.updateMetaName('twitter:creator', '@arquidiocesebelem');
        this.updateMetaName('twitter:image', this.defaultImage);
    }

    // Breadcrumbs
    setupBreadcrumbs() {
        const breadcrumbs = this.generateBreadcrumbs();
        this.displayBreadcrumbs(breadcrumbs);
        this.addBreadcrumbStructuredData(breadcrumbs);
    }

    generateBreadcrumbs() {
        const path = window.location.pathname;
        const breadcrumbs = [
            { name: 'Início', url: this.baseUrl }
        ];

        if (path.includes('admin.html')) {
            breadcrumbs.push({ name: 'Administração', url: window.location.href });
        } else if (path.includes('post.html')) {
            breadcrumbs.push({ name: 'Posts', url: `${this.baseUrl}/#noticias` });
            breadcrumbs.push({ name: 'Artigo', url: window.location.href });
        } else if (path.includes('pwa-demo.html')) {
            breadcrumbs.push({ name: 'PWA Demo', url: window.location.href });
        }

        return breadcrumbs;
    }

    displayBreadcrumbs(breadcrumbs) {
        // Only show breadcrumbs if there's more than just home
        if (breadcrumbs.length <= 1) return;

        let breadcrumbContainer = document.querySelector('.breadcrumbs');
        if (!breadcrumbContainer) {
            breadcrumbContainer = document.createElement('nav');
            breadcrumbContainer.className = 'breadcrumbs';
            breadcrumbContainer.setAttribute('aria-label', 'Navegação estrutural');
            
            // Insert after header
            const header = document.querySelector('header');
            if (header && header.nextSibling) {
                header.parentNode.insertBefore(breadcrumbContainer, header.nextSibling);
            }
        }

        const breadcrumbHTML = breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return `
                <span class="breadcrumb-item ${isLast ? 'current' : ''}">
                    ${isLast ? 
                        `<span aria-current="page">${crumb.name}</span>` : 
                        `<a href="${crumb.url}">${crumb.name}</a>`
                    }
                    ${!isLast ? '<span class="separator">›</span>' : ''}
                </span>
            `;
        }).join('');

        breadcrumbContainer.innerHTML = `
            <div class="container">
                <ol class="breadcrumb-list">${breadcrumbHTML}</ol>
            </div>
        `;
    }

    addBreadcrumbStructuredData(breadcrumbs) {
        const breadcrumbData = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((crumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": crumb.name,
                "item": crumb.url
            }))
        };

        // Add to existing structured data or create new
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
            try {
                const existingData = JSON.parse(existingScript.textContent);
                if (Array.isArray(existingData)) {
                    existingData.push(breadcrumbData);
                } else {
                    existingScript.textContent = JSON.stringify([existingData, breadcrumbData], null, 2);
                }
            } catch (e) {
                // If can't parse, just add new script
                this.insertStructuredData(breadcrumbData);
            }
        } else {
            this.insertStructuredData(breadcrumbData);
        }
    }

    // Core Web Vitals Monitoring
    monitorWebVitals() {
        if ('web-vitals' in window) {
            // If web-vitals library is loaded
            this.setupWebVitalsLibrary();
        } else {
            // Basic performance monitoring
            this.setupBasicPerformanceMonitoring();
        }
    }

    setupBasicPerformanceMonitoring() {
        // Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.reportWebVital('LCP', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }

        // First Input Delay
        if ('PerformanceObserver' in window) {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.reportWebVital('FID', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
        }

        // Cumulative Layout Shift
        if ('PerformanceObserver' in window) {
            let clsScore = 0;
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsScore += entry.value;
                    }
                });
                this.reportWebVital('CLS', clsScore);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }

    reportWebVital(metric, value) {
        // Send to analytics
        if (window.analyticsManager) {
            window.analyticsManager.trackEvent('web_vital', {
                metric: metric,
                value: value,
                page: window.location.pathname
            });
        }

        // Log for debugging
        if (this.debug) {
            console.log(`🎯 Web Vital - ${metric}:`, value);
        }
    }

    // Public API Methods
    updatePageSEO(data) {
        if (data.title) this.updateTitle(data.title);
        if (data.description) this.updateDescription(data.description);
        if (data.keywords) this.updateKeywords(data.keywords);
        if (data.image) {
            this.updateMetaProperty('og:image', data.image);
            this.updateMetaName('twitter:image', data.image);
        }
        if (data.author) this.updateAuthor(data.author);
        
        // Update structured data
        if (data.structuredData) {
            this.insertStructuredData(data.structuredData);
        } else {
            const newStructuredData = this.generateStructuredData();
            this.insertStructuredData(newStructuredData);
        }
    }

    generateSitemap() {
        // This would typically be done server-side
        // For demo purposes, generate basic sitemap
        const sitemap = {
            pages: [
                { url: '/', changefreq: 'daily', priority: 1.0 },
                { url: '/admin.html', changefreq: 'weekly', priority: 0.5 },
                { url: '/pwa-demo.html', changefreq: 'monthly', priority: 0.3 }
            ],
            lastModified: new Date().toISOString()
        };

        if (this.debug) {
            console.log('🗺️ Generated sitemap:', sitemap);
        }

        return sitemap;
    }

    checkSEOHealth() {
        const health = {
            score: 0,
            issues: [],
            recommendations: []
        };

        // Check title
        const title = document.title;
        if (!title || title.length < 30) {
            health.issues.push('Título muito curto');
            health.recommendations.push('Use títulos entre 30-60 caracteres');
        } else if (title.length > 60) {
            health.issues.push('Título muito longo');
            health.recommendations.push('Use títulos entre 30-60 caracteres');
        } else {
            health.score += 20;
        }

        // Check meta description
        const description = document.querySelector('meta[name="description"]')?.content;
        if (!description || description.length < 120) {
            health.issues.push('Meta descrição muito curta');
            health.recommendations.push('Use descrições entre 120-160 caracteres');
        } else if (description.length > 160) {
            health.issues.push('Meta descrição muito longa');
            health.recommendations.push('Use descrições entre 120-160 caracteres');
        } else {
            health.score += 20;
        }

        // Check canonical URL
        if (document.querySelector('link[rel="canonical"]')) {
            health.score += 15;
        } else {
            health.issues.push('URL canônica ausente');
            health.recommendations.push('Adicione link canonical');
        }

        // Check Open Graph
        if (document.querySelector('meta[property="og:title"]')) {
            health.score += 15;
        } else {
            health.issues.push('Open Graph incompleto');
            health.recommendations.push('Adicione meta tags Open Graph');
        }

        // Check structured data
        if (document.querySelector('script[type="application/ld+json"]')) {
            health.score += 15;
        } else {
            health.issues.push('Dados estruturados ausentes');
            health.recommendations.push('Adicione JSON-LD schema');
        }

        // Check images alt text
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
        if (imagesWithoutAlt.length > 0) {
            health.issues.push(`${imagesWithoutAlt.length} imagens sem alt text`);
            health.recommendations.push('Adicione alt text em todas as imagens');
        } else if (images.length > 0) {
            health.score += 15;
        }

        health.score = Math.min(100, health.score);
        
        return health;
    }
}

// Export and initialize
const seoManager = new SEOManager();
window.seoManager = seoManager;

export default SEOManager;
