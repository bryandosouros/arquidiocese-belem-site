// Offline Cache Manager - Release 4B
// Gerenciamento de cache offline e sincronização de dados

class OfflineCacheManager {
    constructor() {
        this.CACHE_VERSION = 'v1';
        this.OFFLINE_POSTS_KEY = 'offline_posts';
        this.PENDING_ACTIONS_KEY = 'pending_actions';
        this.LAST_SYNC_KEY = 'last_sync';
        this.init();
    }

    init() {
        console.log('📦 Offline Cache Manager initializing...');
        this.setupOfflineHandlers();
        this.setupSyncHandlers();
    }

    // Gerenciamento de Posts Offline
    async cachePostsForOffline(posts) {
        try {
            const postsToCache = posts.map(post => ({
                ...post,
                cachedAt: new Date().toISOString(),
                offline: true
            }));

            localStorage.setItem(this.OFFLINE_POSTS_KEY, JSON.stringify(postsToCache));
            console.log(`📱 ${posts.length} posts cached for offline use`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to cache posts offline:', error);
            return false;
        }
    }

    getOfflinePosts() {
        try {
            const cached = localStorage.getItem(this.OFFLINE_POSTS_KEY);
            if (cached) {
                const posts = JSON.parse(cached);
                console.log(`📖 Retrieved ${posts.length} posts from offline cache`);
                return posts;
            }
            return [];
        } catch (error) {
            console.error('❌ Failed to retrieve offline posts:', error);
            return [];
        }
    }

    // Gerenciamento de Ações Pendentes
    async queueAction(action) {
        try {
            const pending = this.getPendingActions();
            const newAction = {
                id: Date.now().toString(),
                ...action,
                queuedAt: new Date().toISOString(),
                status: 'pending'
            };

            pending.push(newAction);
            localStorage.setItem(this.PENDING_ACTIONS_KEY, JSON.stringify(pending));
            
            console.log('📋 Action queued for sync:', action.type);
            return newAction.id;
        } catch (error) {
            console.error('❌ Failed to queue action:', error);
            return null;
        }
    }

    getPendingActions() {
        try {
            const pending = localStorage.getItem(this.PENDING_ACTIONS_KEY);
            return pending ? JSON.parse(pending) : [];
        } catch (error) {
            console.error('❌ Failed to get pending actions:', error);
            return [];
        }
    }

    async removePendingAction(actionId) {
        try {
            const pending = this.getPendingActions();
            const filtered = pending.filter(action => action.id !== actionId);
            localStorage.setItem(this.PENDING_ACTIONS_KEY, JSON.stringify(filtered));
            console.log('✅ Pending action removed:', actionId);
        } catch (error) {
            console.error('❌ Failed to remove pending action:', error);
        }
    }

    // Sincronização quando voltar online
    async syncPendingActions() {
        if (!navigator.onLine) {
            console.log('🔌 Still offline, skipping sync');
            return;
        }

        const pending = this.getPendingActions();
        if (pending.length === 0) {
            console.log('✅ No pending actions to sync');
            return;
        }

        console.log(`🔄 Syncing ${pending.length} pending actions...`);

        for (const action of pending) {
            try {
                await this.executeAction(action);
                await this.removePendingAction(action.id);
                console.log('✅ Action synced:', action.type);
            } catch (error) {
                console.error('❌ Failed to sync action:', error);
                // Manter na fila para tentar novamente
            }
        }

        this.updateLastSyncTime();
    }

    async executeAction(action) {
        switch (action.type) {
            case 'create_post':
                return await this.syncCreatePost(action.data);
            case 'update_post':
                return await this.syncUpdatePost(action.data);
            case 'delete_post':
                return await this.syncDeletePost(action.data);
            case 'like_post':
                return await this.syncLikePost(action.data);
            default:
                console.warn('Unknown action type:', action.type);
        }
    }

    async syncCreatePost(postData) {
        // Simular criação de post
        console.log('📝 Syncing create post:', postData.title);
        
        // Em um app real, isso faria uma chamada para o Firebase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true, id: 'synced_' + Date.now() };
    }

    async syncUpdatePost(postData) {
        console.log('✏️ Syncing update post:', postData.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
    }

    async syncDeletePost(postData) {
        console.log('🗑️ Syncing delete post:', postData.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
    }

    async syncLikePost(postData) {
        console.log('👍 Syncing like post:', postData.postId);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    }

    // Handlers para eventos online/offline
    setupOfflineHandlers() {
        window.addEventListener('online', () => {
            console.log('🌐 Back online! Starting sync...');
            this.syncPendingActions();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Gone offline. Actions will be queued.');
        });
    }

    setupSyncHandlers() {
        // Sync periódico quando online
        setInterval(() => {
            if (navigator.onLine && this.getPendingActions().length > 0) {
                this.syncPendingActions();
            }
        }, 30000); // A cada 30 segundos
    }

    // Utilitários
    updateLastSyncTime() {
        localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
    }

    getLastSyncTime() {
        return localStorage.getItem(this.LAST_SYNC_KEY);
    }

    clearOfflineData() {
        localStorage.removeItem(this.OFFLINE_POSTS_KEY);
        localStorage.removeItem(this.PENDING_ACTIONS_KEY);
        localStorage.removeItem(this.LAST_SYNC_KEY);
        console.log('🧹 Offline data cleared');
    }

    getOfflineStatus() {
        return {
            isOnline: navigator.onLine,
            cachedPosts: this.getOfflinePosts().length,
            pendingActions: this.getPendingActions().length,
            lastSync: this.getLastSyncTime()
        };
    }

    // API para componentes
    async createPostOffline(postData) {
        // Adicionar à lista local
        const posts = this.getOfflinePosts();
        const newPost = {
            ...postData,
            id: 'offline_' + Date.now(),
            offline: true,
            createdAt: new Date().toISOString()
        };
        
        posts.unshift(newPost);
        await this.cachePostsForOffline(posts);
        
        // Adicionar à fila de sync
        await this.queueAction({
            type: 'create_post',
            data: postData
        });

        return newPost;
    }

    async updatePostOffline(postId, updates) {
        // Atualizar na lista local
        const posts = this.getOfflinePosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex !== -1) {
            posts[postIndex] = { ...posts[postIndex], ...updates };
            await this.cachePostsForOffline(posts);
        }

        // Adicionar à fila de sync
        await this.queueAction({
            type: 'update_post',
            data: { id: postId, ...updates }
        });

        return posts[postIndex];
    }

    async deletePostOffline(postId) {
        // Remover da lista local
        const posts = this.getOfflinePosts();
        const filtered = posts.filter(p => p.id !== postId);
        await this.cachePostsForOffline(filtered);

        // Adicionar à fila de sync
        await this.queueAction({
            type: 'delete_post',
            data: { id: postId }
        });

        return true;
    }
}

// Export
export default OfflineCacheManager;
