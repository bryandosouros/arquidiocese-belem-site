// Content Strategy UI Module - Release 3B
// User interface for multi-site content management

import ContentStrategy from './content-strategy.js';

class ContentStrategyUI {
    constructor() {
        this.contentStrategy = new ContentStrategy();
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserRole();
        this.renderDashboard();
    }

    setupEventListeners() {
        // Content sharing events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-content-btn')) {
                this.openShareDialog(e.target.dataset.postId);
            }
            
            if (e.target.classList.contains('approve-btn')) {
                this.processApproval(e.target.dataset.workflowId, e.target.dataset.stage, true);
            }
            
            if (e.target.classList.contains('reject-btn')) {
                this.processApproval(e.target.dataset.workflowId, e.target.dataset.stage, false);
            }
            
            if (e.target.classList.contains('schedule-btn')) {
                this.openScheduleDialog(e.target.dataset.postId);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'shareContentForm') {
                e.preventDefault();
                this.handleContentShare(e.target);
            }
            
            if (e.target.id === 'scheduleContentForm') {
                e.preventDefault();
                this.handleContentSchedule(e.target);
            }
            
            if (e.target.id === 'taxonomyForm') {
                e.preventDefault();
                this.handleTaxonomyUpdate(e.target);
            }
        });
    }

    async loadUserRole() {
        // In a real app, this would come from authentication
        this.currentUser = {
            id: 'user123',
            role: 'admin', // admin, editor, pastor, site_manager
            sites: ['arquidiocese', 'rcc', 'shalom']
        };
    }

    renderDashboard() {
        const dashboardContainer = document.getElementById('content-strategy-dashboard');
        if (!dashboardContainer) return;

        dashboardContainer.innerHTML = `
            <div class="strategy-dashboard">
                <div class="dashboard-header">
                    <h2>Estratégia de Conteúdo Multi-Site</h2>
                    <div class="dashboard-tabs">
                        <button class="tab-btn active" data-tab="overview">Visão Geral</button>
                        <button class="tab-btn" data-tab="sharing">Compartilhamento</button>
                        <button class="tab-btn" data-tab="workflow">Aprovações</button>
                        <button class="tab-btn" data-tab="schedule">Agendamento</button>
                        <button class="tab-btn" data-tab="analytics">Analytics</button>
                    </div>
                </div>
                
                <div class="tab-content">
                    <div id="overview-tab" class="tab-panel active">
                        ${this.renderOverviewTab()}
                    </div>
                    <div id="sharing-tab" class="tab-panel">
                        ${this.renderSharingTab()}
                    </div>
                    <div id="workflow-tab" class="tab-panel">
                        ${this.renderWorkflowTab()}
                    </div>
                    <div id="schedule-tab" class="tab-panel">
                        ${this.renderScheduleTab()}
                    </div>
                    <div id="analytics-tab" class="tab-panel">
                        ${this.renderAnalyticsTab()}
                    </div>
                </div>
            </div>
        `;

        this.setupTabNavigation();
        this.loadDashboardData();
    }

    renderOverviewTab() {
        return `
            <div class="overview-grid">
                <div class="stat-card">
                    <h3>Posts Totais</h3>
                    <div class="stat-number" id="total-posts">-</div>
                </div>
                <div class="stat-card">
                    <h3>Compartilhamentos</h3>
                    <div class="stat-number" id="total-shares">-</div>
                </div>
                <div class="stat-card">
                    <h3>Aprovações Pendentes</h3>
                    <div class="stat-number" id="pending-approvals">-</div>
                </div>
                <div class="stat-card">
                    <h3>Agendados</h3>
                    <div class="stat-number" id="scheduled-posts">-</div>
                </div>
            </div>
            
            <div class="recent-activities">
                <h3>Atividades Recentes</h3>
                <div id="recent-activities-list" class="activities-list">
                    <div class="loading">Carregando atividades...</div>
                </div>
            </div>
        `;
    }

    renderSharingTab() {
        return `
            <div class="sharing-section">
                <div class="section-header">
                    <h3>Compartilhamento de Conteúdo</h3>
                    <button class="btn btn-primary" onclick="contentStrategyUI.openBulkShareDialog()">
                        Compartilhar em Lote
                    </button>
                </div>
                
                <div class="sharing-filters">
                    <select id="sharing-site-filter">
                        <option value="">Todos os Sites</option>
                        <option value="arquidiocese">Arquidiocese</option>
                        <option value="rcc">RCC</option>
                        <option value="shalom">Shalom</option>
                    </select>
                    
                    <select id="sharing-status-filter">
                        <option value="">Todos os Status</option>
                        <option value="pending_approval">Aguardando Aprovação</option>
                        <option value="approved">Aprovado</option>
                        <option value="rejected">Rejeitado</option>
                    </select>
                </div>
                
                <div id="sharing-list" class="sharing-list">
                    <div class="loading">Carregando compartilhamentos...</div>
                </div>
            </div>
        `;
    }

    renderWorkflowTab() {
        return `
            <div class="workflow-section">
                <div class="section-header">
                    <h3>Fluxos de Aprovação</h3>
                    <div class="workflow-filters">
                        <select id="workflow-status-filter">
                            <option value="in_progress">Em Andamento</option>
                            <option value="approved">Aprovados</option>
                            <option value="rejected">Rejeitados</option>
                        </select>
                    </div>
                </div>
                
                <div id="workflow-list" class="workflow-list">
                    <div class="loading">Carregando fluxos de trabalho...</div>
                </div>
            </div>
        `;
    }

    renderScheduleTab() {
        return `
            <div class="schedule-section">
                <div class="section-header">
                    <h3>Agendamento de Conteúdo</h3>
                    <button class="btn btn-primary" onclick="contentStrategyUI.openBulkScheduleDialog()">
                        Agendar em Lote
                    </button>
                </div>
                
                <div class="schedule-calendar">
                    <div id="content-calendar" class="calendar-container">
                        <!-- Calendar will be rendered here -->
                    </div>
                </div>
                
                <div class="scheduled-list">
                    <h4>Próximos Agendamentos</h4>
                    <div id="upcoming-scheduled" class="scheduled-items">
                        <div class="loading">Carregando agendamentos...</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAnalyticsTab() {
        return `
            <div class="analytics-section">
                <div class="section-header">
                    <h3>Analytics de Conteúdo</h3>
                    <div class="analytics-filters">
                        <select id="analytics-period">
                            <option value="7">Últimos 7 dias</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                        </select>
                    </div>
                </div>
                
                <div class="analytics-grid">
                    <div class="chart-container">
                        <h4>Posts por Site</h4>
                        <canvas id="posts-by-site-chart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Posts por Categoria</h4>
                        <canvas id="posts-by-category-chart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Compartilhamentos</h4>
                        <canvas id="sharing-chart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Performance de Aprovações</h4>
                        <canvas id="approval-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Update active states
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
                
                // Load tab-specific data
                this.loadTabData(tabId);
            });
        });
    }

    async loadDashboardData() {
        try {
            // Load overview statistics
            const insights = await this.contentStrategy.getContentInsights();
            if (insights) {
                document.getElementById('total-posts').textContent = insights.totalPosts;
                document.getElementById('total-shares').textContent = insights.sharingMetrics.totalShares || 0;
            }

            // Load pending approvals
            const workflows = await this.contentStrategy.getScheduledContent({ status: 'in_progress' });
            document.getElementById('pending-approvals').textContent = workflows.length;

            // Load scheduled posts
            const scheduled = await this.contentStrategy.getScheduledContent({ status: 'scheduled' });
            document.getElementById('scheduled-posts').textContent = scheduled.length;

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadTabData(tabId) {
        switch (tabId) {
            case 'sharing':
                await this.loadSharingData();
                break;
            case 'workflow':
                await this.loadWorkflowData();
                break;
            case 'schedule':
                await this.loadScheduleData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
        }
    }

    async loadSharingData() {
        // Implementation for loading sharing data
        const sharingList = document.getElementById('sharing-list');
        sharingList.innerHTML = '<div class="loading">Carregando dados de compartilhamento...</div>';
        
        // This would load actual sharing data from Firestore
        setTimeout(() => {
            sharingList.innerHTML = `
                <div class="sharing-item">
                    <div class="sharing-info">
                        <h4>Post sobre Liturgia Dominical</h4>
                        <p>Compartilhado para: RCC, Shalom</p>
                        <span class="status pending">Aguardando Aprovação</span>
                    </div>
                    <div class="sharing-actions">
                        <button class="btn btn-sm btn-outline">Ver Detalhes</button>
                    </div>
                </div>
            `;
        }, 1000);
    }

    openShareDialog(postId) {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Compartilhar Conteúdo</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="shareContentForm">
                        <input type="hidden" name="postId" value="${postId}">
                        
                        <div class="form-group">
                            <label>Sites de Destino:</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" name="sites" value="rcc"> RCC</label>
                                <label><input type="checkbox" name="sites" value="shalom"> Shalom</label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Adaptações necessárias:</label>
                            <textarea name="adaptations" placeholder="Descreva as adaptações necessárias para cada site..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Workflow de aprovação:</label>
                            <select name="workflowType">
                                <option value="standard">Padrão</option>
                                <option value="urgent">Urgente</option>
                                <option value="multi_site">Multi-site</option>
                            </select>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Compartilhar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Setup modal events
        dialog.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    async handleContentShare(form) {
        const formData = new FormData(form);
        const postId = formData.get('postId');
        const sites = formData.getAll('sites');
        const adaptations = formData.get('adaptations');
        const workflowType = formData.get('workflowType');

        try {
            const result = await this.contentStrategy.shareContent(postId, sites, {
                userId: this.currentUser.id,
                adaptations: { notes: adaptations },
                workflowType: workflowType
            });

            if (result.success) {
                this.showNotification('Conteúdo compartilhado com sucesso!', 'success');
                this.loadSharingData(); // Refresh the sharing data
            } else {
                this.showNotification('Erro ao compartilhar conteúdo: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error sharing content:', error);
            this.showNotification('Erro inesperado ao compartilhar conteúdo', 'error');
        }

        // Close modal
        const modal = form.closest('.modal-overlay');
        document.body.removeChild(modal);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Additional methods for workflow, scheduling, etc.
    async loadWorkflowData() {
        // Implementation for loading workflow data
    }

    async loadScheduleData() {
        // Implementation for loading schedule data
    }

    async loadAnalyticsData() {
        // Implementation for loading analytics data
    }
}

// Initialize the Content Strategy UI
const contentStrategyUI = new ContentStrategyUI();
window.contentStrategyUI = contentStrategyUI;

export default ContentStrategyUI;
