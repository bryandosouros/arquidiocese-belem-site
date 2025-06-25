// Real-time Notifications System - Release 4B
// Manages real-time notifications, live updates, and user engagement

import { db } from './firebase-config.js';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, where, Timestamp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unsubscribeFunctions = [];
        this.notificationQueue = [];
        this.isVisible = true;
        this.soundEnabled = true;
        this.pushEnabled = false;
        
        this.init();
    }

    async init() {
        console.log('🔔 Initializing Notification System...');
        
        this.setupVisibilityAPI();
        this.setupRealtimeListeners();
        this.setupNotificationUI();
        this.loadNotificationSettings();
        this.setupNotificationSounds();
        
        // Check for missed notifications
        await this.checkMissedNotifications();
        
        console.log('✅ Notification System initialized');
    }

    // Setup Realtime Listeners
    setupRealtimeListeners() {
        // Listen for new posts
        this.listenForNewPosts();
        
        // Listen for content sharing
        this.listenForContentSharing();
        
        // Listen for workflow updates
        this.listenForWorkflowUpdates();
        
        // Listen for user mentions
        this.listenForUserMentions();
        
        // Listen for system announcements
        this.listenForSystemAnnouncements();
    }

    // Listen for new posts
    listenForNewPosts() {
        const postsQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const post = { id: change.doc.id, ...change.doc.data() };
                    
                    // Only notify for posts created in the last 5 minutes
                    const isRecent = this.isRecentPost(post.createdAt);
                    
                    if (isRecent && !this.isCurrentUserPost(post)) {
                        this.createNotification({
                            type: 'new_post',
                            title: 'Nova Publicação',
                            message: `${post.title}`,
                            icon: '📝',
                            data: { postId: post.id, category: post.category },
                            priority: 'normal',
                            actions: [
                                { action: 'view', title: 'Ver Post' },
                                { action: 'dismiss', title: 'Dispensar' }
                            ]
                        });
                    }
                }
            });
        });
        
        this.unsubscribeFunctions.push(unsubscribe);
    }

    // Listen for content sharing
    listenForContentSharing() {
        const sharesQuery = query(
            collection(db, 'content_shares'),
            orderBy('sharedAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(sharesQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const share = { id: change.doc.id, ...change.doc.data() };
                    
                    if (this.isRecentShare(share.sharedAt)) {
                        this.createNotification({
                            type: 'content_shared',
                            title: 'Conteúdo Compartilhado',
                            message: `Post compartilhado para ${share.targetSites.join(', ')}`,
                            icon: '🔄',
                            data: { shareId: share.id, originalPostId: share.originalPostId },
                            priority: 'normal'
                        });
                    }
                }
            });
        });
        
        this.unsubscribeFunctions.push(unsubscribe);
    }

    // Listen for workflow updates
    listenForWorkflowUpdates() {
        const workflowQuery = query(
            collection(db, 'approval_workflows'),
            orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(workflowQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const workflow = { id: change.doc.id, ...change.doc.data() };
                    
                    // Check if workflow status changed recently
                    if (this.isRecentWorkflowUpdate(workflow)) {
                        const message = this.getWorkflowMessage(workflow);
                        
                        this.createNotification({
                            type: 'workflow_update',
                            title: 'Atualização de Aprovação',
                            message: message,
                            icon: workflow.status === 'approved' ? '✅' : workflow.status === 'rejected' ? '❌' : '⏳',
                            data: { workflowId: workflow.id, status: workflow.status },
                            priority: workflow.status === 'rejected' ? 'high' : 'normal'
                        });
                    }
                }
            });
        });
        
        this.unsubscribeFunctions.push(unsubscribe);
    }

    // Listen for user mentions
    listenForUserMentions() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        
        const mentionsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            where('type', '==', 'mention'),
            orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(mentionsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const mention = { id: change.doc.id, ...change.doc.data() };
                    
                    this.createNotification({
                        type: 'mention',
                        title: 'Você foi mencionado',
                        message: mention.message,
                        icon: '👤',
                        data: { mentionId: mention.id },
                        priority: 'high',
                        requireInteraction: true
                    });
                }
            });
        });
        
        this.unsubscribeFunctions.push(unsubscribe);
    }

    // Listen for system announcements
    listenForSystemAnnouncements() {
        const announcementsQuery = query(
            collection(db, 'system_announcements'),
            where('active', '==', true),
            orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const announcement = { id: change.doc.id, ...change.doc.data() };
                    
                    this.createNotification({
                        type: 'system_announcement',
                        title: 'Anúncio do Sistema',
                        message: announcement.message,
                        icon: '📢',
                        data: { announcementId: announcement.id },
                        priority: announcement.priority || 'normal',
                        requireInteraction: announcement.requireInteraction || false,
                        persistent: true
                    });
                }
            });
        });
        
        this.unsubscribeFunctions.push(unsubscribe);
    }

    // Create and display notification
    createNotification(notificationData) {
        const notification = {
            id: this.generateNotificationId(),
            timestamp: new Date(),
            read: false,
            ...notificationData
        };
        
        // Add to notification list
        this.notifications.unshift(notification);
        
        // Limit notification history
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
        
        // Show notification based on visibility and settings
        this.displayNotification(notification);
        
        // Update notification counter
        this.updateNotificationCounter();
        
        // Store in local storage for persistence
        this.saveNotificationsToStorage();
        
        // Log for debugging
        console.log('🔔 New notification:', notification);
        
        return notification;
    }

    // Display notification
    displayNotification(notification) {
        // Don't show if user has disabled notifications
        if (!this.areNotificationsEnabled()) {
            return;
        }
        
        // Show in-app notification
        this.showInAppNotification(notification);
        
        // Show browser notification if page is not visible
        if (!this.isVisible && this.pushEnabled) {
            this.showBrowserNotification(notification);
        }
        
        // Play sound if enabled
        if (this.soundEnabled) {
            this.playNotificationSound(notification.priority);
        }
        
        // Add to queue if too many notifications
        if (this.getActiveNotifications().length > 3) {
            this.notificationQueue.push(notification);
        }
    }

    // Show in-app notification
    showInAppNotification(notification) {
        const container = this.getNotificationContainer();
        
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-toast notification-${notification.priority}`;
        notificationElement.setAttribute('data-notification-id', notification.id);
        
        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-icon">${notification.icon}</span>
                    <span class="notification-title">${notification.title}</span>
                    <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
                    <button class="notification-close" onclick="notificationSystem.closeNotification('${notification.id}')">×</button>
                </div>
                <div class="notification-message">${notification.message}</div>
                ${this.renderNotificationActions(notification.actions)}
            </div>
        `;
        
        container.appendChild(notificationElement);
        
        // Auto-hide after delay (unless persistent)
        if (!notification.persistent) {
            setTimeout(() => {
                this.closeNotification(notification.id);
            }, this.getNotificationTimeout(notification.priority));
        }
        
        // Animate in
        setTimeout(() => {
            notificationElement.classList.add('notification-show');
        }, 10);
    }

    // Show browser notification
    async showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/images/logo-arquidiocese-belem.png',
                badge: '/images/logo-arquidiocese-belem.png',
                tag: notification.type,
                requireInteraction: notification.requireInteraction || false,
                actions: notification.actions || []
            });
            
            browserNotification.onclick = () => {
                window.focus();
                this.handleNotificationClick(notification);
                browserNotification.close();
            };
            
            // Auto-close after timeout
            setTimeout(() => {
                browserNotification.close();
            }, this.getNotificationTimeout(notification.priority));
        }
    }

    // Handle notification click
    handleNotificationClick(notification) {
        // Mark as read
        this.markAsRead(notification.id);
        
        // Handle different notification types
        switch (notification.type) {
            case 'new_post':
                if (notification.data.postId) {
                    window.location.href = `/post.html?id=${notification.data.postId}`;
                }
                break;
                
            case 'content_shared':
                // Navigate to sharing management
                if (window.location.pathname.includes('admin')) {
                    // Already in admin, switch to content strategy tab
                    const strategyTab = document.querySelector('[data-tab="sharing"]');
                    if (strategyTab) strategyTab.click();
                } else {
                    window.location.href = '/admin.html#content-strategy';
                }
                break;
                
            case 'workflow_update':
                // Navigate to workflow management
                if (window.location.pathname.includes('admin')) {
                    const workflowTab = document.querySelector('[data-tab="workflow"]');
                    if (workflowTab) workflowTab.click();
                } else {
                    window.location.href = '/admin.html#content-strategy';
                }
                break;
                
            case 'mention':
                // Navigate to mentions or profile
                break;
                
            case 'system_announcement':
                // Show announcement details
                this.showAnnouncementDetails(notification.data.announcementId);
                break;
        }
    }

    // Close notification
    closeNotification(notificationId) {
        const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.classList.add('notification-hide');
            setTimeout(() => {
                if (notificationElement.parentElement) {
                    notificationElement.remove();
                }
            }, 300);
        }
        
        // Process queue
        this.processNotificationQueue();
    }

    // Mark notification as read
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationCounter();
            this.saveNotificationsToStorage();
        }
    }

    // Mark all notifications as read
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateNotificationCounter();
        this.saveNotificationsToStorage();
    }

    // Setup notification UI
    setupNotificationUI() {
        // Create notification container
        this.createNotificationContainer();
        
        // Create notification center
        this.createNotificationCenter();
        
        // Setup notification button
        this.setupNotificationButton();
    }

    // Create notification container
    createNotificationContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    // Create notification center
    createNotificationCenter() {
        if (!document.getElementById('notification-center')) {
            const center = document.createElement('div');
            center.id = 'notification-center';
            center.className = 'notification-center';
            center.innerHTML = `
                <div class="notification-center-header">
                    <h3>Notificações</h3>
                    <button class="mark-all-read" onclick="notificationSystem.markAllAsRead()">Marcar todas como lidas</button>
                    <button class="notification-center-close" onclick="notificationSystem.closeNotificationCenter()">×</button>
                </div>
                <div class="notification-center-content">
                    <div class="notification-list" id="notification-list">
                        <!-- Notifications will be populated here -->
                    </div>
                </div>
                <div class="notification-center-footer">
                    <button onclick="notificationSystem.clearAllNotifications()">Limpar Todas</button>
                    <button onclick="notificationSystem.openNotificationSettings()">Configurações</button>
                </div>
            `;
            document.body.appendChild(center);
        }
    }

    // Setup notification button
    setupNotificationButton() {
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.toggleNotificationCenter();
            });
        }
    }

    // Update notification counter
    updateNotificationCounter() {
        const unreadCount = this.getUnreadCount();
        const counter = document.getElementById('notification-counter');
        
        if (counter) {
            counter.textContent = unreadCount;
            counter.style.display = unreadCount > 0 ? 'block' : 'none';
        }
        
        // Update page title with count
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) Arquidiocese de Belém`;
        } else {
            document.title = 'Arquidiocese de Belém';
        }
    }

    // Get notification container
    getNotificationContainer() {
        return document.getElementById('notification-container') || this.createNotificationContainer();
    }

    // Utility methods
    generateNotificationId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'agora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return timestamp.toLocaleDateString();
    }

    isRecentPost(createdAt) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return createdAt.toDate() > fiveMinutesAgo;
    }

    isCurrentUserPost(post) {
        const currentUser = this.getCurrentUser();
        return currentUser && post.authorId === currentUser.uid;
    }

    getCurrentUser() {
        // Get current user from auth system
        return window.currentUser || null;
    }

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    getActiveNotifications() {
        return document.querySelectorAll('.notification-toast');
    }

    getNotificationTimeout(priority) {
        switch (priority) {
            case 'high': return 10000; // 10 seconds
            case 'normal': return 5000; // 5 seconds
            case 'low': return 3000; // 3 seconds
            default: return 5000;
        }
    }

    areNotificationsEnabled() {
        return localStorage.getItem('notifications_enabled') !== 'false';
    }

    setupVisibilityAPI() {
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
        });
    }

    setupNotificationSounds() {
        // Create audio elements for notification sounds
        this.sounds = {
            normal: new Audio('/sounds/notification.mp3'),
            high: new Audio('/sounds/notification-urgent.mp3'),
            low: new Audio('/sounds/notification-soft.mp3')
        };
        
        // Set volume
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
        });
    }

    playNotificationSound(priority = 'normal') {
        if (this.soundEnabled && this.sounds[priority]) {
            this.sounds[priority].play().catch(error => {
                console.log('Could not play notification sound:', error);
            });
        }
    }

    saveNotificationsToStorage() {
        const recentNotifications = this.notifications.slice(0, 50); // Keep only 50 most recent
        localStorage.setItem('notifications', JSON.stringify(recentNotifications));
    }

    loadNotificationsFromStorage() {
        const stored = localStorage.getItem('notifications');
        if (stored) {
            this.notifications = JSON.parse(stored);
            this.updateNotificationCounter();
        }
    }

    // Public API methods
    toggleNotificationCenter() {
        const center = document.getElementById('notification-center');
        center.classList.toggle('notification-center-open');
        
        if (center.classList.contains('notification-center-open')) {
            this.populateNotificationCenter();
        }
    }

    closeNotificationCenter() {
        const center = document.getElementById('notification-center');
        center.classList.remove('notification-center-open');
    }

    populateNotificationCenter() {
        const list = document.getElementById('notification-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="no-notifications">Nenhuma notificação</div>';
            return;
        }
        
        this.notifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            item.innerHTML = `
                <div class="notification-item-icon">${notification.icon}</div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${notification.title}</div>
                    <div class="notification-item-message">${notification.message}</div>
                    <div class="notification-item-time">${this.formatTime(notification.timestamp)}</div>
                </div>
                <button class="notification-item-close" onclick="notificationSystem.removeNotification('${notification.id}')">×</button>
            `;
            
            item.addEventListener('click', () => {
                this.handleNotificationClick(notification);
                this.closeNotificationCenter();
            });
            
            list.appendChild(item);
        });
    }

    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationCounter();
        this.saveNotificationsToStorage();
        this.populateNotificationCenter();
    }

    async checkMissedNotifications() {
        // Check for notifications that might have been missed while offline
        const lastCheck = localStorage.getItem('last_notification_check');
        const now = new Date();
        
        if (lastCheck) {
            const lastCheckDate = new Date(lastCheck);
            // Check for posts created since last check
            // Implementation would query Firestore for recent posts
        }
        
        localStorage.setItem('last_notification_check', now.toISOString());
    }

    destroy() {
        // Clean up listeners
        this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        this.unsubscribeFunctions = [];
    }
}

// Initialize notification system
const notificationSystem = new NotificationSystem();

// Export for global access
window.notificationSystem = notificationSystem;

export default NotificationSystem;
