// PWA Manager - Release 4B: Progressive Web App
// Gerenciamento de instalação, notificações, sync e recursos offline

import OfflineCacheManager from './offline-cache-manager.js';

class PWAManager {
    constructor() {
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        this.deferredPrompt = null;
        this.registration = null;
        this.updateAvailable = false;
        this.lastSyncTime = localStorage.getItem('lastSyncTime') || 0;
        this.offlineManager = new OfflineCacheManager();
        
        this.init();
    }

    async init() {
        console.log('🚀 PWA Manager initializing...');
        
        // Verificar se PWA já está instalado
        this.checkInstallationStatus();
        
        // Registrar Service Worker
        await this.registerServiceWorker();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        // Setup push notifications
        await this.setupPushNotifications();
        
        // Setup periodic sync
        this.setupPeriodicSync();
        
        // Check for updates
        this.checkForUpdates();
        
        // Setup offline indicator
        this.setupOfflineIndicator();
        
        console.log('✅ PWA Manager initialized successfully');
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                });
                
                console.log('✅ Service Worker registered:', this.registration);
                
                // Listen for updates
                this.registration.addEventListener('updatefound', () => {
                    this.handleServiceWorkerUpdate();
                });
                
                // Check if service worker is ready
                const ready = await navigator.serviceWorker.ready;
                console.log('🎯 Service Worker ready:', ready);
                
                return this.registration;
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
                return null;
            }
        } else {
            console.warn('⚠️ Service Workers not supported');
            return null;
        }
    }

    handleServiceWorkerUpdate() {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.showUpdateNotification();
            }
        });
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <span class="update-icon">🔄</span>
                <div class="update-text">
                    <strong>Atualização Disponível</strong>
                    <p>Uma nova versão está disponível!</p>
                </div>
                <button class="update-btn" onclick="pwaManager.applyUpdate()">
                    Atualizar
                </button>
                <button class="dismiss-btn" onclick="this.parentElement.parentElement.remove()">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 10000);
    }

    async applyUpdate() {
        if (this.registration && this.updateAvailable) {
            const newWorker = this.registration.waiting;
            if (newWorker) {
                newWorker.postMessage({ action: 'skipWaiting' });
                window.location.reload();
            }
        }
    }

    // Installation Prompt
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            this.trackInstallation();
            console.log('🎉 PWA installed successfully!');
        });
    }

    showInstallButton() {
        let installBtn = document.getElementById('pwa-install-btn');
        
        if (!installBtn) {
            installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn';
            installBtn.className = 'pwa-install-button';
            installBtn.innerHTML = `
                <span class="install-icon">📱</span>
                <span class="install-text">Instalar App</span>
            `;
            installBtn.addEventListener('click', () => this.promptInstall());
            
            // Add to header or appropriate location
            const header = document.querySelector('.admin-header, .site-header');
            if (header) {
                header.appendChild(installBtn);
            }
        }
        
        installBtn.style.display = 'flex';
    }

    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    async promptInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const choiceResult = await this.deferredPrompt.userChoice;
            
            if (choiceResult.outcome === 'accepted') {
                console.log('👍 User accepted PWA install');
            } else {
                console.log('👎 User dismissed PWA install');
            }
            
            this.deferredPrompt = null;
        }
    }

    // Push Notifications
    async setupPushNotifications() {
        if ('Notification' in window && 'PushManager' in window) {
            const permission = await this.requestNotificationPermission();
            
            if (permission === 'granted') {
                await this.subscribeToPush();
            }
        }
    }

    async requestNotificationPermission() {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
        return permission;
    }

    async subscribeToPush() {
        if (this.registration) {
            try {
                const subscription = await this.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(
                        'BMqz8gF-7KqcVCXpPpX8NKz8oEOHFwGfh1Q5T6nL5u_k8pS8r4MvXq8dVCQx7z1xKvyY8qHn1mQ7'
                    )
                });
                
                console.log('✅ Push subscription created:', subscription);
                
                // Send subscription to server
                await this.sendSubscriptionToServer(subscription);
                
                return subscription;
            } catch (error) {
                console.error('❌ Push subscription failed:', error);
                return null;
            }
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async sendSubscriptionToServer(subscription) {
        try {
            // In a real app, send to your server
            console.log('📤 Sending subscription to server:', subscription);
            
            // Store locally for demo
            localStorage.setItem('pushSubscription', JSON.stringify(subscription));
        } catch (error) {
            console.error('❌ Failed to send subscription to server:', error);
        }
    }

    // Background Sync
    setupPeriodicSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            this.scheduleBackgroundSync();
        }
    }

    async scheduleBackgroundSync() {
        if (this.registration) {
            try {
                await this.registration.sync.register('content-sync');
                console.log('🔄 Background sync scheduled');
            } catch (error) {
                console.error('❌ Background sync registration failed:', error);
            }
        }
    }

    // Offline/Online Detection
    setupOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connection-indicator';
        indicator.className = 'connection-indicator';
        document.body.appendChild(indicator);
        
        this.updateConnectionStatus();
        
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            this.syncWhenOnline();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });
    }

    updateConnectionStatus() {
        const indicator = document.getElementById('connection-indicator');
        if (indicator) {
            if (this.isOnline) {
                indicator.textContent = '🟢 Online';
                indicator.className = 'connection-indicator online';
            } else {
                indicator.textContent = '🔴 Offline';
                indicator.className = 'connection-indicator offline';
            }
        }
    }

    async syncWhenOnline() {
        if (this.isOnline && this.registration) {
            try {
                await this.registration.sync.register('user-actions');
                console.log('🔄 Sync triggered when back online');
            } catch (error) {
                console.error('❌ Online sync failed:', error);
            }
        }
    }

    // Content Caching
    async preloadCriticalContent() {
        if ('caches' in window) {
            try {
                const cache = await caches.open('arquidiocese-content-v1');
                
                // Preload critical content
                const criticalUrls = [
                    '/',
                    '/admin.html',
                    '/api/posts/recent'
                ];
                
                await cache.addAll(criticalUrls);
                console.log('✅ Critical content preloaded');
            } catch (error) {
                console.error('❌ Content preloading failed:', error);
            }
        }
    }

    // App Updates
    async checkForUpdates() {
        if (this.registration) {
            try {
                await this.registration.update();
                console.log('🔍 Checked for app updates');
            } catch (error) {
                console.error('❌ Update check failed:', error);
            }
        }
    }

    // Analytics and Tracking
    trackInstallation() {
        // Track PWA installation
        if (typeof gtag !== 'undefined') {
            gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: 'App Installed'
            });
        }
        
        // Store installation data
        localStorage.setItem('pwaInstalled', 'true');
        localStorage.setItem('pwaInstallDate', new Date().toISOString());
    }

    checkInstallationStatus() {
        // Check if running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 Running as installed PWA');
        }
        
        // Check localStorage flag
        if (localStorage.getItem('pwaInstalled') === 'true') {
            this.isInstalled = true;
        }
    }

    // Utility Methods
    setupEventListeners() {
        // Share target handling
        if (this.isShareTarget()) {
            this.handleShareTarget();
        }
        
        // Protocol handler
        this.setupProtocolHandler();
        
        // File handler
        this.setupFileHandler();
    }

    isShareTarget() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('share');
    }

    handleShareTarget() {
        console.log('📤 Handling share target');
        // Implement share target logic
    }

    setupProtocolHandler() {
        if ('registerProtocolHandler' in navigator) {
            try {
                navigator.registerProtocolHandler(
                    'web+arquidiocese',
                    '/?handler=%s',
                    'Arquidiocese'
                );
            } catch (error) {
                console.log('Protocol handler not supported');
            }
        }
    }

    setupFileHandler() {
        // File handling will be managed by the manifest
        console.log('📁 File handler setup via manifest');
    }

    // Public API
    async showNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const defaultOptions = {
                icon: '/images/logo-arquidiocese-belem.png',
                badge: '/images/badge-icon.png',
                vibrate: [200, 100, 200],
                ...options
            };
            
            if (this.registration) {
                await this.registration.showNotification(title, defaultOptions);
            } else {
                new Notification(title, defaultOptions);
            }
        }
    }

    async clearCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('🗑️ All caches cleared');
        }
    }

    getInstallationInfo() {
        return {
            isInstalled: this.isInstalled,
            isOnline: this.isOnline,
            updateAvailable: this.updateAvailable,
            lastSyncTime: this.lastSyncTime
        };
    }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Expose globally for access from other scripts
window.pwaManager = pwaManager;

// Export for module use
export default PWAManager;
