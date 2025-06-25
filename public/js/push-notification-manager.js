// Push Notification Manager - Release 5B
// Sistema avançado de push notifications para a Arquidiocese

import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, Timestamp, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

class PushNotificationManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.isSubscribed = false;
        this.subscription = null;
        this.vapidPublicKey = 'BMqz8gF-7KqcVCXpPpX8NKz8oEOHFwGfh1Q5T6nL5u_k8pS8r4MvXq8dVCQx7z1xKvyY8qHn1mQ7'; // Replace with your VAPID key
        this.settings = {
            enabledTypes: ['new_posts', 'urgent_announcements', 'events', 'prayers'],
            frequency: 'immediate', // immediate, daily, weekly
            enableSound: true,
            enableBadge: true,
            quietHours: {
                enabled: true,
                start: '22:00',
                end: '07:00'
            }
        };
        this.subscriptions = new Map();
        
        this.init();
    }

    async init() {
        console.log('🔔 Push Notification Manager initializing...');
        
        if (!this.isSupported) {
            console.warn('⚠️ Push notifications not supported in this browser');
            return;
        }

        await this.loadSettings();
        await this.checkSubscriptionStatus();
        this.setupNotificationTypes();
        this.setupAdminInterface();
        
        console.log('✅ Push Notification Manager initialized');
    }

    // Permission and Subscription Management
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Push notifications not supported');
        }

        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('✅ Notification permission granted');
            await this.subscribeUser();
            return true;
        } else {
            console.log('❌ Notification permission denied');
            return false;
        }
    }

    async subscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                this.subscription = existingSubscription;
                this.isSubscribed = true;
                await this.saveSubscriptionToServer(existingSubscription);
                return;
            }

            // Create new subscription
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            this.subscription = subscription;
            this.isSubscribed = true;
            
            // Save to server
            await this.saveSubscriptionToServer(subscription);
            
            // Track subscription
            if (window.analyticsManager) {
                window.analyticsManager.trackEvent('push_notification_subscribed');
            }

            console.log('✅ User subscribed to push notifications');

        } catch (error) {
            console.error('❌ Failed to subscribe user:', error);
            throw error;
        }
    }

    async unsubscribeUser() {
        if (!this.subscription) return;

        try {
            await this.subscription.unsubscribe();
            await this.removeSubscriptionFromServer(this.subscription);
            
            this.subscription = null;
            this.isSubscribed = false;
            
            console.log('✅ User unsubscribed from push notifications');

        } catch (error) {
            console.error('❌ Failed to unsubscribe user:', error);
        }
    }

    async checkSubscriptionStatus() {
        if (!this.isSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                this.subscription = subscription;
                this.isSubscribed = true;
            }
        } catch (error) {
            console.error('❌ Error checking subscription status:', error);
        }
    }

    // Server Communication
    async saveSubscriptionToServer(subscription) {
        const subscriptionData = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
                auth: this.arrayBufferToBase64(subscription.getKey('auth'))
            },
            userId: this.getCurrentUserId(),
            userAgent: navigator.userAgent,
            settings: this.settings,
            createdAt: Timestamp.now(),
            isActive: true,
            lastUsed: Timestamp.now(),
            deviceInfo: {
                platform: navigator.platform,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        try {
            const docRef = await addDoc(collection(db, 'push_subscriptions'), subscriptionData);
            console.log('✅ Subscription saved to server:', docRef.id);
            
            // Store locally for quick access
            localStorage.setItem('push_subscription_id', docRef.id);
            
        } catch (error) {
            console.error('❌ Error saving subscription:', error);
        }
    }

    async removeSubscriptionFromServer(subscription) {
        try {
            const subscriptionId = localStorage.getItem('push_subscription_id');
            if (subscriptionId) {
                await deleteDoc(doc(db, 'push_subscriptions', subscriptionId));
                localStorage.removeItem('push_subscription_id');
                console.log('✅ Subscription removed from server');
            }
        } catch (error) {
            console.error('❌ Error removing subscription:', error);
        }
    }

    // Notification Types and Templates
    setupNotificationTypes() {
        this.notificationTypes = {
            'new_posts': {
                title: 'Nova Publicação',
                icon: '📝',
                badge: '/images/badge-post.png',
                priority: 'normal',
                template: 'Nova publicação da Arquidiocese: {{title}}'
            },
            'urgent_announcements': {
                title: 'Comunicado Urgente',
                icon: '🚨',
                badge: '/images/badge-urgent.png',
                priority: 'high',
                template: 'Comunicado urgente: {{message}}'
            },
            'events': {
                title: 'Novo Evento',
                icon: '📅',
                badge: '/images/badge-event.png',
                priority: 'normal',
                template: 'Novo evento: {{title}} - {{date}}'
            },
            'prayers': {
                title: 'Momento de Oração',
                icon: '🙏',
                badge: '/images/badge-prayer.png',
                priority: 'low',
                template: 'Momento de oração: {{text}}'
            },
            'mass_schedule': {
                title: 'Horário de Missa',
                icon: '⛪',
                badge: '/images/badge-mass.png',
                priority: 'normal',
                template: 'Lembrete: Missa às {{time}} - {{location}}'
            },
            'donations': {
                title: 'Campanha de Doação',
                icon: '💝',
                badge: '/images/badge-donation.png',
                priority: 'normal',
                template: 'Nova campanha de doação: {{campaign}}'
            }
        };
    }

    // Send Notifications
    async sendNotification(type, data, targetUsers = 'all') {
        const notificationType = this.notificationTypes[type];
        if (!notificationType) {
            throw new Error(`Unknown notification type: ${type}`);
        }

        const notification = {
            type: type,
            title: notificationType.title,
            body: this.populateTemplate(notificationType.template, data),
            icon: '/images/logo-arquidiocese-belem.png',
            badge: notificationType.badge,
            tag: type,
            requireInteraction: notificationType.priority === 'high',
            actions: this.getNotificationActions(type, data),
            data: {
                ...data,
                type: type,
                timestamp: Date.now(),
                url: data.url || '/'
            },
            timestamp: Date.now()
        };

        // Check quiet hours
        if (this.isQuietHours() && notificationType.priority !== 'high') {
            console.log('📵 Notification delayed due to quiet hours');
            await this.scheduleNotification(notification);
            return;
        }

        // Get target subscriptions
        const subscriptions = await this.getTargetSubscriptions(targetUsers, type);
        
        if (subscriptions.length === 0) {
            console.log('⚠️ No subscriptions found for notification');
            return;
        }

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(sub => this.sendToSubscription(sub, notification))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        // Log results
        await this.logNotificationSent({
            type: type,
            targetUsers: targetUsers,
            totalSent: subscriptions.length,
            successful: successful,
            failed: failed,
            data: data
        });

        console.log(`📤 Notification sent: ${successful} successful, ${failed} failed`);

        // Track analytics
        if (window.analyticsManager) {
            window.analyticsManager.trackEvent('push_notification_sent', {
                notification_type: type,
                recipients: subscriptions.length,
                successful: successful,
                failed: failed
            });
        }

        return { sent: successful, failed: failed };
    }

    async sendToSubscription(subscription, notification) {
        try {
            // In production, this would send via your push service
            // For demo, we'll simulate the send
            console.log('📤 Sending notification to subscription:', {
                endpoint: subscription.endpoint.substring(0, 50) + '...',
                notification: notification
            });

            // Simulate success/failure
            if (Math.random() > 0.95) { // 5% failure rate
                throw new Error('Simulated send failure');
            }

            return { success: true };

        } catch (error) {
            console.error('❌ Failed to send to subscription:', error);
            throw error;
        }
    }

    async getTargetSubscriptions(targetUsers, notificationType) {
        try {
            let subscriptionsQuery;

            if (targetUsers === 'all') {
                subscriptionsQuery = query(
                    collection(db, 'push_subscriptions'),
                    where('isActive', '==', true)
                );
            } else if (Array.isArray(targetUsers)) {
                subscriptionsQuery = query(
                    collection(db, 'push_subscriptions'),
                    where('userId', 'in', targetUsers),
                    where('isActive', '==', true)
                );
            } else {
                subscriptionsQuery = query(
                    collection(db, 'push_subscriptions'),
                    where('userId', '==', targetUsers),
                    where('isActive', '==', true)
                );
            }

            const snapshot = await getDocs(subscriptionsQuery);
            const subscriptions = [];

            snapshot.forEach(doc => {
                const subscription = doc.data();
                
                // Check if user has enabled this notification type
                if (subscription.settings && 
                    subscription.settings.enabledTypes && 
                    !subscription.settings.enabledTypes.includes(notificationType)) {
                    return;
                }

                subscriptions.push({
                    id: doc.id,
                    ...subscription
                });
            });

            return subscriptions;

        } catch (error) {
            console.error('❌ Error getting target subscriptions:', error);
            return [];
        }
    }

    // Notification Templates and Actions
    populateTemplate(template, data) {
        let result = template;
        
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), data[key] || '');
        });

        return result;
    }

    getNotificationActions(type, data) {
        const commonActions = [
            { action: 'view', title: 'Ver', icon: '/images/action-view.png' }
        ];

        switch (type) {
            case 'new_posts':
                return [
                    { action: 'view', title: 'Ler Post', icon: '/images/action-read.png' },
                    { action: 'share', title: 'Compartilhar', icon: '/images/action-share.png' }
                ];
            
            case 'events':
                return [
                    { action: 'view', title: 'Ver Evento', icon: '/images/action-calendar.png' },
                    { action: 'remind', title: 'Lembrar', icon: '/images/action-reminder.png' }
                ];
            
            case 'prayers':
                return [
                    { action: 'pray', title: 'Orar Agora', icon: '/images/action-pray.png' },
                    { action: 'share', title: 'Compartilhar', icon: '/images/action-share.png' }
                ];
            
            default:
                return commonActions;
        }
    }

    // Settings and Preferences
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Save locally
        localStorage.setItem('push_notification_settings', JSON.stringify(this.settings));
        
        // Update server subscription
        const subscriptionId = localStorage.getItem('push_subscription_id');
        if (subscriptionId) {
            try {
                const subscriptionRef = doc(db, 'push_subscriptions', subscriptionId);
                await updateDoc(subscriptionRef, {
                    settings: this.settings,
                    updatedAt: Timestamp.now()
                });
            } catch (error) {
                console.error('❌ Error updating settings on server:', error);
            }
        }
    }

    async loadSettings() {
        const stored = localStorage.getItem('push_notification_settings');
        if (stored) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            } catch (error) {
                console.error('❌ Error loading settings:', error);
            }
        }
    }

    // Scheduling and Quiet Hours
    isQuietHours() {
        if (!this.settings.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        
        const start = this.timeStringToNumber(this.settings.quietHours.start);
        const end = this.timeStringToNumber(this.settings.quietHours.end);

        // Handle overnight quiet hours (e.g., 22:00 to 07:00)
        if (start > end) {
            return currentTime >= start || currentTime <= end;
        } else {
            return currentTime >= start && currentTime <= end;
        }
    }

    timeStringToNumber(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 100 + minutes;
    }

    async scheduleNotification(notification) {
        // In production, you would store this in a queue for later processing
        console.log('⏰ Notification scheduled for later:', notification);
        
        // For demo, we'll just log it
        const scheduled = {
            ...notification,
            scheduledFor: this.getNextAllowedTime(),
            created: new Date().toISOString()
        };

        // Store in localStorage for demo
        const scheduledNotifications = JSON.parse(localStorage.getItem('scheduled_notifications') || '[]');
        scheduledNotifications.push(scheduled);
        localStorage.setItem('scheduled_notifications', JSON.stringify(scheduledNotifications));
    }

    getNextAllowedTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(7, 0, 0, 0); // Next day at 7 AM
        return tomorrow.toISOString();
    }

    // Logging and Analytics
    async logNotificationSent(logData) {
        try {
            await addDoc(collection(db, 'notification_logs'), {
                ...logData,
                timestamp: Timestamp.now(),
                sender: this.getCurrentUserId() || 'system'
            });
        } catch (error) {
            console.error('❌ Error logging notification:', error);
        }
    }

    // Utility Methods
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    getCurrentUserId() {
        return window.currentUser?.uid || null;
    }

    // UI Components
    createSubscriptionPrompt() {
        if (this.isSubscribed || !this.isSupported) return;

        const prompt = document.createElement('div');
        prompt.className = 'push-subscription-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-icon">🔔</div>
                <div class="prompt-text">
                    <h3>Receba Notificações</h3>
                    <p>Fique por dentro das novidades da Arquidiocese</p>
                </div>
                <div class="prompt-actions">
                    <button class="btn-subscribe" onclick="pushNotificationManager.requestPermission()">
                        Permitir
                    </button>
                    <button class="btn-dismiss" onclick="this.closest('.push-subscription-prompt').remove()">
                        Não Agora
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(prompt);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(prompt)) {
                prompt.remove();
            }
        }, 10000);
    }

    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'push-settings-panel';
        panel.className = 'push-settings-panel';
        panel.innerHTML = `
            <div class="settings-header">
                <h3>Configurações de Notificação</h3>
                <button class="close-settings" onclick="pushNotificationManager.closeSettingsPanel()">×</button>
            </div>
            
            <div class="settings-content">
                <div class="setting-group">
                    <h4>Tipos de Notificação</h4>
                    ${Object.entries(this.notificationTypes).map(([key, type]) => `
                        <label class="setting-item">
                            <input type="checkbox" id="notify-${key}" ${this.settings.enabledTypes.includes(key) ? 'checked' : ''}>
                            <span>${type.icon} ${type.title}</span>
                        </label>
                    `).join('')}
                </div>
                
                <div class="setting-group">
                    <h4>Horário Silencioso</h4>
                    <label class="setting-item">
                        <input type="checkbox" id="quiet-hours-enabled" ${this.settings.quietHours.enabled ? 'checked' : ''}>
                        <span>Ativar horário silencioso</span>
                    </label>
                    <div class="time-range">
                        <input type="time" id="quiet-start" value="${this.settings.quietHours.start}">
                        <span>até</span>
                        <input type="time" id="quiet-end" value="${this.settings.quietHours.end}">
                    </div>
                </div>
                
                <div class="setting-group">
                    <h4>Outras Opções</h4>
                    <label class="setting-item">
                        <input type="checkbox" id="enable-sound" ${this.settings.enableSound ? 'checked' : ''}>
                        <span>🔊 Som de notificação</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="enable-badge" ${this.settings.enableBadge ? 'checked' : ''}>
                        <span>🏷️ Badge no ícone</span>
                    </label>
                </div>
            </div>
            
            <div class="settings-footer">
                <button class="btn-save" onclick="pushNotificationManager.saveSettings()">Salvar</button>
                <button class="btn-cancel" onclick="pushNotificationManager.closeSettingsPanel()">Cancelar</button>
            </div>
        `;

        document.body.appendChild(panel);
    }

    openSettingsPanel() {
        this.createSettingsPanel();
        document.getElementById('push-settings-panel').classList.add('active');
    }

    closeSettingsPanel() {
        const panel = document.getElementById('push-settings-panel');
        if (panel) {
            panel.remove();
        }
    }

    async saveSettings() {
        const newSettings = { ...this.settings };
        
        // Get enabled types
        newSettings.enabledTypes = [];
        Object.keys(this.notificationTypes).forEach(key => {
            const checkbox = document.getElementById(`notify-${key}`);
            if (checkbox && checkbox.checked) {
                newSettings.enabledTypes.push(key);
            }
        });

        // Get quiet hours
        const quietEnabled = document.getElementById('quiet-hours-enabled');
        const quietStart = document.getElementById('quiet-start');
        const quietEnd = document.getElementById('quiet-end');
        
        newSettings.quietHours = {
            enabled: quietEnabled ? quietEnabled.checked : false,
            start: quietStart ? quietStart.value : '22:00',
            end: quietEnd ? quietEnd.value : '07:00'
        };

        // Get other options
        const enableSound = document.getElementById('enable-sound');
        const enableBadge = document.getElementById('enable-badge');
        
        newSettings.enableSound = enableSound ? enableSound.checked : true;
        newSettings.enableBadge = enableBadge ? enableBadge.checked : true;

        await this.updateSettings(newSettings);
        this.closeSettingsPanel();

        if (window.notificationSystem) {
            window.notificationSystem.createNotification({
                type: 'success',
                title: 'Configurações Salvas',
                message: 'Suas preferências de notificação foram atualizadas!',
                icon: '✅'
            });
        }
    }

    // Admin Interface
    setupAdminInterface() {
        if (!this.isAdminUser()) return;

        const adminContent = document.querySelector('.admin-content');
        if (!adminContent) return;

        const pushSection = document.createElement('div');
        pushSection.className = 'admin-section';
        pushSection.id = 'push-notifications-section';
        pushSection.style.display = 'none';
        
        pushSection.innerHTML = `
            <div class="push-admin">
                <h2>🔔 Push Notifications</h2>
                
                <div class="push-stats">
                    <div class="stat-card">
                        <h3 id="total-subscribers">-</h3>
                        <p>Assinantes Ativos</p>
                    </div>
                    <div class="stat-card">
                        <h3 id="notifications-sent">-</h3>
                        <p>Notificações Enviadas</p>
                    </div>
                    <div class="stat-card">
                        <h3 id="delivery-rate">-</h3>
                        <p>Taxa de Entrega</p>
                    </div>
                </div>
                
                <div class="push-actions">
                    <button class="btn btn-primary" onclick="pushNotificationManager.createNotificationModal()">
                        Enviar Notificação
                    </button>
                    <button class="btn btn-secondary" onclick="pushNotificationManager.viewSubscribers()">
                        Ver Assinantes
                    </button>
                    <button class="btn btn-secondary" onclick="pushNotificationManager.viewLogs()">
                        Logs de Envio
                    </button>
                </div>
                
                <div id="push-content">
                    <!-- Dynamic content will be loaded here -->
                </div>
            </div>
        `;
        
        adminContent.appendChild(pushSection);
        
        // Load initial data
        this.loadPushStats();
    }

    createNotificationModal() {
        const modal = document.createElement('div');
        modal.className = 'push-notification-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Enviar Notificação Push</h3>
                    <button class="modal-close" onclick="this.closest('.push-notification-modal').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="form-group">
                        <label>Tipo de Notificação:</label>
                        <select id="notification-type">
                            ${Object.entries(this.notificationTypes).map(([key, type]) => `
                                <option value="${key}">${type.icon} ${type.title}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Título:</label>
                        <input type="text" id="notification-title" maxlength="100" placeholder="Título da notificação">
                    </div>
                    
                    <div class="form-group">
                        <label>Mensagem:</label>
                        <textarea id="notification-message" maxlength="300" placeholder="Conteúdo da notificação"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>URL de Destino:</label>
                        <input type="url" id="notification-url" placeholder="https://exemplo.com">
                    </div>
                    
                    <div class="form-group">
                        <label>Destinatários:</label>
                        <select id="notification-target">
                            <option value="all">Todos os assinantes</option>
                            <option value="admins">Apenas administradores</option>
                            <option value="active">Usuários ativos</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="high-priority">
                            <span>Alta prioridade (ignora horário silencioso)</span>
                        </label>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="pushNotificationManager.sendAdminNotification()">
                        Enviar Notificação
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.push-notification-modal').remove()">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async sendAdminNotification() {
        const type = document.getElementById('notification-type').value;
        const title = document.getElementById('notification-title').value;
        const message = document.getElementById('notification-message').value;
        const url = document.getElementById('notification-url').value;
        const target = document.getElementById('notification-target').value;
        const highPriority = document.getElementById('high-priority').checked;

        if (!title || !message) {
            alert('Título e mensagem são obrigatórios');
            return;
        }

        try {
            const result = await this.sendNotification(type, {
                title: title,
                message: message,
                url: url || '/',
                priority: highPriority ? 'high' : 'normal'
            }, target);

            alert(`Notificação enviada! ${result.sent} entregues, ${result.failed} falharam.`);
            
            // Close modal
            document.querySelector('.push-notification-modal').remove();
            
            // Refresh stats
            this.loadPushStats();

        } catch (error) {
            alert('Erro ao enviar notificação: ' + error.message);
        }
    }

    async loadPushStats() {
        // In production, fetch real stats from server
        // For demo, use simulated data
        const stats = {
            totalSubscribers: Math.floor(Math.random() * 500) + 100,
            notificationsSent: Math.floor(Math.random() * 1000) + 200,
            deliveryRate: (Math.random() * 20 + 80).toFixed(1) + '%'
        };

        document.getElementById('total-subscribers').textContent = stats.totalSubscribers;
        document.getElementById('notifications-sent').textContent = stats.notificationsSent;
        document.getElementById('delivery-rate').textContent = stats.deliveryRate;
    }

    isAdminUser() {
        return window.currentUser && ['admin', 'moderator'].includes(window.currentUser.role);
    }

    // Public API Methods
    async enableNotifications() {
        return await this.requestPermission();
    }

    async disableNotifications() {
        await this.unsubscribeUser();
    }

    showSettings() {
        this.openSettingsPanel();
    }

    // Quick send methods for common notifications
    async notifyNewPost(postData) {
        return await this.sendNotification('new_posts', {
            title: postData.title,
            url: `/post.html?id=${postData.id}`
        });
    }

    async notifyUrgentAnnouncement(message, url = '/') {
        return await this.sendNotification('urgent_announcements', {
            message: message,
            url: url
        }, 'all');
    }

    async notifyNewEvent(eventData) {
        return await this.sendNotification('events', {
            title: eventData.title,
            date: eventData.date,
            url: eventData.url || '/'
        });
    }
}

// Initialize Push Notification Manager
const pushNotificationManager = new PushNotificationManager();
window.pushNotificationManager = pushNotificationManager;

export default PushNotificationManager;
