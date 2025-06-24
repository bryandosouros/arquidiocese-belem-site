// public/js/main.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

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

console.log("JavaScript Carregado - Arquidiocese HB V2.0 - Prontos para a beleza babadeira com carrossel!");

document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o ano no rodapé
    const anoAtualSpan = document.getElementById('ano-atual');
    if (anoAtualSpan) {
        anoAtualSpan.textContent = new Date().getFullYear();
    }

    // Lógica para o menu hambúrguer
    const menuHamburger = document.querySelector('.menu-hamburger');
    const menuListaPrincipal = document.getElementById('menu-lista-principal');
    const body = document.body;

    if (menuHamburger && menuListaPrincipal) {
        menuHamburger.addEventListener('click', function() {
            const isExpanded = menuHamburger.getAttribute('aria-expanded') === 'true';

            menuHamburger.setAttribute('aria-expanded', String(!isExpanded));
            menuHamburger.classList.toggle('ativo');
            menuListaPrincipal.classList.toggle('aberto');

            body.style.overflow = menuListaPrincipal.classList.contains('aberto') ? 'hidden' : '';
        });
    }

    // Lógica para o Carrossel da Hero Section
    const slidesContainer = document.querySelector('.hero-slides-container');
    if (slidesContainer) {
        const slides = slidesContainer.querySelectorAll('.hero-slide');
        let currentSlide = 0;
        const slideInterval = 5000;
        let autoSlideTimer;

        if (slides.length > 0) {
            // Criar indicadores
            const indicatorsContainer = document.createElement('div');
            indicatorsContainer.className = 'hero-indicators';
            indicatorsContainer.setAttribute('aria-label', 'Indicadores do carrossel');
            
            // Criar controles de navegação
            const prevButton = document.createElement('button');
            prevButton.className = 'hero-nav hero-nav-prev';
            prevButton.innerHTML = '<span aria-hidden="true">‹</span>';
            prevButton.setAttribute('aria-label', 'Slide anterior');
            
            const nextButton = document.createElement('button');
            nextButton.className = 'hero-nav hero-nav-next';
            nextButton.innerHTML = '<span aria-hidden="true">›</span>';
            nextButton.setAttribute('aria-label', 'Próximo slide');

            // Função para mostrar o slide
            function mostrarSlide(index) {
                slides.forEach((slide, i) => {
                    slide.classList.remove('slide-ativo');
                    slide.setAttribute('aria-hidden', 'true');
                });
                
                // Atualizar indicadores
                document.querySelectorAll('.hero-indicator').forEach((indicator, i) => {
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

            // Criar indicadores para cada slide
            slides.forEach((_, index) => {
                const indicator = document.createElement('button');
                indicator.className = 'hero-indicator';
                indicator.setAttribute('aria-label', `Ir para slide ${index + 1}`);
                indicator.setAttribute('aria-pressed', 'false');
                indicator.addEventListener('click', () => {
                    pararAutoSlide();
                    mostrarSlide(index);
                    iniciarAutoSlide();
                });
                indicatorsContainer.appendChild(indicator);
            });

            // Event listeners para controles
            prevButton.addEventListener('click', () => {
                pararAutoSlide();
                slideAnterior();
                iniciarAutoSlide();
            });

            nextButton.addEventListener('click', () => {
                pararAutoSlide();
                proximoSlide();
                iniciarAutoSlide();
            });

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
            slidesContainer.setAttribute('aria-label', 'Carrossel de destaques');            // Adicionar elementos ao DOM
            slidesContainer.appendChild(prevButton);
            slidesContainer.appendChild(nextButton);
            slidesContainer.appendChild(indicatorsContainer);

            // Inicializar
            mostrarSlide(0);
            iniciarAutoSlide();
        }
    }

    // Load dynamic news from Firestore
    async function loadNews() {
        console.log('🔄 Iniciando carregamento de notícias do Firestore...');
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
            } else {
                console.log('⚠️ Nenhum post encontrado. Mantendo cards estáticos.');
            }        } catch (error) {
            console.error('❌ Error loading news:', error);
            console.log('🔄 Mantendo cards estáticos como fallback.');
            // Keep static news as fallback
        }
    }

    function renderNews(posts) {
        const newsGrid = document.querySelector('.grid-noticias');
        if (!newsGrid) return;
        
        newsGrid.innerHTML = posts.map(post => `
            <article class="card-noticia card-vatican-inspired">
                <a href="post.html?id=${post.id}" class="card-link-area">
                    ${post.featuredImage ? 
                        `<img src="${post.featuredImage}" alt="${post.title}" class="card-noticia-imagem">` :
                        `<div class="card-noticia-imagem-placeholder"></div>`
                    }
                    <div class="card-conteudo">
                        <span class="card-categoria">${getCategoryLabel(post.category)}</span>
                        <h3 class="card-titulo">${post.title}</h3>
                        <p class="card-resumo">${post.excerpt || extractExcerpt(post.content)}</p>
                        <div class="card-data">${formatPostDate(post.createdAt)}</div>
                    </div>
                </a>
                <div class="card-footer">
                    <a href="post.html?id=${post.id}" class="card-link-leia-mais">Leia mais <span class="seta">&rarr;</span></a>
                </div>
            </article>
        `).join('');
        
        console.log(`✅ ${posts.length} posts carregados dinamicamente na homepage!`);
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