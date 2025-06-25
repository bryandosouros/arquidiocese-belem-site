// Analytics Dashboard - Release 5A
// Dashboard para visualização de métricas e analytics no painel administrativo

class AnalyticsDashboard {
    constructor() {
        this.charts = new Map();
        this.metricsData = new Map();
        this.isInitialized = false;
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        console.log('📊 Analytics Dashboard initializing...');
        
        // Wait for analytics manager
        if (!window.analyticsManager) {
            setTimeout(() => this.init(), 1000);
            return;
        }
        
        this.setupDashboard();
        this.startDataRefresh();
        
        this.isInitialized = true;
        console.log('✅ Analytics Dashboard initialized');
    }

    setupDashboard() {
        // Create dashboard container
        const dashboardHTML = `
            <div class="analytics-dashboard">
                <div class="dashboard-header">
                    <h3>📊 Analytics e Métricas</h3>
                    <div class="dashboard-controls">
                        <select id="analytics-period" class="form-control">
                            <option value="today">Hoje</option>
                            <option value="week" selected>Esta Semana</option>
                            <option value="month">Este Mês</option>
                            <option value="quarter">Este Trimestre</option>
                        </select>
                        <button id="refresh-analytics" class="btn btn-secondary">
                            🔄 Atualizar
                        </button>
                        <button id="export-analytics" class="btn btn-primary">
                            📤 Exportar
                        </button>
                    </div>
                </div>

                <div class="dashboard-metrics">
                    <div class="metrics-grid">
                        <!-- Core Metrics -->
                        <div class="metric-card">
                            <div class="metric-icon">👥</div>
                            <div class="metric-content">
                                <div class="metric-value" id="total-visitors">-</div>
                                <div class="metric-label">Visitantes Únicos</div>
                                <div class="metric-change" id="visitors-change">-</div>
                            </div>
                        </div>

                        <div class="metric-card">
                            <div class="metric-icon">📄</div>
                            <div class="metric-content">
                                <div class="metric-value" id="page-views">-</div>
                                <div class="metric-label">Visualizações</div>
                                <div class="metric-change" id="pageviews-change">-</div>
                            </div>
                        </div>

                        <div class="metric-card">
                            <div class="metric-icon">📱</div>
                            <div class="metric-content">
                                <div class="metric-value" id="pwa-installs">-</div>
                                <div class="metric-label">Instalações PWA</div>
                                <div class="metric-change" id="installs-change">-</div>
                            </div>
                        </div>

                        <div class="metric-card">
                            <div class="metric-icon">⏱️</div>
                            <div class="metric-content">
                                <div class="metric-value" id="avg-session">-</div>
                                <div class="metric-label">Tempo Médio</div>
                                <div class="metric-change" id="session-change">-</div>
                            </div>
                        </div>

                        <!-- Church-specific Metrics -->
                        <div class="metric-card church-metric">
                            <div class="metric-icon">🙏</div>
                            <div class="metric-content">
                                <div class="metric-value" id="prayer-requests">-</div>
                                <div class="metric-label">Pedidos de Oração</div>
                                <div class="metric-change" id="prayers-change">-</div>
                            </div>
                        </div>

                        <div class="metric-card church-metric">
                            <div class="metric-icon">⛪</div>
                            <div class="metric-content">
                                <div class="metric-value" id="mass-views">-</div>
                                <div class="metric-label">Missas Visualizadas</div>
                                <div class="metric-change" id="masses-change">-</div>
                            </div>
                        </div>

                        <div class="metric-card church-metric">
                            <div class="metric-icon">📧</div>
                            <div class="metric-content">
                                <div class="metric-value" id="newsletter-subs">-</div>
                                <div class="metric-label">Newsletter</div>
                                <div class="metric-change" id="newsletter-change">-</div>
                            </div>
                        </div>

                        <div class="metric-card church-metric">
                            <div class="metric-icon">❤️</div>
                            <div class="metric-content">
                                <div class="metric-value" id="donations">-</div>
                                <div class="metric-label">Doações</div>
                                <div class="metric-change" id="donations-change">-</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-charts">
                    <div class="chart-row">
                        <div class="chart-container">
                            <h4>Tráfego por Dia</h4>
                            <canvas id="traffic-chart"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4>Conteúdo Mais Acessado</h4>
                            <div id="popular-content" class="content-list"></div>
                        </div>
                    </div>

                    <div class="chart-row">
                        <div class="chart-container">
                            <h4>Dispositivos</h4>
                            <canvas id="devices-chart"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4>Core Web Vitals</h4>
                            <div id="web-vitals" class="vitals-container"></div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-realtime">
                    <h4>📡 Atividade em Tempo Real</h4>
                    <div id="realtime-activity" class="activity-feed"></div>
                </div>

                <div class="dashboard-seo">
                    <h4>🔍 SEO e Sitemap</h4>
                    <div class="seo-tools">
                        <div class="seo-status">
                            <div class="seo-item">
                                <span class="seo-label">Sitemap:</span>
                                <span class="seo-value" id="sitemap-status">Verificando...</span>
                                <button id="generate-sitemap" class="btn btn-sm btn-secondary">Gerar</button>
                            </div>
                            <div class="seo-item">
                                <span class="seo-label">Páginas Indexadas:</span>
                                <span class="seo-value" id="indexed-pages">-</span>
                            </div>
                            <div class="seo-item">
                                <span class="seo-label">Core Web Vitals:</span>
                                <span class="seo-value" id="cwv-status">Carregando...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert into admin panel
        const adminContent = document.querySelector('.admin-content');
        if (adminContent) {
            const dashboardTab = document.createElement('div');
            dashboardTab.className = 'admin-section';
            dashboardTab.id = 'analytics-section';
            dashboardTab.innerHTML = dashboardHTML;
            adminContent.appendChild(dashboardTab);
        }

        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refresh-analytics')?.addEventListener('click', () => {
            this.refreshData();
        });

        // Export button
        document.getElementById('export-analytics')?.addEventListener('click', () => {
            this.exportData();
        });

        // Period selector
        document.getElementById('analytics-period')?.addEventListener('change', (e) => {
            this.changePeriod(e.target.value);
        });

        // Generate sitemap button
        document.getElementById('generate-sitemap')?.addEventListener('click', () => {
            this.generateSitemap();
        });
    }

    async loadInitialData() {
        // Simulate loading analytics data
        await this.updateMetrics();
        this.updateCharts();
        this.updateRealtimeActivity();
        this.updateSEOStatus();
    }

    async updateMetrics() {
        // In a real implementation, this would fetch from Google Analytics API
        // For now, we'll use simulated data and local storage
        
        const mockData = {
            totalVisitors: Math.floor(Math.random() * 1000) + 500,
            pageViews: Math.floor(Math.random() * 5000) + 2000,
            pwaInstalls: Math.floor(Math.random() * 50) + 25,
            avgSession: '3:45',
            prayerRequests: Math.floor(Math.random() * 100) + 50,
            massViews: Math.floor(Math.random() * 200) + 100,
            newsletterSubs: Math.floor(Math.random() * 300) + 200,
            donations: Math.floor(Math.random() * 20) + 10
        };

        // Update metric displays
        this.updateMetricDisplay('total-visitors', mockData.totalVisitors, '+12%');
        this.updateMetricDisplay('page-views', mockData.pageViews.toLocaleString(), '+8%');
        this.updateMetricDisplay('pwa-installs', mockData.pwaInstalls, '+25%');
        this.updateMetricDisplay('avg-session', mockData.avgSession, '+5%');
        this.updateMetricDisplay('prayer-requests', mockData.prayerRequests, '+15%');
        this.updateMetricDisplay('mass-views', mockData.massViews, '+20%');
        this.updateMetricDisplay('newsletter-subs', mockData.newsletterSubs, '+10%');
        this.updateMetricDisplay('donations', mockData.donations, '+30%');
    }

    updateMetricDisplay(id, value, change) {
        const valueElement = document.getElementById(id);
        const changeElement = document.getElementById(id.replace(/([^-]+)/, '$1s') + '-change');
        
        if (valueElement) valueElement.textContent = value;
        if (changeElement) {
            changeElement.textContent = change;
            changeElement.className = 'metric-change ' + (change.startsWith('+') ? 'positive' : 'negative');
        }
    }

    updateCharts() {
        // Simple chart implementation (you could integrate Chart.js here)
        this.updatePopularContent();
        this.updateWebVitals();
    }

    updatePopularContent() {
        const container = document.getElementById('popular-content');
        if (!container) return;

        const popularContent = [
            { title: 'Comunicado Arquidiocesano', views: 1250, type: 'comunicado' },
            { title: 'Homilia Dominical', views: 980, type: 'homilia' },
            { title: 'Decreto Episcopal', views: 750, type: 'decreto' },
            { title: 'Notícia da Semana', views: 680, type: 'noticia' },
            { title: 'Calendário Litúrgico', views: 520, type: 'documento' }
        ];

        container.innerHTML = popularContent.map(item => `
            <div class="content-item">
                <div class="content-title">${item.title}</div>
                <div class="content-meta">
                    <span class="content-type ${item.type}">${item.type}</span>
                    <span class="content-views">${item.views} visualizações</span>
                </div>
            </div>
        `).join('');
    }

    updateWebVitals() {
        const container = document.getElementById('web-vitals');
        if (!container) return;

        const vitals = [
            { name: 'LCP', value: '1.2s', status: 'good', description: 'Largest Contentful Paint' },
            { name: 'FID', value: '45ms', status: 'good', description: 'First Input Delay' },
            { name: 'CLS', value: '0.08', status: 'needs-improvement', description: 'Cumulative Layout Shift' }
        ];

        container.innerHTML = vitals.map(vital => `
            <div class="vital-item ${vital.status}">
                <div class="vital-name">${vital.name}</div>
                <div class="vital-value">${vital.value}</div>
                <div class="vital-description">${vital.description}</div>
            </div>
        `).join('');
    }

    updateRealtimeActivity() {
        const container = document.getElementById('realtime-activity');
        if (!container) return;

        // Simulate real-time activity
        const activities = [
            'Usuário acessou "Comunicados Arquidiocesanos"',
            'Nova inscrição no newsletter',
            'Pedido de oração enviado',
            'Download de documento litúrgico',
            'Compartilhamento no Facebook'
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const timestamp = new Date().toLocaleTimeString();
        
        const activityHTML = `
            <div class="activity-item">
                <span class="activity-time">${timestamp}</span>
                <span class="activity-description">${randomActivity}</span>
            </div>
        `;

        container.innerHTML = activityHTML + (container.innerHTML || '');
        
        // Keep only last 10 activities
        const items = container.querySelectorAll('.activity-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
    }

    updateSEOStatus() {
        const sitemapStatus = document.getElementById('sitemap-status');
        const indexedPages = document.getElementById('indexed-pages');
        const cwvStatus = document.getElementById('cwv-status');

        if (sitemapStatus) sitemapStatus.textContent = 'Atualizado há 2 dias';
        if (indexedPages) indexedPages.textContent = '23 páginas';
        if (cwvStatus) cwvStatus.textContent = 'Bom (2/3)';
    }

    async generateSitemap() {
        const button = document.getElementById('generate-sitemap');
        if (!button) return;

        button.disabled = true;
        button.textContent = 'Gerando...';

        try {
            if (window.sitemapGenerator) {
                const result = await window.sitemapGenerator.refreshSitemap();
                
                if (result.success) {
                    button.textContent = 'Gerado!';
                    document.getElementById('sitemap-status').textContent = 'Atualizado agora';
                    
                    // Show success message
                    this.showToast('Sitemap gerado com sucesso!', 'success');
                } else {
                    throw new Error(result.error);
                }
            } else {
                throw new Error('Gerador de sitemap não disponível');
            }
        } catch (error) {
            button.textContent = 'Erro';
            this.showToast('Erro ao gerar sitemap: ' + error.message, 'error');
        }

        setTimeout(() => {
            button.disabled = false;
            button.textContent = 'Gerar';
        }, 2000);
    }

    refreshData() {
        this.updateMetrics();
        this.updateCharts();
        this.updateSEOStatus();
        this.showToast('Dados atualizados!', 'success');
    }

    changePeriod(period) {
        console.log('Changing period to:', period);
        this.refreshData();
    }

    exportData() {
        const data = {
            period: document.getElementById('analytics-period')?.value,
            generatedAt: new Date().toISOString(),
            metrics: {
                visitors: document.getElementById('total-visitors')?.textContent,
                pageViews: document.getElementById('page-views')?.textContent,
                pwaInstalls: document.getElementById('pwa-installs')?.textContent,
                avgSession: document.getElementById('avg-session')?.textContent
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${data.period}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Dados exportados!', 'success');
    }

    startDataRefresh() {
        // Update real-time activity every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.updateRealtimeActivity();
        }, 30000);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Export and create global instance
const analyticsDashboard = new AnalyticsDashboard();
window.analyticsDashboard = analyticsDashboard;

export default AnalyticsDashboard;
