// WhatsApp Integration - Release 5B
// Sistema avançado de integração com WhatsApp Business para a Arquidiocese

class WhatsAppIntegration {
    constructor() {
        this.businessNumber = '5591999999999'; // Substituir pelo número real
        this.isBusinessApiEnabled = false;
        this.messageTemplates = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        console.log('📱 WhatsApp Integration initializing...');
        
        this.setupMessageTemplates();
        this.initializeWidget();
        this.enhanceMobileExperience(); // Mobile UX enhancements
        this.setupEventListeners();
        this.checkBusinessApiStatus();
        
        this.isInitialized = true;
        console.log('✅ WhatsApp Integration initialized');
    }

    setupMessageTemplates() {
        this.messageTemplates.set('general', {
            message: 'Olá! Gostaria de mais informações sobre a Arquidiocese de Belém do Pará.',
            category: 'Informações Gerais'
        });

        this.messageTemplates.set('post_share', {
            message: 'Olá! Gostaria de compartilhar este conteúdo da Arquidiocese: {{title}} - {{url}}',
            category: 'Compartilhar Conteúdo'
        });

        this.messageTemplates.set('prayer_request', {
            message: 'Olá! Gostaria de fazer um pedido de oração.',
            category: 'Pedido de Oração'
        });

        this.messageTemplates.set('mass_schedule', {
            message: 'Olá! Gostaria de saber sobre os horários das missas.',
            category: 'Horário de Missas'
        });

        this.messageTemplates.set('event_info', {
            message: 'Olá! Gostaria de mais informações sobre o evento: {{event}}',
            category: 'Informações de Evento'
        });

        this.messageTemplates.set('volunteer', {
            message: 'Olá! Tenho interesse em participar como voluntário em atividades da Arquidiocese.',
            category: 'Voluntariado'
        });

        this.messageTemplates.set('donation', {
            message: 'Olá! Gostaria de informações sobre como fazer doações para a Arquidiocese.',
            category: 'Doações'
        });
    }

    initializeWidget() {
        this.createFloatingWidget();
        this.createWhatsAppModal();
        this.addWhatsAppButtonsToPage();
    }

    createFloatingWidget() {
        // Remove existing widget if present
        const existingWidget = document.getElementById('whatsapp-widget');
        if (existingWidget) {
            existingWidget.remove();
        }

        const widget = document.createElement('div');
        widget.id = 'whatsapp-widget';
        widget.className = 'whatsapp-widget';
        widget.innerHTML = `
            <button class="whatsapp-floating-btn" onclick="whatsappIntegration.openWhatsAppModal()">
                <svg class="whatsapp-icon" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
                </svg>
                <span class="whatsapp-text">Fale Conosco</span>
                <div class="whatsapp-pulse"></div>
            </button>
        `;

        document.body.appendChild(widget);
    }

    createWhatsAppModal() {
        const modal = document.createElement('div');
        modal.id = 'whatsapp-modal';
        modal.className = 'whatsapp-modal';
        modal.innerHTML = `
            <div class="whatsapp-modal-overlay" onclick="whatsappIntegration.closeWhatsAppModal()"></div>
            <div class="whatsapp-modal-content">
                <div class="whatsapp-modal-header">
                    <img src="images/logo-arquidiocese-belem.png" alt="Arquidiocese" class="whatsapp-avatar">
                    <div class="whatsapp-header-info">
                        <h3>Arquidiocese de Belém</h3>
                        <p class="whatsapp-status">
                            <span class="online-indicator"></span>
                            Online - Responde rapidamente
                        </p>
                    </div>
                    <button class="whatsapp-close" onclick="whatsappIntegration.closeWhatsAppModal()">×</button>
                </div>
                
                <div class="whatsapp-modal-body">
                    <div class="whatsapp-welcome">
                        <div class="whatsapp-message">
                            <p>👋 Olá! Como podemos ajudar você hoje?</p>
                            <span class="whatsapp-time">${this.getCurrentTime()}</span>
                        </div>
                    </div>
                    
                    <div class="whatsapp-options">
                        <h4>Escolha um assunto:</h4>
                        <div class="whatsapp-option-buttons">
                            ${Array.from(this.messageTemplates.entries()).map(([key, template]) => `
                                <button class="whatsapp-option-btn" data-template="${key}">
                                    ${this.getTemplateIcon(key)} ${template.category}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="whatsapp-custom-message">
                        <h4>Ou envie uma mensagem personalizada:</h4>
                        <textarea 
                            id="whatsapp-custom-text" 
                            placeholder="Digite sua mensagem..."
                            maxlength="1000"
                        ></textarea>
                        <div class="whatsapp-char-counter">
                            <span id="char-count">0</span>/1000
                        </div>
                    </div>
                </div>
                
                <div class="whatsapp-modal-footer">
                    <button class="whatsapp-send-btn" onclick="whatsappIntegration.sendMessage()">
                        Enviar WhatsApp
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // Character counter
        const textarea = document.getElementById('whatsapp-custom-text');
        const charCount = document.getElementById('char-count');
        
        if (textarea && charCount) {
            textarea.addEventListener('input', () => {
                charCount.textContent = textarea.value.length;
            });
        }

        // Option button handlers
        document.querySelectorAll('.whatsapp-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                document.querySelectorAll('.whatsapp-option-btn').forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Set template message in textarea
                const templateKey = btn.dataset.template;
                const template = this.messageTemplates.get(templateKey);
                if (textarea) {
                    textarea.value = template.message.replace(/\{\{[^}]+\}\}/g, '');
                    textarea.dispatchEvent(new Event('input'));
                }
            });
        });
    }

    addWhatsAppButtonsToPage() {
        // Add WhatsApp share buttons to posts
        document.querySelectorAll('.post-item, .noticia-item').forEach(post => {
            if (!post.querySelector('.whatsapp-share-btn')) {
                const shareBtn = document.createElement('button');
                shareBtn.className = 'whatsapp-share-btn';
                shareBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
                    </svg>
                    WhatsApp
                `;
                
                const postTitle = post.querySelector('h3, .post-title, .noticia-titulo')?.textContent || 'Conteúdo da Arquidiocese';
                const postUrl = window.location.href;
                
                shareBtn.addEventListener('click', () => {
                    this.sharePost(postTitle, postUrl);
                });
                
                // Insert into post actions or create actions container
                let actionsContainer = post.querySelector('.post-actions, .noticia-acoes');
                if (!actionsContainer) {
                    actionsContainer = document.createElement('div');
                    actionsContainer.className = 'post-actions';
                    post.appendChild(actionsContainer);
                }
                
                actionsContainer.appendChild(shareBtn);
            }
        });
    }

    setupEventListeners() {
        // Track WhatsApp interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.whatsapp-floating-btn, .whatsapp-share-btn')) {
                if (window.analyticsManager) {
                    window.analyticsManager.trackEvent('whatsapp_interaction', {
                        interaction_type: e.target.closest('.whatsapp-floating-btn') ? 'widget_open' : 'post_share',
                        page: window.location.pathname
                    });
                }
            }
        });
    }

    checkBusinessApiStatus() {
        // In production, this would check if WhatsApp Business API is available
        // For now, we'll simulate the check
        this.isBusinessApiEnabled = false; // Set to true when Business API is configured
        
        if (this.isBusinessApiEnabled) {
            console.log('✅ WhatsApp Business API available');
        } else {
            console.log('💬 Using WhatsApp Web integration');
        }
    }

    openWhatsAppModal() {
        const modal = document.getElementById('whatsapp-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
            
            // Track modal open
            if (window.analyticsManager) {
                window.analyticsManager.trackEvent('whatsapp_modal_opened');
            }
        }
    }

    closeWhatsAppModal() {
        const modal = document.getElementById('whatsapp-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }

    sendMessage() {
        const textarea = document.getElementById('whatsapp-custom-text');
        const selectedOption = document.querySelector('.whatsapp-option-btn.active');
        
        let message = '';
        
        if (selectedOption) {
            const templateKey = selectedOption.dataset.template;
            const template = this.messageTemplates.get(templateKey);
            message = template.message;
        } else if (textarea && textarea.value.trim()) {
            message = textarea.value.trim();
        } else {
            message = this.messageTemplates.get('general').message;
        }

        this.sendWhatsAppMessage(message);
        this.closeWhatsAppModal();
    }

    sendWhatsAppMessage(message, phoneNumber = null) {
        const number = phoneNumber || this.businessNumber;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
        
        // Track message send
        if (window.analyticsManager) {
            window.analyticsManager.trackEvent('whatsapp_message_sent', {
                message_length: message.length,
                has_custom_message: !Array.from(this.messageTemplates.values()).some(t => t.message === message)
            });
        }
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
    }

    sharePost(title, url) {
        const template = this.messageTemplates.get('post_share');
        const message = template.message
            .replace('{{title}}', title)
            .replace('{{url}}', url);
        
        this.sendWhatsAppMessage(message);
    }

    shareCustomContent(content) {
        this.sendWhatsAppMessage(content);
    }

    getTemplateIcon(templateKey) {
        const icons = {
            'general': 'ℹ️',
            'post_share': '📰',
            'prayer_request': '🙏',
            'mass_schedule': '⛪',
            'event_info': '📅',
            'volunteer': '🤝',
            'donation': '💝'
        };
        
        return icons[templateKey] || '💬';
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // Public API
    openContactModal(template = 'general') {
        this.openWhatsAppModal();
        
        // Auto-select template if specified
        setTimeout(() => {
            const button = document.querySelector(`[data-template="${template}"]`);
            if (button) {
                button.click();
            }
        }, 100);
    }

    // Admin Methods
    setupAdminInterface() {
        if (!this.isAdminUser()) return;
        
        const adminContent = document.querySelector('.admin-content');
        if (!adminContent) return;

        const whatsappSection = document.createElement('div');
        whatsappSection.className = 'admin-section';
        whatsappSection.id = 'whatsapp-section';
        whatsappSection.style.display = 'none';
        
        whatsappSection.innerHTML = `
            <div class="whatsapp-admin">
                <h2>📱 WhatsApp Business</h2>
                
                <div class="whatsapp-stats">
                    <div class="stat-card">
                        <h3 id="whatsapp-clicks">-</h3>
                        <p>Cliques no Widget</p>
                    </div>
                    <div class="stat-card">
                        <h3 id="whatsapp-messages">-</h3>
                        <p>Mensagens Enviadas</p>
                    </div>
                    <div class="stat-card">
                        <h3 id="whatsapp-shares">-</h3>
                        <p>Posts Compartilhados</p>
                    </div>
                </div>
                
                <div class="whatsapp-config">
                    <h3>Configurações</h3>
                    <div class="config-row">
                        <label>Número do WhatsApp Business:</label>
                        <input type="tel" id="whatsapp-number" value="${this.businessNumber}" maxlength="20">
                        <button onclick="whatsappIntegration.updateBusinessNumber()">Salvar</button>
                    </div>
                    
                    <div class="config-row">
                        <label>Status do Widget:</label>
                        <select id="widget-status">
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        adminContent.appendChild(whatsappSection);
    }

    updateBusinessNumber() {
        const input = document.getElementById('whatsapp-number');
        if (input && input.value) {
            this.businessNumber = input.value;
            localStorage.setItem('whatsapp_business_number', this.businessNumber);
            
            if (window.notificationSystem) {
                window.notificationSystem.createNotification({
                    type: 'success',
                    title: 'WhatsApp',
                    message: 'Número atualizado com sucesso!',
                    icon: '📱'
                });
            }
        }
    }

    isAdminUser() {
        return window.currentUser && ['admin', 'moderator'].includes(window.currentUser.role);
    }

    enhanceMobileExperience() {
        // Mobile-specific WhatsApp optimizations
        if (window.innerWidth <= 768) {
            const widget = document.getElementById('whatsapp-widget');
            if (widget) {
                widget.classList.add('mobile-optimized');
                
                // Adjust position for mobile safe areas
                const btn = widget.querySelector('.whatsapp-floating-btn');
                if (btn) {
                    btn.style.width = '60px';
                    btn.style.height = '60px';
                    btn.style.bottom = 'calc(20px + env(safe-area-inset-bottom, 0px))';
                    btn.style.right = 'calc(20px + env(safe-area-inset-right, 0px))';
                    
                    // Hide text on very small screens
                    const text = btn.querySelector('.whatsapp-text');
                    if (text && window.innerWidth <= 414) {
                        text.style.display = 'none';
                    }
                    
                    // Add touch feedback
                    btn.addEventListener('touchstart', () => {
                        btn.style.transform = 'scale(0.95)';
                    }, { passive: true });
                    
                    btn.addEventListener('touchend', () => {
                        btn.style.transform = 'scale(1)';
                    }, { passive: true });
                }
            }
            
            // Optimize modal for mobile
            const modal = document.getElementById('whatsapp-modal');
            if (modal) {
                const content = modal.querySelector('.whatsapp-modal-content');
                if (content) {
                    content.style.position = 'fixed';
                    content.style.bottom = '0';
                    content.style.left = '0';
                    content.style.right = '0';
                    content.style.top = 'auto';
                    content.style.maxHeight = '85vh';
                    content.style.borderRadius = '1rem 1rem 0 0';
                    content.style.transform = 'translateY(0)';
                }
            }
        }
    }
}

// Initialize WhatsApp Integration
const whatsappIntegration = new WhatsAppIntegration();
window.whatsappIntegration = whatsappIntegration;

export default WhatsAppIntegration;
