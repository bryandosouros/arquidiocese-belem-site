// Comment System - Release 5B (Enhanced)
// Sistema avançado de comentários moderados para a Arquidiocese

import { db } from './firebase-config.js';
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc, getDocs, Timestamp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

class CommentSystem {
    constructor() {
        this.comments = new Map();
        this.unsubscribeFunctions = [];
        this.moderationQueue = [];
        this.currentUser = null;
        this.settings = {
            moderationEnabled: true,
            maxCommentLength: 500,
            allowAnonymous: true, // Allow anonymous with email
            autoApproveRegistered: true,
            requireEmail: true,
            blockedWords: ['spam', 'lixo', 'propaganda', 'vende', 'compra'],
            rateLimitMinutes: 2,
            enableNotifications: true,
            enableEmailNotifications: true,
            autoModeration: true,
            sentimentAnalysis: true
        };
        this.userRateLimit = new Map();
        this.moderationStats = {
            totalComments: 0,
            approved: 0,
            rejected: 0,
            pending: 0
        };
        
        this.init();
    }

    async init() {
        console.log('💬 Enhanced Comment System initializing...');
        
        this.loadSettings();
        this.setupEventListeners();
        this.setupMobileOptimizations(); // Mobile UX enhancements
        this.setupModerationUI();
        this.setupAdminInterface();
        this.loadModerationStats();
        
        console.log('✅ Enhanced Comment System initialized');
    }

    // Load comments for a specific post
    async loadComments(postId) {
        const commentsQuery = query(
            collection(db, 'comments'),
            where('postId', '==', postId),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const comments = [];
            snapshot.forEach((doc) => {
                comments.push({ id: doc.id, ...doc.data() });
            });
            
            this.comments.set(postId, comments);
            this.renderComments(postId, comments);
        });

        this.unsubscribeFunctions.push(unsubscribe);
        return unsubscribe;
    }

    // Render comments in the UI
    renderComments(postId, comments) {
        const container = document.getElementById(`comments-${postId}`);
        if (!container) return;

        const commentsHTML = comments.map(comment => this.renderComment(comment)).join('');
        
        container.innerHTML = `
            <div class="comments-header">
                <h4>💬 Comentários (${comments.length})</h4>
                ${this.renderCommentForm(postId)}
            </div>
            <div class="comments-list">
                ${commentsHTML || '<p class="no-comments">Seja o primeiro a comentar!</p>'}
            </div>
        `;

        // Setup comment form
        this.setupCommentForm(postId);
    }

    // Render individual comment
    renderComment(comment) {
        const timeAgo = this.getTimeAgo(comment.createdAt.toDate());
        const isReply = comment.parentId ? 'comment-reply' : '';
        
        return `
            <div class="comment ${isReply}" data-comment-id="${comment.id}">
                <div class="comment-avatar">
                    <img src="${comment.authorAvatar || '/images/default-avatar.png'}" 
                         alt="${comment.authorName}" 
                         onerror="this.src='/images/default-avatar.png'">
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.authorName}</span>
                        <span class="comment-time">${timeAgo}</span>
                        ${comment.authorRole ? `<span class="comment-role">${comment.authorRole}</span>` : ''}
                    </div>
                    <div class="comment-text">${this.formatCommentText(comment.text)}</div>
                    <div class="comment-actions">
                        <button class="comment-like" data-comment-id="${comment.id}">
                            👍 <span class="like-count">${comment.likes || 0}</span>
                        </button>
                        <button class="comment-reply-btn" data-comment-id="${comment.id}">
                            💬 Responder
                        </button>
                        ${this.canModerateComment(comment) ? `
                            <button class="comment-moderate" data-comment-id="${comment.id}">
                                🛡️ Moderar
                            </button>
                        ` : ''}
                    </div>
                    <div class="comment-reply-form" id="reply-form-${comment.id}" style="display: none;"></div>
                </div>
            </div>
        `;
    }

    // Render comment form
    renderCommentForm(postId, parentId = null) {
        const isReply = parentId ? true : false;
        const formId = isReply ? `reply-form-${parentId}` : `comment-form-${postId}`;
        
        return `
            <form class="comment-form" id="${formId}" data-post-id="${postId}" data-parent-id="${parentId || ''}">
                <div class="comment-form-fields">
                    ${!this.currentUser ? `
                        <div class="comment-form-row">
                            <input type="text" name="authorName" placeholder="Seu nome *" required maxlength="50">
                            <input type="email" name="authorEmail" placeholder="Seu e-mail *" required>
                        </div>
                    ` : ''}
                    <div class="comment-form-row">
                        <textarea name="commentText" 
                                  placeholder="${isReply ? 'Escreva sua resposta...' : 'Deixe seu comentário...'}" 
                                  required 
                                  maxlength="${this.settings.maxCommentLength}"
                                  rows="3"></textarea>
                    </div>
                    <div class="comment-form-row">
                        <button type="submit" class="btn btn-primary">
                            ${isReply ? 'Responder' : 'Comentar'}
                        </button>
                        ${isReply ? `
                            <button type="button" class="btn btn-secondary cancel-reply">
                                Cancelar
                            </button>
                        ` : ''}
                    </div>
                    <div class="comment-form-info">
                        <small>
                            ${this.settings.moderationEnabled ? 
                                'Seu comentário será revisado antes da publicação.' : 
                                'Seu comentário será publicado imediatamente.'}
                        </small>
                    </div>
                </div>
            </form>
        `;
    }

    // Setup comment form event listeners
    setupCommentForm(postId) {
        const form = document.getElementById(`comment-form-${postId}`);
        if (form) {
            form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }

        // Setup reply buttons
        document.querySelectorAll('.comment-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleReplyClick(e));
        });

        // Setup like buttons
        document.querySelectorAll('.comment-like').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCommentLike(e));
        });

        // Setup moderation buttons
        document.querySelectorAll('.comment-moderate').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCommentModeration(e));
        });
    }

    // Handle comment submission
    async handleCommentSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const postId = form.dataset.postId;
        const parentId = form.dataset.parentId || null;

        // Rate limiting check
        if (!this.checkRateLimit()) {
            this.showNotification('Aguarde um pouco antes de comentar novamente.', 'warning');
            return;
        }

        // Prepare comment data
        const commentData = {
            postId: postId,
            parentId: parentId,
            text: formData.get('commentText').trim(),
            authorName: this.currentUser ? this.currentUser.displayName : formData.get('authorName'),
            authorEmail: this.currentUser ? this.currentUser.email : formData.get('authorEmail'),
            authorId: this.currentUser ? this.currentUser.uid : null,
            authorAvatar: this.currentUser ? this.currentUser.photoURL : null,
            authorRole: this.currentUser ? this.getUserRole() : null,
            createdAt: Timestamp.now(),
            status: this.getInitialStatus(),
            likes: 0,
            likedBy: [],
            reported: false,
            ipAddress: await this.getClientIP()
        };

        try {
            // Content moderation
            if (!this.isContentAppropriate(commentData.text)) {
                this.showNotification('Comentário contém conteúdo inapropriado.', 'error');
                return;
            }

            // Submit comment
            const docRef = await addDoc(collection(db, 'comments'), commentData);
            
            // Update rate limit
            this.updateRateLimit();

            // Reset form
            form.reset();

            // Hide reply form if it's a reply
            if (parentId) {
                form.closest('.comment-reply-form').style.display = 'none';
            }

            // Show success message
            const status = commentData.status;
            if (status === 'pending') {
                this.showNotification('Comentário enviado para moderação!', 'info');
            } else {
                this.showNotification('Comentário publicado!', 'success');
            }

            // Track analytics
            if (window.analyticsManager) {
                window.analyticsManager.trackEvent('comment_submitted', {
                    post_id: postId,
                    is_reply: !!parentId,
                    user_type: this.currentUser ? 'registered' : 'anonymous'
                });
            }

        } catch (error) {
            console.error('Error submitting comment:', error);
            this.showNotification('Erro ao enviar comentário. Tente novamente.', 'error');
        }
    }

    // Handle reply button click
    handleReplyClick(e) {
        const commentId = e.target.dataset.commentId;
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        
        if (replyForm.style.display === 'none') {
            // Show reply form
            replyForm.style.display = 'block';
            replyForm.innerHTML = this.renderCommentForm(this.getCurrentPostId(), commentId);
            
            // Setup form events
            const form = replyForm.querySelector('.comment-form');
            form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
            
            // Setup cancel button
            const cancelBtn = replyForm.querySelector('.cancel-reply');
            cancelBtn.addEventListener('click', () => {
                replyForm.style.display = 'none';
            });
        } else {
            replyForm.style.display = 'none';
        }
    }

    // Handle comment like
    async handleCommentLike(e) {
        const commentId = e.target.closest('.comment-like').dataset.commentId;
        const userId = this.currentUser ? this.currentUser.uid : this.getAnonymousId();
        
        try {
            const commentRef = doc(db, 'comments', commentId);
            const comment = await this.getComment(commentId);
            
            if (!comment) return;

            const likedBy = comment.likedBy || [];
            const hasLiked = likedBy.includes(userId);

            if (hasLiked) {
                // Unlike
                const newLikedBy = likedBy.filter(id => id !== userId);
                await updateDoc(commentRef, {
                    likes: Math.max(0, (comment.likes || 0) - 1),
                    likedBy: newLikedBy
                });
            } else {
                // Like
                await updateDoc(commentRef, {
                    likes: (comment.likes || 0) + 1,
                    likedBy: [...likedBy, userId]
                });
            }

            // Update UI
            const likeCount = e.target.closest('.comment-like').querySelector('.like-count');
            const newCount = hasLiked ? Math.max(0, (comment.likes || 0) - 1) : (comment.likes || 0) + 1;
            likeCount.textContent = newCount;

        } catch (error) {
            console.error('Error liking comment:', error);
        }
    }

    // Handle comment moderation
    handleCommentModeration(e) {
        const commentId = e.target.dataset.commentId;
        this.openModerationDialog(commentId);
    }

    // Content moderation
    isContentAppropriate(text) {
        const lowerText = text.toLowerCase();
        
        // Check blocked words
        for (const word of this.settings.blockedWords) {
            if (lowerText.includes(word.toLowerCase())) {
                return false;
            }
        }

        // Check for excessive caps
        const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (capsRatio > 0.7 && text.length > 20) {
            return false;
        }

        // Check for repeated characters
        if (/(.)\1{4,}/.test(text)) {
            return false;
        }

        return true;
    }

    // Get initial comment status based on settings
    getInitialStatus() {
        if (!this.settings.moderationEnabled) {
            return 'approved';
        }

        if (this.currentUser && this.settings.autoApproveRegistered) {
            const userRole = this.getUserRole();
            if (['admin', 'moderator', 'editor'].includes(userRole)) {
                return 'approved';
            }
        }

        return 'pending';
    }

    // Utility functions
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('pt-BR');
    }

    formatCommentText(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    getCurrentPostId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    getUserRole() {
        return this.currentUser?.customClaims?.role || 'user';
    }

    canModerateComment(comment) {
        if (!this.currentUser) return false;
        const role = this.getUserRole();
        return ['admin', 'moderator'].includes(role);
    }

    // Rate limiting
    checkRateLimit() {
        const lastComment = localStorage.getItem('lastCommentTime');
        if (!lastComment) return true;
        
        const timeDiff = Date.now() - parseInt(lastComment);
        const minutesDiff = timeDiff / (1000 * 60);
        
        return minutesDiff >= this.settings.rateLimitMinutes;
    }

    updateRateLimit() {
        localStorage.setItem('lastCommentTime', Date.now().toString());
    }

    getAnonymousId() {
        let anonymousId = localStorage.getItem('anonymousCommentId');
        if (!anonymousId) {
            anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anonymousCommentId', anonymousId);
        }
        return anonymousId;
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

    // Settings and UI
    loadSettings() {
        const stored = localStorage.getItem('commentSystemSettings');
        if (stored) {
            this.settings = { ...this.settings, ...JSON.parse(stored) };
        }
    }

    setupEventListeners() {
        // Get current user from auth system
        if (window.currentUser) {
            this.currentUser = window.currentUser;
        }

        // Listen for auth state changes
        if (window.auth) {
            window.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
            });
        }
    }

    setupModerationUI() {
        // Create moderation interface for admins
        if (this.canModerate()) {
            this.createModerationPanel();
        }
    }

    canModerate() {
        const role = this.getUserRole();
        return ['admin', 'moderator'].includes(role);
    }

    // Notification system
    showNotification(message, type = 'info') {
        if (window.notificationSystem) {
            window.notificationSystem.createNotification({
                type: type,
                title: 'Comentários',
                message: message,
                icon: '💬'
            });
        } else {
            alert(message);
        }
    }

    // Admin interface setup
    setupAdminInterface() {
        if (!this.canModerate()) return;

        // Add admin styles to head
        const adminStyles = document.createElement('style');
        adminStyles.textContent = `
            .comment-moderation-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 1rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 1000;
                max-width: 300px;
                display: none;
            }

            .moderation-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
                margin-bottom: 1rem;
            }

            .stat-item {
                text-align: center;
                padding: 0.5rem;
                background: #f3f4f6;
                border-radius: 6px;
            }

            .stat-number {
                font-size: 1.5rem;
                font-weight: bold;
                color: #1f2937;
            }

            .stat-label {
                font-size: 0.75rem;
                color: #6b7280;
                text-transform: uppercase;
            }

            .moderation-controls {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .mod-btn {
                flex: 1;
                padding: 0.5rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 500;
                transition: all 0.2s;
            }

            .mod-btn.primary { background: #3b82f6; color: white; }
            .mod-btn.danger { background: #ef4444; color: white; }
            .mod-btn.success { background: #10b981; color: white; }

            .moderation-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 10000;
                display: none;
                justify-content: center;
                align-items: center;
            }

            .moderation-dialog-content {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .comment-preview {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
            }

            @media (max-width: 768px) {
                .comment-moderation-panel {
                    top: 10px;
                    right: 10px;
                    width: 90%;
                    max-width: none;
                    border-radius: 8px;
                }

                .moderation-dialog-content {
                    padding: 1rem;
                    width: 95%;
                }

                .comment-preview {
                    padding: 0.75rem;
                }
            }
        `;
        document.head.appendChild(adminStyles);
    }

    // Load moderation statistics
    async loadModerationStats() {
        if (!this.canModerate()) return;

        try {
            // Get all comments for stats
            const allCommentsQuery = query(collection(db, 'comments'));
            const snapshot = await getDocs(allCommentsQuery);
            
            this.moderationStats = {
                totalComments: snapshot.size,
                approved: 0,
                rejected: 0,
                pending: 0
            };

            snapshot.forEach((doc) => {
                const status = doc.data().status;
                if (status === 'approved') this.moderationStats.approved++;
                else if (status === 'rejected') this.moderationStats.rejected++;
                else if (status === 'pending') this.moderationStats.pending++;
            });

            this.updateModerationUI();
        } catch (error) {
            console.error('Error loading moderation stats:', error);
        }
    }

    // Get single comment by ID
    async getComment(commentId) {
        try {
            const commentRef = doc(db, 'comments', commentId);
            const snapshot = await getDocs(query(collection(db, 'comments'), where('__name__', '==', commentId)));
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting comment:', error);
            return null;
        }
    }

    // Create moderation panel
    createModerationPanel() {
        const panel = document.createElement('div');
        panel.id = 'comment-moderation-panel';
        panel.className = 'comment-moderation-panel';
        
        panel.innerHTML = `
            <div class="panel-header">
                <h4>💬 Moderação</h4>
                <button class="close-panel" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
            <div class="moderation-stats">
                <div class="stat-item">
                    <div class="stat-number" id="total-comments">0</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="pending-comments">0</div>
                    <div class="stat-label">Pendentes</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="approved-comments">0</div>
                    <div class="stat-label">Aprovados</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="rejected-comments">0</div>
                    <div class="stat-label">Rejeitados</div>
                </div>
            </div>
            <div class="moderation-controls">
                <button class="mod-btn primary" onclick="window.commentSystem.showModerationQueue()">
                    Fila de Moderação
                </button>
                <button class="mod-btn success" onclick="window.commentSystem.showAllComments()">
                    Todos os Comentários
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        // Add toggle button to show/hide panel
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'moderation-toggle';
        toggleBtn.innerHTML = '💬';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            z-index: 999;
            font-size: 1.2rem;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        `;

        toggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('comment-moderation-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.body.appendChild(toggleBtn);
    }

    // Update moderation UI with current stats
    updateModerationUI() {
        const totalEl = document.getElementById('total-comments');
        const pendingEl = document.getElementById('pending-comments');
        const approvedEl = document.getElementById('approved-comments');
        const rejectedEl = document.getElementById('rejected-comments');

        if (totalEl) totalEl.textContent = this.moderationStats.totalComments;
        if (pendingEl) pendingEl.textContent = this.moderationStats.pending;
        if (approvedEl) approvedEl.textContent = this.moderationStats.approved;
        if (rejectedEl) rejectedEl.textContent = this.moderationStats.rejected;
    }

    // Open moderation dialog for specific comment
    async openModerationDialog(commentId) {
        const comment = await this.getComment(commentId);
        if (!comment) return;

        // Create or get existing dialog
        let dialog = document.getElementById('comment-moderation-dialog');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'comment-moderation-dialog';
            dialog.className = 'moderation-dialog';
            document.body.appendChild(dialog);
        }

        dialog.innerHTML = `
            <div class="moderation-dialog-content">
                <div class="dialog-header">
                    <h3>Moderar Comentário</h3>
                    <button class="modal-close" onclick="this.closest('.moderation-dialog').style.display='none'">×</button>
                </div>
                <div class="comment-preview">
                    <div class="comment-meta">
                        <strong>${comment.authorName}</strong> - ${comment.authorEmail}
                        <br><small>${comment.createdAt.toDate().toLocaleString('pt-BR')}</small>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-status">Status: <strong>${comment.status}</strong></div>
                </div>
                <div class="moderation-actions">
                    <button class="mod-btn success" onclick="window.commentSystem.moderateComment('${commentId}', 'approve')">
                        ✅ Aprovar
                    </button>
                    <button class="mod-btn danger" onclick="window.commentSystem.moderateComment('${commentId}', 'reject')">
                        ❌ Rejeitar
                    </button>
                    <button class="mod-btn primary" onclick="window.commentSystem.moderateComment('${commentId}', 'delete')">
                        🗑️ Excluir
                    </button>
                </div>
                <div class="rejection-reason" style="display: none;">
                    <textarea placeholder="Motivo da rejeição (opcional)" id="rejection-reason"></textarea>
                </div>
            </div>
        `;

        dialog.style.display = 'flex';
    }

    // Moderate comment action
    async moderateComment(commentId, action) {
        try {
            let result;
            
            switch (action) {
                case 'approve':
                    result = await this.approveComment(commentId);
                    break;
                case 'reject':
                    const reason = document.getElementById('rejection-reason')?.value || '';
                    result = await this.rejectComment(commentId, reason);
                    break;
                case 'delete':
                    if (confirm('Tem certeza que deseja excluir este comentário permanentemente?')) {
                        await deleteDoc(doc(db, 'comments', commentId));
                        result = { success: true };
                    }
                    break;
            }

            if (result && result.success) {
                this.showNotification(`Comentário ${action === 'approve' ? 'aprovado' : action === 'reject' ? 'rejeitado' : 'excluído'} com sucesso!`, 'success');
                document.getElementById('comment-moderation-dialog').style.display = 'none';
                this.loadModerationStats(); // Refresh stats
            }

        } catch (error) {
            console.error('Error moderating comment:', error);
            this.showNotification('Erro ao moderar comentário.', 'error');
        }
    }

    // Show moderation queue
    async showModerationQueue() {
        const pendingComments = await this.getModerationQueue();
        
        if (pendingComments.length === 0) {
            this.showNotification('Nenhum comentário pendente de moderação.', 'info');
            return;
        }

        // Show in a modal or new page
        this.showCommentsModal(pendingComments, 'Fila de Moderação');
    }

    // Show all comments
    async showAllComments() {
        try {
            const allCommentsQuery = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(allCommentsQuery);
            const comments = [];
            
            snapshot.forEach((doc) => {
                comments.push({ id: doc.id, ...doc.data() });
            });

            this.showCommentsModal(comments, 'Todos os Comentários');
        } catch (error) {
            console.error('Error loading all comments:', error);
        }
    }

    // Show comments in modal
    showCommentsModal(comments, title) {
        const modal = document.getElementById('comments-modal') || document.createElement('div');
        modal.id = 'comments-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';

        const commentsHTML = comments.map(comment => `
            <div class="comment-item" style="border: 1px solid #e5e7eb; margin: 0.5rem 0; padding: 1rem; border-radius: 8px;">
                <div class="comment-header">
                    <strong>${comment.authorName}</strong> - ${comment.authorEmail}
                    <span class="comment-status" style="float: right; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: ${
                        comment.status === 'approved' ? '#10b981' : comment.status === 'rejected' ? '#ef4444' : '#f59e0b'
                    }; color: white;">
                        ${comment.status}
                    </span>
                </div>
                <div class="comment-text" style="margin: 0.5rem 0;">${comment.text}</div>
                <div class="comment-actions">
                    <button onclick="window.commentSystem.openModerationDialog('${comment.id}')" class="mod-btn primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                        Moderar
                    </button>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content" style="max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>${title} (${comments.length})</h3>
                    <button class="modal-close" onclick="this.closest('.modal').style.display='none'">×</button>
                </div>
                <div class="modal-body">
                    ${commentsHTML || '<p>Nenhum comentário encontrado.</p>'}
                </div>
            </div>
        `;

        if (!document.getElementById('comments-modal')) {
            document.body.appendChild(modal);
        }
    }

    // Public API
    async createCommentsSection(postId) {
        const container = document.createElement('div');
        container.id = `comments-${postId}`;
        container.className = 'comments-section';
        
        // Load comments for this post
        await this.loadComments(postId);
        
        return container;
    }

    // Admin functions
    async getModerationQueue() {
        const query = query(
            collection(db, 'comments'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(query);
        const comments = [];
        snapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });

        return comments;
    }

    async approveComment(commentId) {
        try {
            const commentRef = doc(db, 'comments', commentId);
            await updateDoc(commentRef, {
                status: 'approved',
                moderatedAt: Timestamp.now(),
                moderatedBy: this.currentUser?.uid
            });
            return { success: true };
        } catch (error) {
            console.error('Error approving comment:', error);
            return { success: false, error: error.message };
        }
    }

    async rejectComment(commentId, reason = '') {
        try {
            const commentRef = doc(db, 'comments', commentId);
            await updateDoc(commentRef, {
                status: 'rejected',
                rejectionReason: reason,
                moderatedAt: Timestamp.now(),
                moderatedBy: this.currentUser?.uid
            });
            return { success: true };
        } catch (error) {
            console.error('Error rejecting comment:', error);
            return { success: false, error: error.message };
        }
    }

    // Cleanup
    destroy() {
        this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        this.unsubscribeFunctions = [];
    }

    // Mobile UX optimizations
    setupMobileOptimizations() {
        if (window.innerWidth <= 768) {
            // Mobile-specific optimizations
            const commentsSection = document.querySelector('.comments-section');
            if (commentsSection) {
                commentsSection.classList.add('mobile-optimized');
            }
            
            // Touch-friendly comment interactions
            document.addEventListener('touchstart', (e) => {
                if (e.target.closest('.comment-item')) {
                    e.target.closest('.comment-item').classList.add('touch-active');
                }
            }, { passive: true });
            
            document.addEventListener('touchend', (e) => {
                if (e.target.closest('.comment-item')) {
                    setTimeout(() => {
                        e.target.closest('.comment-item').classList.remove('touch-active');
                    }, 150);
                }
            }, { passive: true });
            
            // Auto-resize textarea for mobile
            const textarea = document.querySelector('#comment-text');
            if (textarea) {
                textarea.style.minHeight = '100px';
                textarea.addEventListener('input', this.autoResizeTextarea);
                textarea.addEventListener('focus', () => {
                    // Scroll into view with mobile keyboard offset
                    setTimeout(() => {
                        textarea.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }, 300);
                });
            }
            
            // Mobile-friendly form buttons
            const commentForm = document.querySelector('.comment-form');
            if (commentForm) {
                commentForm.style.padding = '1.5rem 1rem';
                const submitBtn = commentForm.querySelector('.btn-submit-comment');
                if (submitBtn) {
                    submitBtn.style.minHeight = '48px';
                    submitBtn.style.fontSize = '1rem';
                }
            }
        }
    }

    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
}

// Initialize comment system
const commentSystem = new CommentSystem();
window.commentSystem = commentSystem;

export default CommentSystem;
