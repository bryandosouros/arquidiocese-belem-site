// Content Strategy Module - Release 3B
// Multi-Site Content Management and Strategy

import { db } from './firebase-config.js';
import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

class ContentStrategy {
    constructor() {
        this.sites = ['arquidiocese', 'rcc', 'shalom'];
        this.categories = [
            'liturgia', 'catequese', 'juventude', 'familia', 
            'caridade', 'evangelizacao', 'espiritualidade', 'eventos'
        ];
        this.locations = [
            'belem', 'ananindeua', 'marituba', 'benevides',
            'santa-barbara', 'santo-antonio-taua', 'vigia'
        ];
    }

    // Content Sharing System
    async shareContent(postId, targetSites = [], options = {}) {
        try {
            console.log(`Sharing content ${postId} to sites:`, targetSites);
            
            const shareData = {
                originalPostId: postId,
                targetSites: targetSites,
                sharedAt: new Date(),
                sharedBy: options.userId || 'system',
                adaptations: options.adaptations || {},
                status: 'pending_approval'
            };

            const shareRef = await addDoc(collection(db, 'content_shares'), shareData);
            
            // Create pending posts for each target site
            for (const site of targetSites) {
                await this.createPendingPost(postId, site, shareRef.id);
            }

            return {
                success: true,
                shareId: shareRef.id,
                message: `Content shared to ${targetSites.length} sites`
            };
        } catch (error) {
            console.error('Error sharing content:', error);
            return { success: false, error: error.message };
        }
    }

    async createPendingPost(originalPostId, targetSite, shareId) {
        try {
            // Get original post
            const originalPost = await this.getPostById(originalPostId);
            if (!originalPost) throw new Error('Original post not found');

            const pendingPost = {
                ...originalPost,
                originalId: originalPostId,
                shareId: shareId,
                targetSite: targetSite,
                status: 'pending_approval',
                createdAt: new Date(),
                workflowStage: 'content_review'
            };

            delete pendingPost.id; // Remove original ID
            
            const pendingRef = await addDoc(collection(db, 'pending_posts'), pendingPost);
            console.log(`Pending post created for ${targetSite}:`, pendingRef.id);
            
            return pendingRef.id;
        } catch (error) {
            console.error('Error creating pending post:', error);
            throw error;
        }
    }

    // Advanced Taxonomies System
    async addTaxonomy(postId, taxonomies) {
        try {
            const taxonomyData = {
                postId: postId,
                categories: taxonomies.categories || [],
                tags: taxonomies.tags || [],
                locations: taxonomies.locations || [],
                customFields: taxonomies.customFields || {},
                updatedAt: new Date()
            };

            // Check if taxonomy already exists
            const existingQuery = query(
                collection(db, 'post_taxonomies'),
                where('postId', '==', postId)
            );
            const existingDocs = await getDocs(existingQuery);

            if (existingDocs.empty) {
                await addDoc(collection(db, 'post_taxonomies'), taxonomyData);
            } else {
                const docRef = existingDocs.docs[0].ref;
                await updateDoc(docRef, taxonomyData);
            }

            return { success: true, message: 'Taxonomies updated successfully' };
        } catch (error) {
            console.error('Error adding taxonomy:', error);
            return { success: false, error: error.message };
        }
    }

    async getPostsByTaxonomy(filters = {}) {
        try {
            let q = collection(db, 'posts');
            
            if (filters.category) {
                q = query(q, where('category', '==', filters.category));
            }
            
            if (filters.location) {
                q = query(q, where('location', '==', filters.location));
            }

            if (filters.site) {
                q = query(q, where('site', '==', filters.site));
            }

            q = query(q, orderBy('createdAt', 'desc'));
            
            const querySnapshot = await getDocs(q);
            const posts = [];
            
            querySnapshot.forEach((doc) => {
                posts.push({ id: doc.id, ...doc.data() });
            });

            return posts;
        } catch (error) {
            console.error('Error getting posts by taxonomy:', error);
            return [];
        }
    }

    // Approval Workflow System
    async initiateApprovalWorkflow(postId, workflowType = 'standard') {
        try {
            const workflowStages = this.getWorkflowStages(workflowType);
            
            const workflowData = {
                postId: postId,
                type: workflowType,
                stages: workflowStages,
                currentStage: 0,
                status: 'in_progress',
                createdAt: new Date(),
                approvals: [],
                rejections: []
            };

            const workflowRef = await addDoc(collection(db, 'approval_workflows'), workflowData);
            
            // Update post status
            await this.updatePostStatus(postId, 'pending_approval');
            
            return {
                success: true,
                workflowId: workflowRef.id,
                message: 'Approval workflow initiated'
            };
        } catch (error) {
            console.error('Error initiating approval workflow:', error);
            return { success: false, error: error.message };
        }
    }

    getWorkflowStages(type) {
        const workflows = {
            standard: [
                { name: 'content_review', required: true, role: 'editor' },
                { name: 'pastoral_approval', required: true, role: 'pastor' },
                { name: 'final_review', required: false, role: 'admin' }
            ],
            urgent: [
                { name: 'content_review', required: true, role: 'editor' },
                { name: 'pastoral_approval', required: true, role: 'pastor' }
            ],
            multi_site: [
                { name: 'content_review', required: true, role: 'editor' },
                { name: 'site_adaptation', required: true, role: 'site_manager' },
                { name: 'pastoral_approval', required: true, role: 'pastor' },
                { name: 'final_review', required: true, role: 'admin' }
            ]
        };
        
        return workflows[type] || workflows.standard;
    }

    async processApproval(workflowId, stageIndex, approved, userId, comments = '') {
        try {
            const workflowRef = doc(db, 'approval_workflows', workflowId);
            const workflowDoc = await this.getWorkflowById(workflowId);
            
            if (!workflowDoc) throw new Error('Workflow not found');

            const approval = {
                stageIndex: stageIndex,
                approved: approved,
                userId: userId,
                comments: comments,
                timestamp: new Date()
            };

            const updates = {};
            
            if (approved) {
                updates[`approvals`] = [...(workflowDoc.approvals || []), approval];
                
                // Check if this was the last stage
                if (stageIndex === workflowDoc.stages.length - 1) {
                    updates.status = 'approved';
                    updates.completedAt = new Date();
                    
                    // Approve the post
                    await this.updatePostStatus(workflowDoc.postId, 'published');
                } else {
                    updates.currentStage = stageIndex + 1;
                }
            } else {
                updates[`rejections`] = [...(workflowDoc.rejections || []), approval];
                updates.status = 'rejected';
                updates.completedAt = new Date();
                
                // Reject the post
                await this.updatePostStatus(workflowDoc.postId, 'rejected');
            }

            await updateDoc(workflowRef, updates);
            
            return {
                success: true,
                message: approved ? 'Approval processed' : 'Content rejected'
            };
        } catch (error) {
            console.error('Error processing approval:', error);
            return { success: false, error: error.message };
        }
    }

    // Smart Scheduling System
    async scheduleContent(postId, scheduleData) {
        try {
            const schedule = {
                postId: postId,
                publishAt: new Date(scheduleData.publishAt),
                sites: scheduleData.sites || ['arquidiocese'],
                autoPromote: scheduleData.autoPromote || false,
                promotionChannels: scheduleData.promotionChannels || [],
                recurringPattern: scheduleData.recurringPattern || null,
                timezone: scheduleData.timezone || 'America/Belem',
                status: 'scheduled',
                createdAt: new Date()
            };

            const scheduleRef = await addDoc(collection(db, 'content_schedule'), schedule);
            
            // Update post status
            await this.updatePostStatus(postId, 'scheduled');
            
            return {
                success: true,
                scheduleId: scheduleRef.id,
                message: 'Content scheduled successfully'
            };
        } catch (error) {
            console.error('Error scheduling content:', error);
            return { success: false, error: error.message };
        }
    }

    async getScheduledContent(filters = {}) {
        try {
            let q = collection(db, 'content_schedule');
            
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            
            if (filters.site) {
                q = query(q, where('sites', 'array-contains', filters.site));
            }

            q = query(q, orderBy('publishAt', 'asc'));
            
            const querySnapshot = await getDocs(q);
            const scheduled = [];
            
            querySnapshot.forEach((doc) => {
                scheduled.push({ id: doc.id, ...doc.data() });
            });

            return scheduled;
        } catch (error) {
            console.error('Error getting scheduled content:', error);
            return [];
        }
    }

    // Content Analytics and Insights
    async getContentInsights(filters = {}) {
        try {
            const insights = {
                totalPosts: 0,
                postsBySite: {},
                postsByCategory: {},
                postsByLocation: {},
                engagementMetrics: {},
                sharingMetrics: {}
            };

            // Get posts with filters
            const posts = await this.getPostsByTaxonomy(filters);
            insights.totalPosts = posts.length;

            // Analyze by site
            posts.forEach(post => {
                const site = post.site || 'arquidiocese';
                insights.postsBySite[site] = (insights.postsBySite[site] || 0) + 1;
            });

            // Analyze by category
            posts.forEach(post => {
                const category = post.category || 'geral';
                insights.postsByCategory[category] = (insights.postsByCategory[category] || 0) + 1;
            });

            // Get sharing metrics
            const sharesQuery = await getDocs(collection(db, 'content_shares'));
            insights.sharingMetrics.totalShares = sharesQuery.size;

            return insights;
        } catch (error) {
            console.error('Error getting content insights:', error);
            return null;
        }
    }

    // Helper methods
    async getPostById(postId) {
        try {
            const postDoc = await doc(db, 'posts', postId);
            const postSnapshot = await postDoc.get();
            
            if (postSnapshot.exists()) {
                return { id: postSnapshot.id, ...postSnapshot.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting post by ID:', error);
            return null;
        }
    }

    async getWorkflowById(workflowId) {
        try {
            const workflowDoc = await doc(db, 'approval_workflows', workflowId);
            const workflowSnapshot = await workflowDoc.get();
            
            if (workflowSnapshot.exists()) {
                return { id: workflowSnapshot.id, ...workflowSnapshot.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting workflow by ID:', error);
            return null;
        }
    }

    async updatePostStatus(postId, status) {
        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, { 
                status: status,
                statusUpdatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Error updating post status:', error);
            return false;
        }
    }

    // Real-time listeners
    setupContentShareListener(callback) {
        const q = query(
            collection(db, 'content_shares'),
            orderBy('sharedAt', 'desc')
        );
        
        return onSnapshot(q, (snapshot) => {
            const shares = [];
            snapshot.forEach((doc) => {
                shares.push({ id: doc.id, ...doc.data() });
            });
            callback(shares);
        });
    }

    setupWorkflowListener(callback) {
        const q = query(
            collection(db, 'approval_workflows'),
            where('status', '==', 'in_progress'),
            orderBy('createdAt', 'desc')
        );
        
        return onSnapshot(q, (snapshot) => {
            const workflows = [];
            snapshot.forEach((doc) => {
                workflows.push({ id: doc.id, ...doc.data() });
            });
            callback(workflows);
        });
    }
}

// Export the ContentStrategy class
export default ContentStrategy;
