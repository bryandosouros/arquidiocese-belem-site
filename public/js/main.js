// public/js/main.js

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
        const slideInterval = 5000; // Intervalo de 5 segundos (5000 ms)
        let intervalId = null;
        let isPaused = false;

        if (slides.length > 0) {
            // Criar indicadores
            const indicatorsContainer = document.createElement('div');
            indicatorsContainer.className = 'hero-indicators';
            slides.forEach((_, index) => {
                const indicator = document.createElement('button');
                indicator.className = 'hero-indicator';
                indicator.setAttribute('aria-label', `Ir para slide ${index + 1}`);
                indicator.addEventListener('click', () => goToSlide(index));
                indicatorsContainer.appendChild(indicator);
            });
            slidesContainer.appendChild(indicatorsContainer);

            // Criar controles de navegação
            const prevButton = document.createElement('button');
            prevButton.className = 'hero-nav hero-nav-prev';
            prevButton.innerHTML = '‹';
            prevButton.setAttribute('aria-label', 'Slide anterior');
            prevButton.addEventListener('click', () => goToSlide(currentSlide - 1));

            const nextButton = document.createElement('button');
            nextButton.className = 'hero-nav hero-nav-next';
            nextButton.innerHTML = '›';
            nextButton.setAttribute('aria-label', 'Próximo slide');
            nextButton.addEventListener('click', () => goToSlide(currentSlide + 1));

            slidesContainer.appendChild(prevButton);
            slidesContainer.appendChild(nextButton);

            // Função para ir para um slide específico
            function goToSlide(index) {
                if (index < 0) index = slides.length - 1;
                if (index >= slides.length) index = 0;
                currentSlide = index;
                mostrarSlide(currentSlide);
                updateIndicators();
            }

            // Função para mostrar o slide
            function mostrarSlide(index) {
                slides.forEach((slide, i) => {
                    slide.classList.remove('slide-ativo');
                    slide.setAttribute('aria-hidden', 'true');
                });
                slides[index].classList.add('slide-ativo');
                slides[index].setAttribute('aria-hidden', 'false');
            }

            // Função para atualizar indicadores
            function updateIndicators() {
                const indicators = indicatorsContainer.querySelectorAll('.hero-indicator');
                indicators.forEach((indicator, i) => {
                    indicator.classList.toggle('ativo', i === currentSlide);
                });
            }

            // Função para o próximo slide
            function proximoSlide() {
                if (!isPaused) {
                    goToSlide(currentSlide + 1);
                }
            }

            // Iniciar o carrossel automático
            function startCarousel() {
                if (slides.length > 1 && !intervalId) {
                    intervalId = setInterval(proximoSlide, slideInterval);
                }
            }

            // Parar o carrossel
            function stopCarousel() {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }

            // Pausar/despausar no hover
            slidesContainer.addEventListener('mouseenter', () => {
                isPaused = true;
                stopCarousel();
            });

            slidesContainer.addEventListener('mouseleave', () => {
                isPaused = false;
                startCarousel();
            });

            // Inicia o carrossel
            mostrarSlide(currentSlide);
            updateIndicators();
            startCarousel();
        }
    }
});