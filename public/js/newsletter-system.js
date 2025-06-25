// Newsletter System - Release 5B
// Sistema avançado de newsletter e subscrições para a Arquidiocese

import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

class NewsletterSystem {
    constructor() {
        this.subscribers = new Map();
        this.campaigns = new Map();
        this.templates = new Map();
        this.settings = {
            requireConfirmation: true,
            allowUnsubscribe: true,
            maxFrequency: 'weekly',
            categories: [
                'noticias-gerais',
                'decretos',
                'eventos',
                'homilias',
                'comunicados',
                'oracao-dia'
            ],
            autoSubscribeOnComment: false,
            gdprCompliant: true
        };
        
        this.init();
    }

    async init() {
        console.log('📧 Newsletter System initializing...');
        
        this.loadSettings();
        this.setupSubscriptionUI();
        this.loadTemplates();
        this.setupEventListeners();
        
        console.log('✅ Newsletter System initialized');
    }

    // Subscription Management
    async subscribe(email, preferences = {}) {
        try {
            // Validate email
            if (!this.isValidEmail(email)) {
                throw new Error('E-mail inválido');
            }

            // Check if already subscribed
            const existing = await this.getSubscriber(email);
            if (existing) {
                throw new Error('E-mail já cadastrado');
            }

            // Prepare subscriber data
            const subscriberData = {
                email: email.toLowerCase(),
                name: preferences.name || '',
                status: this.settings.requireConfirmation ? 'pending' : 'confirmed',
                categories: preferences.categories || ['noticias-gerais'],
                frequency: preferences.frequency || 'weekly',
                source: preferences.source || 'website',
                createdAt: Timestamp.now(),
                confirmedAt: null,
                lastEmailSent: null,
                totalEmailsSent: 0,
                isActive: true,
                metadata: {
                    ipAddress: await this.getClientIP(),
                    userAgent: navigator.userAgent,
                    referrer: document.referrer
                }
            };

            // Add to database
            const docRef = await addDoc(collection(db, 'newsletter_subscribers'), subscriberData);
            
            // Send confirmation email if required
            if (this.settings.requireConfirmation) {
                await this.sendConfirmationEmail(email, docRef.id);
            }

            // Track analytics
            if (window.analyticsManager) {
                window.analyticsManager.trackEvent('newsletter_subscribe', {
                    email: email,
                    categories: subscriberData.categories,
                    source: subscriberData.source
                });
            }

            return {
                success: true,
                message: this.settings.requireConfirmation ? 
                    'Verifique seu e-mail para confirmar a inscrição!' : 
                    'Inscrição realizada com sucesso!',
                subscriberId: docRef.id
            };

        } catch (error) {
            console.error('Error subscribing:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async confirmSubscription(token) {
        try {
            // Find subscriber by token
            const subscriber = await this.getSubscriberByToken(token);
            if (!subscriber) {
                throw new Error('Token inválido ou expirado');
            }

            // Update status
            const subscriberRef = doc(db, 'newsletter_subscribers', subscriber.id);
            await updateDoc(subscriberRef, {
                status: 'confirmed',
                confirmedAt: Timestamp.now()
            });

            // Send welcome email
            await this.sendWelcomeEmail(subscriber.email);

            return {
                success: true,
                message: 'Inscrição confirmada com sucesso!'
            };

        } catch (error) {
            console.error('Error confirming subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async unsubscribe(email, token = null) {
        try {
            let subscriber;
            
            if (token) {
                subscriber = await this.getSubscriberByToken(token);
            } else {
                subscriber = await this.getSubscriber(email);
            }

            if (!subscriber) {
                throw new Error('Inscrição não encontrada');
            }

            // Mark as unsubscribed
            const subscriberRef = doc(db, 'newsletter_subscribers', subscriber.id);
            await updateDoc(subscriberRef, {
                status: 'unsubscribed',
                unsubscribedAt: Timestamp.now(),
                isActive: false
            });

            // Track analytics
            if (window.analyticsManager) {
                window.analyticsManager.trackEvent('newsletter_unsubscribe', {
                    email: email,
                    method: token ? 'link' : 'manual'
                });
            }

            return {
                success: true,
                message: 'Inscrição cancelada com sucesso!'
            };

        } catch (error) {
            console.error('Error unsubscribing:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updatePreferences(email, preferences) {
        try {
            const subscriber = await this.getSubscriber(email);
            if (!subscriber) {
                throw new Error('Inscrição não encontrada');
            }

            const subscriberRef = doc(db, 'newsletter_subscribers', subscriber.id);
            await updateDoc(subscriberRef, {
                categories: preferences.categories || subscriber.categories,
                frequency: preferences.frequency || subscriber.frequency,
                name: preferences.name || subscriber.name,
                updatedAt: Timestamp.now()
            });

            return {
                success: true,
                message: 'Preferências atualizadas!'
            };

        } catch (error) {
            console.error('Error updating preferences:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Email Templates
    loadTemplates() {
        this.templates.set('confirmation', {
            subject: 'Confirme sua inscrição - Arquidiocese de Belém',
            template: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a365d;">Confirme sua inscrição</h2>
                    <p>Olá!</p>
                    <p>Obrigado por se inscrever em nossa newsletter. Clique no botão abaixo para confirmar sua inscrição:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{confirmationLink}}" 
                           style="background: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                            Confirmar Inscrição
                        </a>
                    </div>
                    <p><small>Se você não se inscreveu, ignore este e-mail.</small></p>
                    <hr>
                    <p><small>Arquidiocese de Belém do Pará - Igreja Mãe da Amazônia</small></p>
                </div>
            `
        });

        this.templates.set('welcome', {
            subject: 'Bem-vindo à Newsletter da Arquidiocese!',
            template: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a365d;">Bem-vindo!</h2>
                    <p>Olá {{name}},</p>
                    <p>Sua inscrição foi confirmada com sucesso! Agora você receberá as novidades da Arquidiocese de Belém do Pará.</p>
                    <h3>Suas preferências:</h3>
                    <ul>
                        {{#each categories}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                    <p>Frequência: {{frequency}}</p>
                    <div style="margin: 30px 0;">
                        <a href="{{preferencesLink}}" style="color: #1a365d;">Alterar preferências</a> |
                        <a href="{{unsubscribeLink}}" style="color: #666;">Cancelar inscrição</a>
                    </div>
                    <hr>
                    <p><small>Arquidiocese de Belém do Pará - Igreja Mãe da Amazônia</small></p>
                </div>
            `
        });

        this.templates.set('newsletter', {
            subject: 'Newsletter - Arquidiocese de Belém',
            template: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <header style="background: #1a365d; color: white; padding: 20px; text-align: center;">
                        <h1>Arquidiocese de Belém do Pará</h1>
                        <p>Igreja Mãe da Amazônia</p>
                    </header>
                    
                    <div style="padding: 20px;">
                        <h2>{{title}}</h2>
                        <p style="color: #666; font-size: 14px;">{{date}}</p>
                        
                        {{#if featuredPost}}
                        <div style="border: 1px solid #ddd; margin: 20px 0; padding: 15px;">
                            <h3 style="margin-top: 0;">Destaque</h3>
                            <h4><a href="{{featuredPost.url}}" style="color: #1a365d;">{{featuredPost.title}}</a></h4>
                            <p>{{featuredPost.excerpt}}</p>
                        </div>
                        {{/if}}
                        
                        <h3>Últimas Notícias</h3>
                        {{#each posts}}
                        <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                            <h4 style="margin: 0;"><a href="{{url}}" style="color: #1a365d;">{{title}}</a></h4>
                            <p style="margin: 5px 0; color: #666; font-size: 14px;">{{category}} - {{date}}</p>
                            <p style="margin: 10px 0;">{{excerpt}}</p>
                        </div>
                        {{/each}}
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{websiteUrl}}" 
                               style="background: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                                Ver mais no site
                            </a>
                        </div>
                    </div>
                    
                    <footer style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p>Você está recebendo este e-mail porque se inscreveu em nossa newsletter.</p>
                        <p>
                            <a href="{{preferencesLink}}" style="color: #1a365d;">Alterar preferências</a> |
                            <a href="{{unsubscribeLink}}" style="color: #666;">Cancelar inscrição</a>
                        </p>
                        <p>Arquidiocese de Belém do Pará<br>
                           Avenida Nazaré, 1256 - Belém, PA</p>
                    </footer>
                </div>
            `
        });
    }

    // Campaign Management
    async createCampaign(campaignData) {
        try {
            const campaign = {
                title: campaignData.title,
                subject: campaignData.subject,
                content: campaignData.content,
                template: campaignData.template || 'newsletter',
                targetCategories: campaignData.categories || ['noticias-gerais'],
                scheduledFor: campaignData.scheduledFor || null,
                status: 'draft',
                createdAt: Timestamp.now(),
                createdBy: this.getCurrentUser()?.uid,
                stats: {
                    sent: 0,
                    delivered: 0,
                    opened: 0,
                    clicked: 0,
                    unsubscribed: 0
                }
            };

            const docRef = await addDoc(collection(db, 'newsletter_campaigns'), campaign);
            
            return {
                success: true,
                campaignId: docRef.id
            };

        } catch (error) {
            console.error('Error creating campaign:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendCampaign(campaignId) {
        try {
            const campaign = await this.getCampaign(campaignId);
            if (!campaign) {
                throw new Error('Campanha não encontrada');
            }

            // Get target subscribers
            const subscribers = await this.getActiveSubscribers(campaign.targetCategories);
            
            if (subscribers.length === 0) {
                throw new Error('Nenhum assinante encontrado para as categorias selecionadas');
            }

            // Send emails (in production, this would use a service like SendGrid, Mailgun, etc.)
            const emailPromises = subscribers.map(subscriber => 
                this.sendEmailToSubscriber(subscriber, campaign)
            );

            const results = await Promise.allSettled(emailPromises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            // Update campaign stats
            const campaignRef = doc(db, 'newsletter_campaigns', campaignId);
            await updateDoc(campaignRef, {
                status: 'sent',
                sentAt: Timestamp.now(),
                'stats.sent': successful,
                'stats.failed': failed
            });

            // Track analytics
            if (window.analyticsManager) {
                window.analyticsManager.trackEvent('newsletter_campaign_sent', {
                    campaign_id: campaignId,
                    subscribers_count: successful,
                    categories: campaign.targetCategories
                });
            }

            return {
                success: true,
                message: `Newsletter enviada para ${successful} assinantes`,
                stats: { sent: successful, failed: failed }
            };

        } catch (error) {
            console.error('Error sending campaign:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Email sending (mock implementation - in production use email service)
    async sendEmailToSubscriber(subscriber, campaign) {
        try {
            // In production, integrate with email service (SendGrid, Mailgun, etc.)
            console.log(`📧 Sending email to ${subscriber.email}:`, campaign.title);
            
            // Simulate email sending delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Update subscriber stats
            const subscriberRef = doc(db, 'newsletter_subscribers', subscriber.id);
            await updateDoc(subscriberRef, {
                lastEmailSent: Timestamp.now(),
                totalEmailsSent: (subscriber.totalEmailsSent || 0) + 1
            });

            return { success: true };
            
        } catch (error) {
            console.error(`Error sending email to ${subscriber.email}:`, error);
            throw error;
        }
    }

    async sendConfirmationEmail(email, subscriberId) {
        const token = this.generateConfirmationToken(subscriberId);
        const confirmationLink = `${window.location.origin}/newsletter/confirm?token=${token}`;
        
        const template = this.templates.get('confirmation');
        const content = template.template.replace('{{confirmationLink}}', confirmationLink);
        
        // In production, send actual email
        console.log('📧 Confirmation email would be sent to:', email);
        console.log('Confirmation link:', confirmationLink);
        
        return { success: true };
    }

    async sendWelcomeEmail(email) {
        const subscriber = await this.getSubscriber(email);
        const template = this.templates.get('welcome');
        
        // In production, send actual email
        console.log('📧 Welcome email would be sent to:', email);
        
        return { success: true };
    }

    // UI Components
    setupSubscriptionUI() {
        // Create subscription forms wherever needed
        this.createSubscriptionForms();
        this.createPreferencesUI();
    }

    createSubscriptionForms() {
        const forms = document.querySelectorAll('.newsletter-subscription-form');
        forms.forEach(form => {
            if (!form.dataset.initialized) {
                this.enhanceSubscriptionForm(form);
                form.dataset.initialized = 'true';
            }
        });
    }

    enhanceSubscriptionForm(form) {
        // Add category selection if not present
        if (!form.querySelector('.category-selection')) {
            const categorySection = document.createElement('div');
            categorySection.className = 'category-selection';
            categorySection.innerHTML = `
                <h4>Quais assuntos te interessam?</h4>
                ${this.settings.categories.map(category => `
                    <label class="category-checkbox">
                        <input type="checkbox" name="categories" value="${category}" checked>
                        <span>${this.getCategoryLabel(category)}</span>
                    </label>
                `).join('')}
            `;
            
            const emailInput = form.querySelector('input[type="email"]');
            emailInput.parentNode.insertBefore(categorySection, emailInput.nextSibling);
        }

        // Add form handler
        form.addEventListener('submit', (e) => this.handleSubscriptionSubmit(e));
    }

    async handleSubscriptionSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        const name = formData.get('name') || '';
        const categories = formData.getAll('categories');
        const frequency = formData.get('frequency') || 'weekly';

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Inscrevendo...';
        submitBtn.disabled = true;

        try {
            const result = await this.subscribe(email, {
                name: name,
                categories: categories,
                frequency: frequency,
                source: 'subscription_form'
            });

            if (result.success) {
                this.showNotification(result.message, 'success');
                form.reset();
            } else {
                this.showNotification(result.error, 'error');
            }

        } catch (error) {
            this.showNotification('Erro ao processar inscrição', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    createPreferencesUI() {
        // Create preferences page if in admin
        if (window.location.pathname.includes('admin')) {
            this.createAdminNewsletterUI();
        }
    }

    createAdminNewsletterUI() {
        const adminContent = document.querySelector('.admin-content');
        if (!adminContent) return;

        const newsletterSection = document.createElement('div');
        newsletterSection.className = 'admin-section';
        newsletterSection.id = 'newsletter-section';
        newsletterSection.style.display = 'none';
        
        newsletterSection.innerHTML = `
            <div class="newsletter-admin">
                <h2>📧 Newsletter</h2>
                
                <div class="newsletter-stats">
                    <div class="stat-card">
                        <h3 id="total-subscribers">-</h3>
                        <p>Total de Assinantes</p>
                    </div>
                    <div class="stat-card">
                        <h3 id="pending-confirmations">-</h3>
                        <p>Aguardando Confirmação</p>
                    </div>
                    <div class="stat-card">
                        <h3 id="campaigns-sent">-</h3>
                        <p>Campanhas Enviadas</p>
                    </div>
                </div>
                
                <div class="newsletter-actions">
                    <button class="btn btn-primary" onclick="newsletterSystem.createCampaignModal()">
                        Nova Campanha
                    </button>
                    <button class="btn btn-secondary" onclick="newsletterSystem.viewSubscribers()">
                        Ver Assinantes
                    </button>
                    <button class="btn btn-secondary" onclick="newsletterSystem.exportSubscribers()">
                        Exportar Lista
                    </button>
                </div>
                
                <div id="newsletter-content">
                    <!-- Dynamic content will be loaded here -->
                </div>
            </div>
        `;
        
        adminContent.appendChild(newsletterSection);
        
        // Load initial data
        this.loadNewsletterStats();
    }

    // Helper functions
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getCategoryLabel(category) {
        const labels = {
            'noticias-gerais': 'Notícias Gerais',
            'decretos': 'Decretos',
            'eventos': 'Eventos',
            'homilias': 'Homilias',
            'comunicados': 'Comunicados',
            'oracao-dia': 'Oração do Dia'
        };
        return labels[category] || category;
    }

    generateConfirmationToken(subscriberId) {
        return btoa(subscriberId + ':' + Date.now()).replace(/[^a-zA-Z0-9]/g, '');
    }

    getCurrentUser() {
        return window.currentUser || null;
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // Database helpers
    async getSubscriber(email) {
        const q = query(
            collection(db, 'newsletter_subscribers'),
            where('email', '==', email.toLowerCase())
        );
        
        const snapshot = await getDocs(q);
        return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    async getActiveSubscribers(categories = []) {
        let q = query(
            collection(db, 'newsletter_subscribers'),
            where('status', '==', 'confirmed'),
            where('isActive', '==', true)
        );

        if (categories.length > 0) {
            q = query(q, where('categories', 'array-contains-any', categories));
        }

        const snapshot = await getDocs(q);
        const subscribers = [];
        snapshot.forEach((doc) => {
            subscribers.push({ id: doc.id, ...doc.data() });
        });

        return subscribers;
    }

    // Settings
    loadSettings() {
        const stored = localStorage.getItem('newsletterSettings');
        if (stored) {
            this.settings = { ...this.settings, ...JSON.parse(stored) };
        }
    }

    setupEventListeners() {
        // Auto-setup forms when page loads
        document.addEventListener('DOMContentLoaded', () => {
            this.createSubscriptionForms();
        });

        // Handle URL parameters for confirmation/unsubscribe
        this.handleURLParameters();
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const token = urlParams.get('token');
        const email = urlParams.get('email');

        if (action === 'confirm' && token) {
            this.confirmSubscription(token);
        } else if (action === 'unsubscribe' && (token || email)) {
            this.unsubscribe(email, token);
        }
    }

    // Notification
    showNotification(message, type = 'info') {
        if (window.notificationSystem) {
            window.notificationSystem.createNotification({
                type: type,
                title: 'Newsletter',
                message: message,
                icon: '📧'
            });
        } else {
            alert(message);
        }
    }

    // Public API
    async getStats() {
        const totalSubs = await this.getActiveSubscribers();
        return {
            totalSubscribers: totalSubs.length,
            // Add more stats as needed
        };
    }

    // Quick subscription (for comment integration)
    async quickSubscribe(email, source = 'quick_form') {
        return await this.subscribe(email, {
            categories: ['noticias-gerais'],
            frequency: 'weekly',
            source: source
        });
    }
}

// Initialize newsletter system
const newsletterSystem = new NewsletterSystem();
window.newsletterSystem = newsletterSystem;

export default NewsletterSystem;
