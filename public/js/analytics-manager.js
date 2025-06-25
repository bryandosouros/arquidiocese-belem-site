// Analytics Manager - Release 5A
// Sistema avançado de analytics e métricas para a Arquidiocese

class AnalyticsManager {
    constructor() {
        this.isInitialized = false;
        this.debug = window.location.hostname === 'localhost';
        this.googleAnalyticsId = 'G-92E26Y6HB1'; // Your GA4 ID
        this.customMetrics = new Map();
        this.sessionData = this.initializeSession();
        this.performance = new PerformanceMonitor();
        
        this.init();
    }

    async init() {
        console.log('📊 Analytics Manager initializing...');
        
        // Initialize Google Analytics 4
        await this.initializeGA4();
        
        // Initialize custom analytics
        this.initializeCustomAnalytics();
        
        // Setup performance monitoring
        this.performance.init();
        
        // Setup user behavior tracking
        this.setupBehaviorTracking();
        
        // Setup content analytics
        this.setupContentAnalytics();
        
        // Setup PWA analytics
        this.setupPWAAnalytics();
        
        this.isInitialized = true;
        console.log('✅ Analytics Manager initialized');
    }

    // Google Analytics 4 Setup
    async initializeGA4() {
        if (this.debug) {
            console.log('🧪 Analytics in debug mode - tracking disabled');
            return;
        }

        try {
            // Load GA4
            const script1 = document.createElement('script');
            script1.async = true;
            script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.googleAnalyticsId}`;
            document.head.appendChild(script1);

            // Initialize gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            
            gtag('js', new Date());
            gtag('config', this.googleAnalyticsId, {
                page_title: document.title,
                page_location: window.location.href,
                custom_map: {
                    'custom_parameter_1': 'site_type',
                    'custom_parameter_2': 'content_category',
                    'custom_parameter_3': 'user_role'
                }
            });

            console.log('✅ Google Analytics 4 initialized');
        } catch (error) {
            console.error('❌ Failed to initialize GA4:', error);
        }
    }

    // Custom Analytics for Church-specific metrics
    initializeCustomAnalytics() {
        this.customMetrics.set('prayers_viewed', 0);
        this.customMetrics.set('masses_scheduled', 0);
        this.customMetrics.set('documents_downloaded', 0);
        this.customMetrics.set('events_registered', 0);
        this.customMetrics.set('content_shared', 0);
        this.customMetrics.set('newsletter_signups', 0);
        this.customMetrics.set('donations_initiated', 0);

        // Load stored metrics
        this.loadStoredMetrics();
    }

    // Session Management
    initializeSession() {
        const sessionId = this.generateSessionId();
        const sessionData = {
            id: sessionId,
            startTime: Date.now(),
            pageViews: 0,
            events: [],
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            site: this.getCurrentSite(),
            isReturningVisitor: this.isReturningUser()
        };

        sessionStorage.setItem('analytics_session', JSON.stringify(sessionData));
        return sessionData;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentSite() {
        if (window.multiSiteTemplateEngine) {
            return window.multiSiteTemplateEngine.getCurrentSite();
        }
        
        const url = window.location.hostname;
        if (url.includes('rcc')) return 'rcc';
        if (url.includes('shalom')) return 'shalom';
        return 'arquidiocese';
    }

    isReturningUser() {
        const visited = localStorage.getItem('analytics_visited');
        if (!visited) {
            localStorage.setItem('analytics_visited', 'true');
            return false;
        }
        return true;
    }

    // Behavior Tracking
    setupBehaviorTracking() {
        // Page views
        this.trackPageView();
        
        // Scroll depth
        this.trackScrollDepth();
        
        // Time on page
        this.trackTimeOnPage();
        
        // Click tracking
        this.trackClicks();
        
        // Form interactions
        this.trackFormInteractions();
        
        // Search behavior
        this.trackSearchBehavior();
    }

    trackPageView() {
        this.sessionData.pageViews++;
        this.updateSession();
        
        const pageData = {
            page: window.location.pathname,
            title: document.title,
            site: this.sessionData.site,
            timestamp: Date.now(),
            referrer: document.referrer
        };

        this.trackEvent('page_view', pageData);
        
        if (window.gtag) {
            gtag('event', 'page_view', pageData);
        }
    }

    trackScrollDepth() {
        let maxScroll = 0;
        const checkpoints = [25, 50, 75, 100];
        const tracked = new Set();

        const trackScroll = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
            }

            checkpoints.forEach(checkpoint => {
                if (scrollPercent >= checkpoint && !tracked.has(checkpoint)) {
                    tracked.add(checkpoint);
                    this.trackEvent('scroll_depth', {
                        depth: checkpoint,
                        page: window.location.pathname
                    });
                }
            });
        };

        window.addEventListener('scroll', trackScroll, { passive: true });
        
        // Track scroll on page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('max_scroll_depth', {
                depth: maxScroll,
                page: window.location.pathname
            });
        });
    }

    trackTimeOnPage() {
        const startTime = Date.now();
        
        const trackTimeSpent = () => {
            const timeSpent = Date.now() - startTime;
            this.trackEvent('time_on_page', {
                seconds: Math.round(timeSpent / 1000),
                page: window.location.pathname
            });
        };

        window.addEventListener('beforeunload', trackTimeSpent);
        
        // Track engagement time every 30 seconds
        setInterval(() => {
            if (document.hasFocus()) {
                this.trackEvent('engagement_time', {
                    interval: 30,
                    page: window.location.pathname
                });
            }
        }, 30000);
    }

    trackClicks() {
        document.addEventListener('click', (e) => {
            const element = e.target.closest('a, button, [data-track]');
            if (!element) return;

            const trackData = {
                element: element.tagName.toLowerCase(),
                text: element.textContent?.slice(0, 100),
                href: element.href || null,
                classes: element.className,
                page: window.location.pathname
            };

            // Special tracking for specific elements
            if (element.closest('.pwa-install-button')) {
                this.trackEvent('pwa_install_clicked', trackData);
            } else if (element.closest('.share-button')) {
                this.trackEvent('content_share_clicked', trackData);
            } else if (element.closest('.donation-button')) {
                this.trackEvent('donation_clicked', trackData);
            } else if (element.closest('.contact-button')) {
                this.trackEvent('contact_clicked', trackData);
            } else {
                this.trackEvent('click', trackData);
            }
        });
    }

    trackFormInteractions() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!form.matches('form')) return;

            this.trackEvent('form_submit', {
                form_id: form.id || 'unnamed',
                form_action: form.action || window.location.href,
                page: window.location.pathname
            });
        });

        // Form field interactions
        document.addEventListener('focus', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.trackEvent('form_field_focus', {
                    field_type: e.target.type || e.target.tagName.toLowerCase(),
                    field_name: e.target.name || e.target.id,
                    page: window.location.pathname
                });
            }
        }, true);
    }

    trackSearchBehavior() {
        // Track search queries
        const searchInputs = document.querySelectorAll('input[type="search"], #search-posts');
        
        searchInputs.forEach(input => {
            let searchTimeout;
            
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (e.target.value.length >= 3) {
                        this.trackEvent('search_query', {
                            query: e.target.value.toLowerCase(),
                            page: window.location.pathname
                        });
                    }
                }, 1000);
            });
        });
    }

    // Content Analytics
    setupContentAnalytics() {
        // Track content interactions
        this.trackContentViews();
        this.trackContentSharing();
        this.trackContentEngagement();
    }

    trackContentViews() {
        // Post/document views
        const postId = new URLSearchParams(window.location.search).get('id');
        if (postId && window.location.pathname.includes('post.html')) {
            this.trackEvent('content_view', {
                content_id: postId,
                content_type: 'post',
                site: this.sessionData.site
            });
            
            this.incrementCustomMetric('content_views');
        }
    }

    trackContentSharing() {
        // Track when content is shared
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-btn, .social-share')) {
                const shareData = {
                    content_id: new URLSearchParams(window.location.search).get('id'),
                    share_method: e.target.dataset.platform || 'unknown',
                    page: window.location.pathname
                };
                
                this.trackEvent('content_shared', shareData);
                this.incrementCustomMetric('content_shared');
            }
        });
    }

    trackContentEngagement() {
        // Track engagement with specific content types
        const engagementElements = document.querySelectorAll(
            '.prayer-text, .mass-schedule, .document-download, .event-details'
        );

        engagementElements.forEach(element => {
            element.addEventListener('click', (e) => {
                const contentType = Array.from(e.target.classList)
                    .find(cls => cls.includes('-'))
                    ?.replace('-', '_');

                if (contentType) {
                    this.trackEvent('content_engagement', {
                        content_type: contentType,
                        page: window.location.pathname
                    });
                    
                    this.incrementCustomMetric(contentType + '_viewed');
                }
            });
        });
    }

    // PWA Analytics
    setupPWAAnalytics() {
        // Installation tracking
        window.addEventListener('beforeinstallprompt', () => {
            this.trackEvent('pwa_install_prompt_shown');
        });

        window.addEventListener('appinstalled', () => {
            this.trackEvent('pwa_installed');
        });

        // Service Worker events
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'CACHE_UPDATED') {
                    this.trackEvent('pwa_cache_updated');
                }
            });
        }

        // Online/Offline tracking
        window.addEventListener('online', () => {
            this.trackEvent('connection_restored');
        });

        window.addEventListener('offline', () => {
            this.trackEvent('connection_lost');
        });
    }

    // Event Tracking
    trackEvent(eventName, parameters = {}) {
        const event = {
            name: eventName,
            parameters: {
                ...parameters,
                session_id: this.sessionData.id,
                timestamp: Date.now(),
                site: this.sessionData.site
            }
        };

        // Add to session events
        this.sessionData.events.push(event);
        this.updateSession();

        // Send to Google Analytics
        if (window.gtag && !this.debug) {
            gtag('event', eventName, event.parameters);
        }

        // Send to custom analytics
        this.sendToCustomAnalytics(event);

        // Debug log
        if (this.debug) {
            console.log('📊 Analytics Event:', event);
        }
    }

    // Custom Metrics
    incrementCustomMetric(metricName, value = 1) {
        const current = this.customMetrics.get(metricName) || 0;
        this.customMetrics.set(metricName, current + value);
        this.saveCustomMetrics();
    }

    getCustomMetric(metricName) {
        return this.customMetrics.get(metricName) || 0;
    }

    getAllCustomMetrics() {
        return Object.fromEntries(this.customMetrics);
    }

    // Data Management
    sendToCustomAnalytics(event) {
        // Store in localStorage for offline capability
        const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        stored.push(event);
        
        // Keep only last 1000 events
        if (stored.length > 1000) {
            stored.splice(0, stored.length - 1000);
        }
        
        localStorage.setItem('analytics_events', JSON.stringify(stored));

        // Send to server if online
        if (navigator.onLine) {
            this.sendEventToServer(event);
        }
    }

    async sendEventToServer(event) {
        try {
            // In a real app, send to your analytics server
            // For now, we'll just log it
            if (this.debug) {
                console.log('📤 Sending to server:', event);
            }
        } catch (error) {
            console.error('❌ Failed to send analytics event:', error);
        }
    }

    updateSession() {
        sessionStorage.setItem('analytics_session', JSON.stringify(this.sessionData));
    }

    saveCustomMetrics() {
        localStorage.setItem('analytics_custom_metrics', 
            JSON.stringify(Object.fromEntries(this.customMetrics)));
    }

    loadStoredMetrics() {
        const stored = localStorage.getItem('analytics_custom_metrics');
        if (stored) {
            const metrics = JSON.parse(stored);
            Object.entries(metrics).forEach(([key, value]) => {
                this.customMetrics.set(key, value);
            });
        }
    }

    // Public API
    track(eventName, parameters) {
        this.trackEvent(eventName, parameters);
    }

    getSessionData() {
        return this.sessionData;
    }

    getPerformanceMetrics() {
        return this.performance.getMetrics();
    }

    generateReport() {
        return {
            session: this.sessionData,
            customMetrics: this.getAllCustomMetrics(),
            performance: this.getPerformanceMetrics(),
            generatedAt: new Date().toISOString()
        };
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = [];
    }

    init() {
        this.measurePageLoad();
        this.measureWebVitals();
        this.setupPerformanceObserver();
    }

    measurePageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.metrics.pageLoad = {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        totalTime: navigation.loadEventEnd - navigation.fetchStart
                    };
                }
            }, 0);
        });
    }

    measureWebVitals() {
        // Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(observer);
        }

        // First Input Delay
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                });
            });
            observer.observe({ entryTypes: ['first-input'] });
            this.observers.push(observer);
        }

        // Cumulative Layout Shift
        if ('PerformanceObserver' in window) {
            let clsScore = 0;
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsScore += entry.value;
                    }
                });
                this.metrics.cls = clsScore;
            });
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(observer);
        }
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'measure') {
                        this.metrics.customMeasures = this.metrics.customMeasures || {};
                        this.metrics.customMeasures[entry.name] = entry.duration;
                    }
                });
            });
            observer.observe({ entryTypes: ['measure'] });
            this.observers.push(observer);
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }

    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Export and initialize
const analyticsManager = new AnalyticsManager();
window.analyticsManager = analyticsManager;

export default AnalyticsManager;
