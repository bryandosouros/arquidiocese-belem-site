/**
 * Hero Carousel - Carrossel da seção principal
 */

class HeroCarousel {
    constructor() {
        this.slides = document.querySelectorAll('.hero-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;
        this.autoplayInterval = null;
        this.autoplayDelay = 5000; // 5 segundos
        
        this.init();
    }

    init() {
        if (this.slides.length === 0) return;
        
        console.log('🎠 Hero Carousel initialized with', this.totalSlides, 'slides');
        
        // Setup indicators
        this.setupIndicators();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Start autoplay
        this.startAutoplay();
        
        // Pause autoplay on hover
        this.setupHoverControls();
    }

    setupIndicators() {
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            }
        });
    }

    setupHoverControls() {
        const heroSection = document.querySelector('.hero-carousel');
        if (heroSection) {
            heroSection.addEventListener('mouseenter', () => {
                this.pauseAutoplay();
            });
            
            heroSection.addEventListener('mouseleave', () => {
                this.startAutoplay();
            });
        }
    }

    goToSlide(slideIndex) {
        // Remove active class from current slide and indicator
        this.slides[this.currentSlide].classList.remove('slide-ativo');
        this.indicators[this.currentSlide].classList.remove('ativo');
        
        // Update current slide
        this.currentSlide = slideIndex;
        
        // Add active class to new slide and indicator
        this.slides[this.currentSlide].classList.add('slide-ativo');
        this.indicators[this.currentSlide].classList.add('ativo');
        
        // Update background color
        this.updateBackgroundColor();
        
        console.log('🎠 Moved to slide', this.currentSlide + 1);
    }

    next() {
        const nextSlide = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextSlide);
    }

    prev() {
        const prevSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prevSlide);
    }

    updateBackgroundColor() {
        const currentSlideElement = this.slides[this.currentSlide];
        const bgColorVar = currentSlideElement.dataset.bgColorVar;
        
        if (bgColorVar) {
            document.documentElement.style.setProperty('--hero-current-bg', `var(${bgColorVar})`);
        }
    }

    startAutoplay() {
        this.pauseAutoplay(); // Clear any existing interval
        this.autoplayInterval = setInterval(() => {
            this.next();
        }, this.autoplayDelay);
    }

    pauseAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    // Public methods for manual control
    destroy() {
        this.pauseAutoplay();
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.heroCarousel = new HeroCarousel();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroCarousel;
}
