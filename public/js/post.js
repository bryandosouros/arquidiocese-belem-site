import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBUuKIfxUXGHIPH2eQBwUggWawexQ3-L5A",
    authDomain: "belem-hb.firebaseapp.com",
    projectId: "belem-hb",
    storageBucket: "belem-hb.firebasestorage.app",
    messagingSenderId: "669142237239",
    appId: "1:669142237239:web:9fa0de02efe4da6865ffb2",
    measurementId: "G-92E26Y6HB1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Load and display post
async function loadPost() {
    if (!postId) {
        showError('Post não encontrado');
        return;
    }

    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const post = docSnap.data();
            renderPost(post);
        } else {
            showError('Post não encontrado');
        }
    } catch (error) {
        console.error('Error loading post:', error);
        showError('Erro ao carregar o post');
    }
}

function renderPost(post) {
    // Update page meta using SEO Manager if available
    const pageTitle = `${post.title} - Arquidiocese de Belém do Pará`;
    const pageDescription = post.metaDescription || post.excerpt || extractExcerpt(post.content) || 'Arquidiocese de Belém do Pará';
    const pageKeywords = post.tags ? post.tags.concat(['Arquidiocese', 'Belém', 'Pará']) : ['Arquidiocese', 'Belém', 'Pará', 'Igreja Católica'];
    
    // Update traditional meta tags
    document.getElementById('post-title-meta').textContent = pageTitle;
    document.getElementById('post-description-meta').content = pageDescription;
    
    // Use SEO Manager for comprehensive SEO updates
    if (window.seoManager) {
        window.seoManager.updatePageSEO({
            title: pageTitle,
            description: pageDescription,
            keywords: pageKeywords,
            author: post.author || 'Arquidiocese de Belém do Pará',
            image: post.image || `${window.location.origin}/images/logo-arquidiocese-belem.png`,
            structuredData: {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": post.title,
                "description": pageDescription,
                "author": {
                    "@type": "Organization",
                    "name": post.author || "Arquidiocese de Belém do Pará"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "Arquidiocese de Belém do Pará",
                    "logo": {
                        "@type": "ImageObject",
                        "url": `${window.location.origin}/images/logo-arquidiocese-belem.png`
                    }
                },
                "datePublished": post.createdAt ? new Date(post.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
                "dateModified": post.updatedAt ? new Date(post.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": window.location.href
                },
                "image": post.image || `${window.location.origin}/images/logo-arquidiocese-belem.png`,
                "articleSection": post.category || "Religious",
                "inLanguage": "pt-BR"
            }
        });
    } else {
        // Fallback to manual meta tag updates
        updateFallbackMetaTags(post);
    }

    // Update SEO meta tags
    if (typeof window.updatePostSEO === 'function') {
        window.updatePostSEO({
            id: postId,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || extractExcerpt(post.content),
            featuredImage: post.featuredImage,
            category: post.category,
            tags: post.tags,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            publishedAt: post.publishedAt || post.createdAt
        });
    }

    // Render post content
    const container = document.getElementById('post-container');
    container.innerHTML = `
        <header class="post-header">
            <div class="post-breadcrumb">
                <a href="index.html">Início</a>
                <span class="breadcrumb-separator">›</span>
                <a href="index.html#noticias">Notícias</a>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">${getCategoryLabel(post.category)}</span>
            </div>
            
            <div class="post-meta">
                <span class="post-category ${post.category}">${getCategoryLabel(post.category)}</span>
                <time class="post-date">${formatDate(post.createdAt)}</time>
                ${post.priority && post.priority !== 'normal' ? `<span class="post-priority ${post.priority}">${getPriorityLabel(post.priority)}</span>` : ''}
            </div>
            
            <h1 class="post-title">${post.title}</h1>
            
            ${post.excerpt ? `<div class="post-excerpt">${post.excerpt}</div>` : ''}
            
            ${post.featuredImage ? `
                <div class="post-featured-image">
                    <img src="${post.featuredImage}" alt="${post.title}">
                </div>
            ` : ''}
        </header>
        
        <div class="post-body">
            ${post.content || '<p>Conteúdo não disponível.</p>'}
        </div>
        
        ${post.tags && post.tags.length > 0 ? `
            <footer class="post-footer">
                <div class="post-tags">
                    <span class="tags-label">Tags:</span>
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </footer>
        ` : ''}
        
        <div class="post-navigation">
            <a href="index.html#noticias-recentes" class="btn-back">← Voltar às Notícias</a>
        </div>
    `;
}

function updateFallbackMetaTags(post) {
    // Manual meta tag updates when SEO Manager is not available
    const pageDescription = post.metaDescription || post.excerpt || extractExcerpt(post.content) || 'Arquidiocese de Belém do Pará';
    
    // Update Open Graph
    document.getElementById('og-title').content = `${post.title} - Arquidiocese de Belém do Pará`;
    document.getElementById('og-description').content = pageDescription;
    document.getElementById('og-url').content = window.location.href;
    document.getElementById('og-image').content = post.image || `${window.location.origin}/images/logo-arquidiocese-belem.png`;
    
    // Update Twitter Cards
    document.getElementById('twitter-title').content = `${post.title} - Arquidiocese de Belém do Pará`;
    document.getElementById('twitter-description').content = pageDescription;
    document.getElementById('twitter-image').content = post.image || `${window.location.origin}/images/logo-arquidiocese-belem.png`;
    
    // Update Structured Data
    const structuredDataScript = document.getElementById('structured-data');
    if (structuredDataScript) {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": pageDescription,
            "author": {
                "@type": "Organization",
                "name": post.author || "Arquidiocese de Belém do Pará"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Arquidiocese de Belém do Pará",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${window.location.origin}/images/logo-arquidiocese-belem.png`
                }
            },
            "datePublished": post.createdAt ? new Date(post.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
            "dateModified": post.updatedAt ? new Date(post.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            },
            "image": post.image || `${window.location.origin}/images/logo-arquidiocese-belem.png`
        };
        structuredDataScript.textContent = JSON.stringify(structuredData, null, 2);
    }
}

function showError(message) {
    const container = document.getElementById('post-container');
    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h2>Oops! Algo deu errado</h2>
            <p>${message}</p>
            <a href="index.html" class="btn-primary">Voltar ao Início</a>
        </div>
    `;
}

function getCategoryLabel(category) {
    const labels = {
        'decretos': 'Decretos',
        'comunicados': 'Comunicados',
        'noticias': 'Notícias',
        'homilias': 'Homilias'
    };
    return labels[category] || 'Notícias';
}

function getPriorityLabel(priority) {
    const labels = {
        'high': 'Alta Prioridade',
        'normal': 'Prioridade Normal',
        'low': 'Baixa Prioridade'
    };
    return labels[priority] || priority;
}

function formatDate(date) {
    if (!date) return '';
    
    let dateObj;
    if (date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    } else {
        dateObj = new Date(date);
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function extractExcerpt(content) {
    if (!content) return 'Clique para ler o conteúdo completo...';
    
    // Remove HTML tags e pega os primeiros 200 caracteres
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > 200 ? 
        textContent.substring(0, 200) + '...' : 
        textContent;
}

// Load post when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPost();
    
    // Update footer year
    document.getElementById('ano-atual').textContent = new Date().getFullYear();
});
