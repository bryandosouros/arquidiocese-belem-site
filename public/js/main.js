// public/js/main.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';
import OfflineCacheManager from './offline-cache-manager.js';

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

// PWA Integration
let pwaManager = null;
let notificationSystem = null;
let offlineCacheManager = null;

console.log("JavaScript Carregado - Arquidiocese HB V4.0 - PWA Release 4B!");

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing main application with PWA support...');
    
    // Initialize PWA modules
    initializePWAModules();
    
    // Atualiza o ano no rodapé
    const anoAtualSpan = document.getElementById('ano-atual');
    if (anoAtualSpan) {
        anoAtualSpan.textContent = new Date().getFullYear();
    }

    // Mobile-Enhanced Navigation Logic
    const menuHamburger = document.querySelector('.menu-hamburger');
    const menuListaPrincipal = document.getElementById('menu-lista-principal');
    const navegacaoPrincipal = document.querySelector('.navegacao-principal');
    const body = document.body;

    if (menuHamburger && menuListaPrincipal && navegacaoPrincipal) {
        // Create mobile overlay if it doesn't exist
        let navOverlay = navegacaoPrincipal.querySelector('.nav-overlay');
        if (!navOverlay) {
            navOverlay = document.createElement('div');
            navOverlay.className = 'nav-overlay';
            navegacaoPrincipal.appendChild(navOverlay);
        }

        // Enhanced mobile menu toggle
        function toggleMobileMenu() {
            const isExpanded = menuHamburger.getAttribute('aria-expanded') === 'true';
            const isOpening = !isExpanded;

            menuHamburger.setAttribute('aria-expanded', String(isOpening));
            menuHamburger.classList.toggle('ativo', isOpening);
            menuListaPrincipal.classList.toggle('aberto', isOpening);
            navOverlay.classList.toggle('open', isOpening);

            // Prevent body scroll when menu is open
            body.style.overflow = isOpening ? 'hidden' : '';
            
            // Manage focus for accessibility
            if (isOpening) {
                const firstMenuItem = menuListaPrincipal.querySelector('a');
                if (firstMenuItem) {
                    setTimeout(() => firstMenuItem.focus(), 300);
                }
            }
        }

        // Menu button click handler
        menuHamburger.addEventListener('click', toggleMobileMenu);

        // Overlay click handler
        navOverlay.addEventListener('click', toggleMobileMenu);

        // Enhanced keyboard navigation
        menuHamburger.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMobileMenu();
            }
        });

        // Close menu when clicking menu items (mobile)
        menuListaPrincipal.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 1200) { // Mobile breakpoint
                    setTimeout(toggleMobileMenu, 100); // Small delay for smooth UX
                }
            });
        });

        // Enhanced escape key handler
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuListaPrincipal.classList.contains('aberto')) {
                toggleMobileMenu();
                menuHamburger.focus();
            }
        });

        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 1200 && menuListaPrincipal.classList.contains('aberto')) {
                toggleMobileMenu();
            }
        });
    }

    // Lógica para o Carrossel da Hero Section
    const slidesContainer = document.querySelector('.hero-slides-container');
    if (slidesContainer) {
        const slides = slidesContainer.querySelectorAll('.hero-slide');
        const indicators = document.querySelectorAll('.hero-indicator');
        const prevButton = document.querySelector('.hero-prev');
        const nextButton = document.querySelector('.hero-next');
        
        let currentSlide = 0;
        const slideInterval = 5000;
        let autoSlideTimer;

        if (slides.length > 0) {
            // Função para mostrar o slide
            function mostrarSlide(index) {
                slides.forEach((slide, i) => {
                    slide.classList.remove('slide-ativo');
                    slide.setAttribute('aria-hidden', 'true');
                });
                
                // Atualizar indicadores
                indicators.forEach((indicator, i) => {
                    indicator.classList.toggle('ativo', i === index);
                    indicator.setAttribute('aria-pressed', i === index ? 'true' : 'false');
                });
                
                slides[index].classList.add('slide-ativo');
                slides[index].setAttribute('aria-hidden', 'false');
                currentSlide = index;
            }

            // Função para o próximo slide
            function proximoSlide() {
                currentSlide = (currentSlide + 1) % slides.length;
                mostrarSlide(currentSlide);
            }

            // Função para slide anterior
            function slideAnterior() {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                mostrarSlide(currentSlide);
            }

            // Iniciar auto-rotação
            function iniciarAutoSlide() {
                if (slides.length > 1) {
                    autoSlideTimer = setInterval(proximoSlide, slideInterval);
                }
            }

            // Parar auto-rotação
            function pararAutoSlide() {
                if (autoSlideTimer) {
                    clearInterval(autoSlideTimer);
                }
            }

            // Event listeners para indicadores
            indicators.forEach((indicator, index) => {
                indicator.setAttribute('aria-label', `Ir para slide ${index + 1}`);
                indicator.setAttribute('aria-pressed', 'false');
                indicator.addEventListener('click', () => {
                    pararAutoSlide();
                    mostrarSlide(index);
                    iniciarAutoSlide();
                });
            });

            // Event listeners para controles de navegação
            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    pararAutoSlide();
                    slideAnterior();
                    iniciarAutoSlide();
                });
            }

            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    pararAutoSlide();
                    proximoSlide();
                    iniciarAutoSlide();
                });
            }

            // Pausar no hover
            slidesContainer.addEventListener('mouseenter', pararAutoSlide);
            slidesContainer.addEventListener('mouseleave', iniciarAutoSlide);

            // Navegação por teclado
            slidesContainer.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    pararAutoSlide();
                    slideAnterior();
                    iniciarAutoSlide();
                } else if (e.key === 'ArrowRight') {
                    pararAutoSlide();
                    proximoSlide();
                    iniciarAutoSlide();
                }
            });

            // Tornar o container focável para navegação por teclado
            slidesContainer.setAttribute('tabindex', '0');
            slidesContainer.setAttribute('role', 'region');
            slidesContainer.setAttribute('aria-label', 'Carrossel de destaques');

            // Inicializar
            mostrarSlide(0);
            iniciarAutoSlide();
        }
    }

    // Load dynamic news from Firestore
    // Initialize Offline Manager
    const offlineManager = new OfflineCacheManager();

    async function loadNews() {
        console.log('🔄 Iniciando carregamento de notícias...');
        
        // Verificar se está online
        if (!navigator.onLine) {
            console.log('📴 Offline mode - loading cached posts');
            const cachedPosts = offlineManager.getOfflinePosts();
            if (cachedPosts.length > 0) {
                renderNews(cachedPosts.slice(0, 6));
                return;
            }
        }
        
        try {
            // Buscar posts ordenados por data de criação (compatível com admin.js atual)
            const q = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'),
                limit(6)
            );
            
            console.log('📡 Executando query no Firestore...');
            const querySnapshot = await getDocs(q);
            const posts = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log('📄 Post encontrado:', { id: doc.id, title: data.title, status: data.status });
                // Incluir posts publicados ou que não tenham status definido (para compatibilidade)
                if (!data.status || data.status === 'published') {
                    posts.push({ id: doc.id, ...data });
                }
            });
            
            console.log(`✅ Total de posts válidos encontrados: ${posts.length}`);
            
            if (posts.length > 0) {
                renderNews(posts);
                // Cache posts for offline use
                await offlineManager.cachePostsForOffline(posts);
            } else {
                console.log('⚠️ Nenhum post encontrado. Tentando cache offline...');
                const cachedPosts = offlineManager.getOfflinePosts();
                if (cachedPosts.length > 0) {
                    renderNews(cachedPosts.slice(0, 6));
                }
            }
        } catch (error) {
            console.error('❌ Error loading news:', error);
            console.log('🔄 Tentando carregar do cache offline...');
            
            const cachedPosts = offlineManager.getOfflinePosts();
            if (cachedPosts.length > 0) {
                renderNews(cachedPosts.slice(0, 6));
            } else {
                console.log('📰 Mantendo cards estáticos como fallback.');
            }
        }
    }

    function renderNews(posts) {
        const newsGrid = document.querySelector('.news-grid') || document.getElementById('news-container');
        if (!newsGrid) return;
        
        // Limpar mensagem de loading
        newsGrid.innerHTML = '';
        
        newsGrid.innerHTML = posts.map(post => `
            <article class="news-card ${post.offline ? 'offline-card' : ''}">
                ${post.offline ? '<div class="offline-badge">📴 Offline</div>' : ''}
                <a href="post.html?id=${post.id}" class="card-link-area">
                    ${post.featuredImage ? 
                        `<img src="${post.featuredImage}" alt="${post.title}" class="news-card-image">` :
                        `<div class="news-card-placeholder"></div>`
                    }
                    <div class="news-content">
                        <span class="news-category">${getCategoryLabel(post.category)}</span>
                        <h3 class="news-title">${post.title}</h3>
                        <p class="news-excerpt">${post.excerpt || extractExcerpt(post.content)}</p>
                        <div class="news-date">${formatPostDate(post.createdAt)}</div>
                    </div>
                </a>
                <div class="news-footer">
                    <a href="post.html?id=${post.id}" class="news-link">Leia mais <i class="fas fa-arrow-right"></i></a>
                </div>
            </article>
        `).join('');
        
        const totalPosts = posts.length;
        const offlinePosts = posts.filter(p => p.offline).length;
        
        if (offlinePosts > 0) {
            console.log(`📱 ${totalPosts} posts carregados (${offlinePosts} do cache offline)`);
        } else {
            console.log(`✅ ${totalPosts} posts carregados dinamicamente da rede!`);
        }
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

    function extractExcerpt(content) {
        if (!content) return 'Clique para ler o conteúdo completo...';
        
        // Remove HTML tags e pega os primeiros 150 caracteres
        const textContent = content.replace(/<[^>]*>/g, '');
        return textContent.length > 150 ? 
            textContent.substring(0, 150) + '...' : 
            textContent;
    }

    function formatPostDate(timestamp) {
        if (!timestamp) return 'Data não disponível';
        
        let date;
        if (timestamp.seconds) {
            // Firestore timestamp
            date = new Date(timestamp.seconds * 1000);
        } else {
            // JavaScript Date
            date = new Date(timestamp);
        }
        
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Initialize news loading
    loadNews();
});

// PWA Initialization Functions
async function initializePWAModules() {
    try {
        console.log('📱 Loading PWA modules...');
        
        // Initialize PWA Manager
        if (window.pwaManager) {
            pwaManager = window.pwaManager;
            console.log('✅ PWA Manager already initialized');
        } else {
            const { default: PWAManager } = await import('./pwa-manager.js');
            pwaManager = new PWAManager();
            window.pwaManager = pwaManager;
            console.log('✅ PWA Manager initialized');
        }
        
        // Initialize Notification System
        const { default: NotificationSystem } = await import('./notification-system.js');
        notificationSystem = new NotificationSystem();
        window.notificationSystem = notificationSystem;
        console.log('✅ Notification System initialized');
        
        // Initialize Offline Cache Manager
        offlineCacheManager = new OfflineCacheManager();
        window.offlineCacheManager = offlineCacheManager;
        console.log('✅ Offline Cache Manager initialized');
        
        // Setup PWA event handlers
        setupPWAEventHandlers();
        
        console.log('🎉 All PWA modules loaded successfully!');
        
    } catch (error) {
        console.error('❌ Error initializing PWA modules:', error);
    }
}

function setupPWAEventHandlers() {
    // Install prompt handler
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        console.log('📱 PWA installation prompt available');
        
        if (pwaManager) {
            pwaManager.deferredPrompt = e;
            pwaManager.showInstallButton();
        }
    });
    
    // App installed handler
    window.addEventListener('appinstalled', () => {
        console.log('🎉 PWA installed successfully!');
        
        if (pwaManager) {
            pwaManager.trackInstallation();
            pwaManager.hideInstallButton();
        }
        
        // Show success notification
        if (notificationSystem) {
            notificationSystem.createNotification({
                type: 'success',
                title: 'App Instalado!',
                message: 'A Arquidiocese agora está disponível como aplicativo.',
                icon: '🎉'
            });
        }
    });
    
    // Offline/Online handlers
    window.addEventListener('offline', () => {
        console.log('📵 Application went offline');
        showOfflineIndicator();
        
        if (offlineCacheManager) {
            offlineCacheManager.handleOfflineMode();
        }
    });
    
    window.addEventListener('online', () => {
        console.log('🌐 Application back online');
        hideOfflineIndicator();
        
        if (offlineCacheManager) {
            offlineCacheManager.syncPendingActions();
        }
        
        if (pwaManager) {
            pwaManager.syncWhenOnline();
        }
    });
}

function showOfflineIndicator() {
    // Create or update offline indicator
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <i class="fas fa-wifi-slash"></i>
            <span>Modo Offline</span>
        `;
        document.body.appendChild(indicator);
    }
    indicator.style.display = 'flex';
}

function hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Export for use in other modules
export { db, pwaManager, notificationSystem, offlineCacheManager };