// Enhanced Service Worker - Release 6B: PWA Avançado e Performance
// Cache inteligente avançado, performance otimizada e sincronização robusta

const SW_VERSION = '6B.1.0';
const CACHE_NAME = 'arquidiocese-pwa-v6b';
const CONTENT_CACHE = 'arquidiocese-content-v6b';
const STATIC_CACHE = 'arquidiocese-static-v6b';
const DYNAMIC_CACHE = 'arquidiocese-dynamic-v6b';
const MOBILE_CACHE = 'arquidiocese-mobile-v6b';

// Performance and Analytics
let performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    averageResponseTime: 0,
    backgroundSyncCount: 0
};

// Enhanced critical resources for Release 6B
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/admin.html',
    '/login.html',
    '/post.html',
    '/css/style.css',
    '/css/arquidiocese-theme.css',
    '/css/rcc-theme.css',
    '/css/shalom-theme.css',
    '/js/main.js',
    '/js/admin.js',
    '/js/multi-site-template.js',
    '/js/content-strategy.js',
    '/js/content-strategy-ui.js',
    '/js/firebase-config.js',
    '/js/darkmode.js',
    // Release 6A Mobile Scripts
    '/js/mobile-ux.js',
    '/js/mobile-gestures.js',
    '/js/mobile-forms.js',
    // Release 6B Advanced PWA Scripts
    '/js/advanced-pwa-controller.js',
    '/js/pwa-performance-monitor.js',
    '/images/logo-arquidiocese-belem.png',
    '/manifest.json'
];

// Enhanced static resources with mobile optimization
const STATIC_RESOURCES = [
    '/css/',
    '/js/',
    '/images/',
    'https://fonts.googleapis.com/',
    'https://fonts.gstatic.com/',
    'https://www.gstatic.com/firebasejs/'
];

// API endpoints with intelligent caching
const API_ENDPOINTS = [
    'https://belem-hb.firebaseapp.com',
    'https://firestore.googleapis.com',
    '/api/posts',
    '/api/user',
    '/api/notifications',
    '/api/analytics'
];

// Performance monitoring
const PERFORMANCE_THRESHOLDS = {
    slowResponse: 3000, // 3 seconds
    cacheHitRateTarget: 0.8, // 80%
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    backgroundSyncTimeout: 30000 // 30 seconds
};

class PWAServiceWorker {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingSync = [];
        this.lastSyncTime = Date.now();
    }

    // Install Event - Cache recursos críticos
    async handleInstall(event) {
        console.log('🚀 PWA Service Worker installing...');
        
        event.waitUntil(
            Promise.all([
                this.cacheStaticResources(),
                this.setupBackgroundSync(),
                self.skipWaiting()
            ])
        );
    }

    async cacheStaticResources() {
        try {
            const cache = await caches.open(STATIC_CACHE);
            console.log('📦 Caching critical resources...');
            
            // Cache recursos críticos um por um para evitar falhas
            for (const resource of CRITICAL_RESOURCES) {
                try {
                    await cache.add(resource);
                    console.log(`✅ Cached: ${resource}`);
                } catch (error) {
                    console.warn(`⚠️ Failed to cache ${resource}:`, error);
                }
            }
            
            console.log('✅ Static resources cached successfully');
        } catch (error) {
            console.error('❌ Failed to cache static resources:', error);
        }
    }

    // Activate Event - Limpar caches antigos
    async handleActivate(event) {
        console.log('🔄 PWA Service Worker activating...');
        
        event.waitUntil(
            Promise.all([
                this.cleanOldCaches(),
                self.clients.claim(),
                this.enableNavigationPreload()
            ])
        );
    }

    async cleanOldCaches() {
        const cacheNames = await caches.keys();
        const cachesToDelete = cacheNames.filter(name => 
            name !== CACHE_NAME && 
            name !== CONTENT_CACHE && 
            name !== STATIC_CACHE &&
            name !== DYNAMIC_CACHE
        );

        await Promise.all(
            cachesToDelete.map(cache => {
                console.log(`🗑️ Deleting old cache: ${cache}`);
                return caches.delete(cache);
            })
        );
    }

    async enableNavigationPreload() {
        if ('navigationPreload' in self.registration) {
            await self.registration.navigationPreload.enable();
            console.log('⚡ Navigation preload enabled');
        }
    }

    // Fetch Event - Estratégia de cache inteligente
    async handleFetch(event) {
        const { request } = event;
        const url = new URL(request.url);

        // Estratégias diferentes baseadas no tipo de recurso
        if (this.isHTMLRequest(request)) {
            event.respondWith(this.handleHTMLRequest(request));
        } else if (this.isAPIRequest(url)) {
            event.respondWith(this.handleAPIRequest(request));
        } else if (this.isStaticResource(url)) {
            event.respondWith(this.handleStaticResource(request));
        } else if (this.isFirebaseResource(url)) {
            event.respondWith(this.handleFirebaseResource(request));
        } else {
            event.respondWith(this.handleDynamicResource(request));
        }
    }

    // Estratégia para HTML: Network First com fallback para cache
    async handleHTMLRequest(request) {
        try {
            // Tentar buscar da rede primeiro
            const networkResponse = await fetch(request);
            
            if (networkResponse && networkResponse.status === 200) {
                // Cache a resposta para uso offline
                const cache = await caches.open(CONTENT_CACHE);
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            console.log('🔌 Network failed, trying cache...');
        }

        // Fallback para cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback final - página offline
        return this.getOfflinePage(request);
    }

    // Estratégia para API: Network First com cache para offline
    async handleAPIRequest(request) {
        try {
            const networkResponse = await fetch(request);
            
            if (networkResponse && networkResponse.status === 200) {
                // Cache apenas responses de sucesso
                const cache = await caches.open(DYNAMIC_CACHE);
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            console.log('🔌 API network failed, trying cache...');
        }

        // Fallback para cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Adicionar header indicando que veio do cache
            const response = cachedResponse.clone();
            response.headers.set('X-Served-From', 'sw-cache');
            return response;
        }

        // Se não há cache, retornar resposta offline
        return this.getOfflineAPIResponse(request);
    }

    // Estratégia para recursos estáticos: Cache First
    async handleStaticResource(request) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.status === 200) {
                const cache = await caches.open(STATIC_CACHE);
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            console.log('🔌 Static resource network failed');
        }

        // Fallback para recurso genérico
        return this.getStaticFallback(request);
    }

    // Estratégia para Firebase: Sempre da rede quando possível
    async handleFirebaseResource(request) {
        try {
            return await fetch(request);
        } catch (error) {
            console.log('🔌 Firebase network failed, trying cache...');
            const cachedResponse = await caches.match(request);
            return cachedResponse || new Response('{}', { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Estratégia para recursos dinâmicos: Network First com timeout
    async handleDynamicResource(request) {
        try {
            const networkResponse = await Promise.race([
                fetch(request),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Network timeout')), 3000)
                )
            ]);
            
            if (networkResponse && networkResponse.status === 200) {
                const cache = await caches.open(DYNAMIC_CACHE);
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            console.log('🔌 Dynamic resource failed, trying cache...');
        }

        const cachedResponse = await caches.match(request);
        return cachedResponse || this.getGenericFallback();
    }

    // Background Sync para sincronizar dados offline
    async handleBackgroundSync(event) {
        console.log('🔄 Background sync triggered:', event.tag);
        
        if (event.tag === 'content-sync') {
            event.waitUntil(this.syncContent());
        } else if (event.tag === 'user-actions') {
            event.waitUntil(this.syncUserActions());
        }
    }

    async syncContent() {
        try {
            console.log('📡 Syncing content in background...');
            
            // Sincronizar posts mais recentes
            const response = await fetch('/api/posts/recent');
            if (response.ok) {
                const posts = await response.json();
                await this.updateContentCache(posts);
                console.log('✅ Content synced successfully');
                
                // Notificar usuários sobre novo conteúdo
                this.showNotification('Novo conteúdo disponível!', {
                    body: 'Novos decretos e notícias foram sincronizados.',
                    icon: '/images/logo-arquidiocese-belem.png',
                    badge: '/images/badge-icon.png',
                    tag: 'content-update'
                });
            }
        } catch (error) {
            console.error('❌ Content sync failed:', error);
        }
    }

    async syncUserActions() {
        try {
            const pendingActions = await this.getPendingActions();
            
            for (const action of pendingActions) {
                try {
                    await this.executeAction(action);
                    await this.removePendingAction(action.id);
                    console.log(`✅ Synced action: ${action.type}`);
                } catch (error) {
                    console.warn(`⚠️ Failed to sync action ${action.id}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ User actions sync failed:', error);
        }
    }

    // Push Notifications
    async handlePushEvent(event) {
        console.log('📱 Push notification received:', event);
        
        const data = event.data ? event.data.json() : {};
        const options = {
            body: data.body || 'Nova atualização da Arquidiocese',
            icon: '/images/logo-arquidiocese-belem.png',
            badge: '/images/badge-icon.png',
            vibrate: [200, 100, 200],
            data: data.data || {},
            actions: [
                {
                    action: 'view',
                    title: 'Ver Agora',
                    icon: '/images/view-icon.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dispensar',
                    icon: '/images/dismiss-icon.png'
                }
            ],
            requireInteraction: data.urgent || false,
            tag: data.tag || 'general'
        };

        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Arquidiocese de Belém',
                options
            )
        );
    }

    // Click em notificação
    async handleNotificationClick(event) {
        console.log('🖱️ Notification clicked:', event);
        
        event.notification.close();
        
        const action = event.action;
        const data = event.notification.data;
        
        if (action === 'view' || !action) {
            const url = data.url || '/';
            event.waitUntil(
                clients.openWindow(url)
            );
        }
        // 'dismiss' não faz nada - apenas fecha a notificação
    }

    // Utilidades
    isHTMLRequest(request) {
        return request.headers.get('Accept')?.includes('text/html');
    }

    isAPIRequest(url) {
        return API_URLS.some(apiUrl => url.href.includes(apiUrl)) ||
               url.pathname.startsWith('/api/');
    }

    isStaticResource(url) {
        return STATIC_RESOURCES.some(resource => 
            url.href.includes(resource) || url.pathname.startsWith(resource)
        );
    }

    isFirebaseResource(url) {
        return url.href.includes('firebaseapp.com') || 
               url.href.includes('googleapis.com') ||
               url.href.includes('gstatic.com');
    }

    async getOfflinePage(request) {
        const url = new URL(request.url);
        
        // Diferentes páginas offline baseadas na URL
        if (url.pathname.includes('admin')) {
            return this.createOfflineAdminPage();
        } else if (url.pathname.includes('post')) {
            return this.createOfflinePostPage();
        } else {
            return this.createOfflineHomePage();
        }
    }

    createOfflineHomePage() {
        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Arquidiocese - Modo Offline</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; }
                    .offline-container { max-width: 600px; margin: 0 auto; }
                    .logo { width: 100px; height: 100px; margin-bottom: 1rem; }
                    .offline-message { color: #666; margin-bottom: 2rem; }
                    .retry-btn { background: #1a365d; color: white; padding: 1rem 2rem; border: none; border-radius: 5px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <img src="/images/logo-arquidiocese-belem.png" alt="Logo" class="logo">
                    <h1>Modo Offline</h1>
                    <p class="offline-message">
                        Você está navegando offline. Algumas funcionalidades podem estar limitadas.
                        O conteúdo será sincronizado quando a conexão for restaurada.
                    </p>
                    <button class="retry-btn" onclick="window.location.reload()">
                        Tentar Novamente
                    </button>
                </div>
            </body>
            </html>
        `;
        
        return new Response(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    createOfflineAdminPage() {
        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin - Modo Offline</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: #f5f5f5; }
                    .offline-container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 10px; }
                    .warning { color: #e74c3c; margin-bottom: 1rem; }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <h1>🔒 Painel Administrativo</h1>
                    <p class="warning">
                        ⚠️ O painel administrativo requer conexão com a internet.
                        Por favor, verifique sua conexão e tente novamente.
                    </p>
                    <button onclick="window.location.reload()">Tentar Novamente</button>
                </div>
            </body>
            </html>
        `;
        
        return new Response(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    getOfflineAPIResponse(request) {
        return new Response(JSON.stringify({
            error: 'offline',
            message: 'API não disponível offline',
            cachedAt: this.lastSyncTime
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    getStaticFallback(request) {
        const url = new URL(request.url);
        
        if (url.pathname.endsWith('.css')) {
            return new Response('/* Offline CSS fallback */', {
                headers: { 'Content-Type': 'text/css' }
            });
        } else if (url.pathname.endsWith('.js')) {
            return new Response('// Offline JS fallback', {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }
        
        return new Response('Resource not available offline', { status: 404 });
    }

    getGenericFallback() {
        return new Response('Content not available offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    // Métodos auxiliares
    async showNotification(title, options) {
        if ('serviceWorker' in navigator && 'Notification' in window) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, options);
        }
    }

    async updateContentCache(posts) {
        const cache = await caches.open(CONTENT_CACHE);
        // Implementar lógica de atualização do cache de conteúdo
    }

    async getPendingActions() {
        // Implementar lógica para recuperar ações pendentes
        return [];
    }

    async executeAction(action) {
        // Implementar lógica para executar ações pendentes
    }

    async removePendingAction(actionId) {
        // Implementar lógica para remover ação pendente
    }

    setupBackgroundSync() {
        // Registrar tags de sync
        if ('sync' in self.registration) {
            console.log('🔄 Background sync support detected');
        }
    }
}

// Instância global do Service Worker
const pwaWorker = new PWAServiceWorker();

// Event Listeners
self.addEventListener('install', event => pwaWorker.handleInstall(event));
self.addEventListener('activate', event => pwaWorker.handleActivate(event));
self.addEventListener('fetch', event => pwaWorker.handleFetch(event));
self.addEventListener('sync', event => pwaWorker.handleBackgroundSync(event));
self.addEventListener('push', event => pwaWorker.handlePushEvent(event));
self.addEventListener('notificationclick', event => pwaWorker.handleNotificationClick(event));

console.log('🚀 Release 4B: PWA Service Worker loaded successfully!');
