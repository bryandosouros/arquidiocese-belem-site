// Test data and demo functions for Content Strategy - Release 3B
// This file provides test data and demo functionality to showcase the multi-site content strategy

import ContentStrategy from './content-strategy.js';

class ContentStrategyDemo {
    constructor() {
        this.contentStrategy = new ContentStrategy();
        this.demoData = this.generateDemoData();
    }

    generateDemoData() {
        return {
            posts: [
                {
                    id: 'demo-post-1',
                    title: 'Homilia do Domingo da Palavra de Deus',
                    content: 'Refletindo sobre a importância da Palavra de Deus em nossas vidas...',
                    category: 'liturgia',
                    site: 'arquidiocese',
                    status: 'published',
                    author: 'Dom Alberto Taveira',
                    tags: ['liturgia', 'homilia', 'palavra-de-deus'],
                    location: 'belem',
                    createdAt: new Date('2024-01-15'),
                    publishedAt: new Date('2024-01-15')
                },
                {
                    id: 'demo-post-2',
                    title: 'Formação para Jovens - Identidade Cristã',
                    content: 'Como viver nossa identidade cristã no mundo atual...',
                    category: 'juventude',
                    site: 'rcc',
                    status: 'published',
                    author: 'Pe. João Silva',
                    tags: ['juventude', 'formacao', 'identidade'],
                    location: 'ananindeua',
                    createdAt: new Date('2024-01-10'),
                    publishedAt: new Date('2024-01-10')
                },
                {
                    id: 'demo-post-3',
                    title: 'Encontro de Casais - Fortalecendo a Família',
                    content: 'A importância do amor de Deus na vida familiar...',
                    category: 'familia',
                    site: 'shalom',
                    status: 'published',
                    author: 'Comunidade Shalom',
                    tags: ['familia', 'casais', 'amor'],
                    location: 'belem',
                    createdAt: new Date('2024-01-08'),
                    publishedAt: new Date('2024-01-08')
                }
            ],
            shares: [
                {
                    id: 'demo-share-1',
                    originalPostId: 'demo-post-1',
                    targetSites: ['rcc', 'shalom'],
                    status: 'pending_approval',
                    sharedAt: new Date('2024-01-16'),
                    sharedBy: 'admin@arquidiocese.org',
                    adaptations: {
                        rcc: 'Adaptar linguagem para jovens',
                        shalom: 'Adicionar enfoque familiar'
                    }
                },
                {
                    id: 'demo-share-2',
                    originalPostId: 'demo-post-2',
                    targetSites: ['arquidiocese'],
                    status: 'approved',
                    sharedAt: new Date('2024-01-12'),
                    sharedBy: 'rcc@admin.org',
                    adaptations: {
                        arquidiocese: 'Expandir conteúdo para todas as idades'
                    }
                }
            ],
            workflows: [
                {
                    id: 'demo-workflow-1',
                    postId: 'demo-post-1',
                    type: 'multi_site',
                    status: 'in_progress',
                    currentStage: 1,
                    stages: [
                        { name: 'content_review', required: true, role: 'editor' },
                        { name: 'site_adaptation', required: true, role: 'site_manager' },
                        { name: 'pastoral_approval', required: true, role: 'pastor' },
                        { name: 'final_review', required: true, role: 'admin' }
                    ],
                    createdAt: new Date('2024-01-16'),
                    approvals: [
                        {
                            stageIndex: 0,
                            approved: true,
                            userId: 'editor@arquidiocese.org',
                            comments: 'Conteúdo aprovado para compartilhamento',
                            timestamp: new Date('2024-01-16T10:00:00')
                        }
                    ]
                },
                {
                    id: 'demo-workflow-2',
                    postId: 'demo-post-4',
                    type: 'standard',
                    status: 'approved',
                    currentStage: 2,
                    stages: [
                        { name: 'content_review', required: true, role: 'editor' },
                        { name: 'pastoral_approval', required: true, role: 'pastor' },
                        { name: 'final_review', required: false, role: 'admin' }
                    ],
                    createdAt: new Date('2024-01-14'),
                    completedAt: new Date('2024-01-15'),
                    approvals: [
                        {
                            stageIndex: 0,
                            approved: true,
                            userId: 'editor@arquidiocese.org',
                            comments: 'Conteúdo revisado e aprovado',
                            timestamp: new Date('2024-01-14T14:00:00')
                        },
                        {
                            stageIndex: 1,
                            approved: true,
                            userId: 'pastor@arquidiocese.org',
                            comments: 'Aprovação pastoral concedida',
                            timestamp: new Date('2024-01-15T09:00:00')
                        }
                    ]
                }
            ],
            scheduled: [
                {
                    id: 'demo-schedule-1',
                    postId: 'demo-post-5',
                    publishAt: new Date('2024-01-20T08:00:00'),
                    sites: ['arquidiocese', 'rcc'],
                    autoPromote: true,
                    promotionChannels: ['email', 'social'],
                    status: 'scheduled',
                    createdAt: new Date('2024-01-18')
                },
                {
                    id: 'demo-schedule-2',
                    postId: 'demo-post-6',
                    publishAt: new Date('2024-01-25T19:00:00'),
                    sites: ['shalom'],
                    autoPromote: false,
                    recurringPattern: 'weekly',
                    status: 'scheduled',
                    createdAt: new Date('2024-01-18')
                }
            ]
        };
    }

    // Demo functions to showcase functionality
    async runContentSharingDemo() {
        console.log('🌐 Executando demonstração de compartilhamento de conteúdo...');
        
        try {
            // Simulate content sharing
            const result = await this.contentStrategy.shareContent(
                'demo-post-1',
                ['rcc', 'shalom'],
                {
                    userId: 'admin@arquidiocese.org',
                    adaptations: {
                        rcc: 'Adaptar para linguagem jovem',
                        shalom: 'Enfoque familiar'
                    }
                }
            );
            
            console.log('✅ Resultado do compartilhamento:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro na demonstração:', error);
            return { success: false, error: error.message };
        }
    }

    async runTaxonomyDemo() {
        console.log('🏷️ Executando demonstração de taxonomias...');
        
        try {
            // Add taxonomies to a post
            const result = await this.contentStrategy.addTaxonomy('demo-post-1', {
                categories: ['liturgia', 'formacao'],
                tags: ['domingo', 'palavra-de-deus', 'reflexao'],
                locations: ['belem', 'ananindeua'],
                customFields: {
                    targetAudience: 'todos-os-fieis',
                    difficultyLevel: 'iniciante',
                    duration: '45-minutos'
                }
            });
            
            console.log('✅ Taxonomias adicionadas:', result);
            
            // Search by taxonomy
            const posts = await this.contentStrategy.getPostsByTaxonomy({
                category: 'liturgia',
                location: 'belem'
            });
            
            console.log('🔍 Posts encontrados por taxonomia:', posts.length);
            return { taxonomyResult: result, postsFound: posts.length };
        } catch (error) {
            console.error('❌ Erro na demonstração de taxonomias:', error);
            return { success: false, error: error.message };
        }
    }

    async runWorkflowDemo() {
        console.log('⚡ Executando demonstração de workflow de aprovação...');
        
        try {
            // Initiate approval workflow
            const workflowResult = await this.contentStrategy.initiateApprovalWorkflow(
                'demo-post-new',
                'multi_site'
            );
            
            console.log('✅ Workflow iniciado:', workflowResult);
            
            if (workflowResult.success) {
                // Simulate approval process
                const approvalResult = await this.contentStrategy.processApproval(
                    workflowResult.workflowId,
                    0, // First stage
                    true, // Approved
                    'editor@arquidiocese.org',
                    'Conteúdo aprovado para compartilhamento multi-site'
                );
                
                console.log('✅ Primeira aprovação processada:', approvalResult);
                return { workflowResult, approvalResult };
            }
            
            return workflowResult;
        } catch (error) {
            console.error('❌ Erro na demonstração de workflow:', error);
            return { success: false, error: error.message };
        }
    }

    async runSchedulingDemo() {
        console.log('⏰ Executando demonstração de agendamento...');
        
        try {
            // Schedule content
            const scheduleResult = await this.contentStrategy.scheduleContent('demo-post-new', {
                publishAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                sites: ['arquidiocese', 'rcc'],
                autoPromote: true,
                promotionChannels: ['email', 'newsletter'],
                timezone: 'America/Belem'
            });
            
            console.log('✅ Conteúdo agendado:', scheduleResult);
            
            // Get scheduled content
            const scheduled = await this.contentStrategy.getScheduledContent({
                status: 'scheduled'
            });
            
            console.log('📅 Conteúdo agendado encontrado:', scheduled.length);
            return { scheduleResult, scheduledCount: scheduled.length };
        } catch (error) {
            console.error('❌ Erro na demonstração de agendamento:', error);
            return { success: false, error: error.message };
        }
    }

    async runAnalyticsDemo() {
        console.log('📊 Executando demonstração de analytics...');
        
        try {
            const insights = await this.contentStrategy.getContentInsights({
                site: 'arquidiocese'
            });
            
            console.log('✅ Insights de conteúdo:', insights);
            
            return insights;
        } catch (error) {
            console.error('❌ Erro na demonstração de analytics:', error);
            return { success: false, error: error.message };
        }
    }

    // Run all demos
    async runFullDemo() {
        console.log('🚀 Iniciando demonstração completa da Estratégia de Conteúdo Multi-Site');
        console.log('════════════════════════════════════════════════════════════════');
        
        const results = {
            sharing: await this.runContentSharingDemo(),
            taxonomy: await this.runTaxonomyDemo(),
            workflow: await this.runWorkflowDemo(),
            scheduling: await this.runSchedulingDemo(),
            analytics: await this.runAnalyticsDemo()
        };
        
        console.log('════════════════════════════════════════════════════════════════');
        console.log('✅ Demonstração completa finalizada!');
        console.log('📋 Resumo dos resultados:', results);
        
        return results;
    }

    // Generate sample data for UI testing
    generateSampleUIData() {
        return {
            recentActivities: [
                {
                    type: 'share',
                    message: 'Homilia compartilhada para RCC e Shalom',
                    timestamp: new Date(),
                    user: 'Dom Alberto'
                },
                {
                    type: 'approval',
                    message: 'Decreto aprovado no workflow pastoral',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    user: 'Pe. João'
                },
                {
                    type: 'schedule',
                    message: 'Evento agendado para publicação automática',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                    user: 'Admin'
                }
            ],
            pendingApprovals: [
                {
                    id: 'approval-1',
                    title: 'Comunicado sobre Quaresma',
                    stage: 'Aprovação Pastoral',
                    timeWaiting: '2 horas',
                    priority: 'high'
                },
                {
                    id: 'approval-2',
                    title: 'Formação para Catequistas',
                    stage: 'Revisão de Conteúdo',
                    timeWaiting: '1 dia',
                    priority: 'normal'
                }
            ],
            upcomingScheduled: [
                {
                    id: 'schedule-1',
                    title: 'Missa de Abertura da Quaresma',
                    publishTime: '2024-01-20 08:00',
                    sites: ['Arquidiocese', 'RCC']
                },
                {
                    id: 'schedule-2',
                    title: 'Retiro para Jovens',
                    publishTime: '2024-01-25 19:00',
                    sites: ['Shalom']
                }
            ]
        };
    }
}

// Export demo class
export default ContentStrategyDemo;

// Auto-run demo if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.contentStrategyDemo = new ContentStrategyDemo();
    console.log('🎯 Content Strategy Demo loaded! Run window.contentStrategyDemo.runFullDemo() to test all features.');
}
