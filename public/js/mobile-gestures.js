/**
 * Mobile Gestures Module - Release 6A: Mobile-First Experience
 * Swipe gestures and touch interactions for enhanced mobile navigation
 */

class MobileGesturesManager {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.maxVerticalDistance = 100;
        this.gestureHandlers = new Map();
        this.isEnabled = 'ontouchstart' in window;
        
        if (this.isEnabled) {
            this.init();
        }
    }

    init() {
        console.log('👆 Initializing Mobile Gestures Manager...');
        
        this.setupSwipeGestures();
        this.setupPullToRefresh();
        this.setupCarouselGestures();
        this.setupModalGestures();
        
        console.log('✅ Mobile Gestures Manager initialized');
    }

    setupSwipeGestures() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Register default swipe handlers
        this.registerSwipeHandler('navigation', (direction) => {
            if (direction === 'right' && window.innerWidth <= 768) {
                // Swipe right to open menu
                const menuToggle = document.querySelector('.menu-hamburger');
                const menu = document.querySelector('.menu-lista-principal');
                
                if (menuToggle && menu && !menu.classList.contains('aberto')) {
                    menuToggle.click();
                }
            }
        });
        
        this.registerSwipeHandler('modal', (direction, element) => {
            if ((direction === 'down' || direction === 'up') && element.closest('.modal-content')) {
                // Swipe to close modal
                const modal = element.closest('.modal') || element.closest('.modal-overlay');
                if (modal) {
                    const closeBtn = modal.querySelector('.modal-close');
                    if (closeBtn) {
                        closeBtn.click();
                    } else {
                        modal.style.display = 'none';
                    }
                }
            }
        });
    }

    setupPullToRefresh() {
        let startY = 0;
        let isPulling = false;
        let pullDistance = 0;
        const maxPullDistance = 80;
        
        const pullToRefreshElement = document.createElement('div');
        pullToRefreshElement.className = 'pull-to-refresh';
        pullToRefreshElement.innerHTML = `
            <div class="pull-indicator">
                <span class="pull-icon">↓</span>
                <span class="pull-text">Puxe para atualizar</span>
            </div>
        `;
        document.body.insertBefore(pullToRefreshElement, document.body.firstChild);
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            const currentY = e.touches[0].clientY;
            pullDistance = Math.max(0, Math.min(maxPullDistance, currentY - startY));
            
            if (pullDistance > 10) {
                pullToRefreshElement.style.transform = `translateY(${pullDistance - maxPullDistance}px)`;
                pullToRefreshElement.style.opacity = pullDistance / maxPullDistance;
                
                if (pullDistance >= maxPullDistance) {
                    pullToRefreshElement.classList.add('ready');
                    pullToRefreshElement.querySelector('.pull-text').textContent = 'Solte para atualizar';
                    pullToRefreshElement.querySelector('.pull-icon').textContent = '↻';
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (!isPulling) return;
            
            if (pullDistance >= maxPullDistance) {
                this.triggerRefresh();
            }
            
            isPulling = false;
            pullDistance = 0;
            pullToRefreshElement.style.transform = 'translateY(-100%)';
            pullToRefreshElement.style.opacity = '0';
            pullToRefreshElement.classList.remove('ready');
            pullToRefreshElement.querySelector('.pull-text').textContent = 'Puxe para atualizar';
            pullToRefreshElement.querySelector('.pull-icon').textContent = '↓';
        }, { passive: true });
    }

    setupCarouselGestures() {
        const carousels = document.querySelectorAll('.hero-slides-container, .carousel-container');
        
        carousels.forEach(carousel => {
            let startX = 0;
            let startY = 0;
            let isCarouselSwiping = false;
            
            carousel.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isCarouselSwiping = true;
            }, { passive: true });
            
            carousel.addEventListener('touchmove', (e) => {
                if (!isCarouselSwiping) return;
                
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const deltaX = Math.abs(currentX - startX);
                const deltaY = Math.abs(currentY - startY);
                
                // Prevent vertical scrolling if horizontal swipe detected
                if (deltaX > deltaY && deltaX > 10) {
                    e.preventDefault();
                }
            });
            
            carousel.addEventListener('touchend', (e) => {
                if (!isCarouselSwiping) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const deltaX = endX - startX;
                const deltaY = Math.abs(endY - startY);
                
                if (Math.abs(deltaX) > 50 && deltaY < 100) {
                    if (deltaX > 0) {
                        // Swipe right - previous slide
                        const prevBtn = carousel.querySelector('.hero-nav-prev, .carousel-prev');
                        if (prevBtn) prevBtn.click();
                    } else {
                        // Swipe left - next slide
                        const nextBtn = carousel.querySelector('.hero-nav-next, .carousel-next');
                        if (nextBtn) nextBtn.click();
                    }
                }
                
                isCarouselSwiping = false;
            }, { passive: true });
        });
    }

    setupModalGestures() {
        // Enhanced modal swipe to close
        document.addEventListener('touchstart', (e) => {
            const modal = e.target.closest('.modal-content');
            if (modal && window.innerWidth <= 768) {
                this.modalStartY = e.touches[0].clientY;
                this.modalElement = modal;
                this.isModalSwiping = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!this.isModalSwiping || !this.modalElement) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - this.modalStartY;
            
            // Only allow downward swipes
            if (deltaY > 0) {
                const progress = Math.min(deltaY / 200, 1);
                this.modalElement.style.transform = `translateY(${deltaY}px)`;
                this.modalElement.style.opacity = 1 - (progress * 0.5);
                
                const overlay = this.modalElement.closest('.modal, .modal-overlay');
                if (overlay) {
                    overlay.style.backgroundColor = `rgba(0, 0, 0, ${0.5 * (1 - progress)})`;
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!this.isModalSwiping || !this.modalElement) return;
            
            const endY = e.changedTouches[0].clientY;
            const deltaY = endY - this.modalStartY;
            
            if (deltaY > 100) {
                // Close modal
                const modal = this.modalElement.closest('.modal, .modal-overlay');
                if (modal) {
                    modal.style.display = 'none';
                }
            } else {
                // Snap back
                this.modalElement.style.transform = 'translateY(0)';
                this.modalElement.style.opacity = '1';
                
                const overlay = this.modalElement.closest('.modal, .modal-overlay');
                if (overlay) {
                    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                }
            }
            
            this.isModalSwiping = false;
            this.modalElement = null;
        }, { passive: true });
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].clientX;
        this.touchEndY = e.changedTouches[0].clientY;
        
        const direction = this.getSwipeDirection();
        if (direction) {
            this.triggerSwipeHandlers(direction, e.target);
        }
    }

    getSwipeDirection() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // Must be a significant swipe
        if (absDeltaX < this.minSwipeDistance && absDeltaY < this.minSwipeDistance) {
            return null;
        }
        
        // Determine primary direction
        if (absDeltaX > absDeltaY) {
            // Horizontal swipe
            if (absDeltaY > this.maxVerticalDistance) return null;
            return deltaX > 0 ? 'right' : 'left';
        } else {
            // Vertical swipe
            if (absDeltaX > this.maxVerticalDistance) return null;
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    registerSwipeHandler(name, handler) {
        this.gestureHandlers.set(name, handler);
    }

    triggerSwipeHandlers(direction, element) {
        for (const [name, handler] of this.gestureHandlers) {
            try {
                handler(direction, element);
            } catch (error) {
                console.warn(`Gesture handler '${name}' error:`, error);
            }
        }
    }

    triggerRefresh() {
        console.log('🔄 Pull to refresh triggered');
        
        const pullToRefreshElement = document.querySelector('.pull-to-refresh');
        if (pullToRefreshElement) {
            pullToRefreshElement.querySelector('.pull-text').textContent = 'Atualizando...';
            pullToRefreshElement.querySelector('.pull-icon').textContent = '⟳';
        }
        
        // Show visual feedback
        if (window.mobileUX) {
            window.mobileUX.showToast('Atualizando página...', 'info', 2000);
        }
        
        // Trigger refresh after delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    // Long press handling for contextual actions
    setupLongPress() {
        let pressTimer;
        let isLongPress = false;
        
        document.addEventListener('touchstart', (e) => {
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                this.handleLongPress(e.target);
            }, 500);
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        }, { passive: true });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        }, { passive: true });
    }

    handleLongPress(element) {
        // Long press on images to show sharing options
        if (element.tagName === 'IMG') {
            this.showImageActions(element);
        }
        
        // Long press on text to show reading options
        if (element.closest('.post-content, .content-text')) {
            this.showReadingActions(element);
        }
        
        // Haptic feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    showImageActions(img) {
        const actions = document.createElement('div');
        actions.className = 'context-actions';
        actions.innerHTML = `
            <button onclick="this.parentNode.remove()">Compartilhar</button>
            <button onclick="this.parentNode.remove()">Salvar</button>
            <button onclick="this.parentNode.remove()">Fechar</button>
        `;
        
        document.body.appendChild(actions);
        
        // Position near the image
        const rect = img.getBoundingClientRect();
        actions.style.position = 'fixed';
        actions.style.top = `${rect.bottom + 10}px`;
        actions.style.left = `${rect.left}px`;
        actions.style.zIndex = '10000';
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (actions.parentNode) {
                actions.parentNode.removeChild(actions);
            }
        }, 3000);
    }

    showReadingActions(element) {
        // Reading mode, font size, etc.
        console.log('📖 Long press on text - reading actions');
    }
}

// CSS for gestures
const gestureStyles = `
    .pull-to-refresh {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: linear-gradient(135deg, #1a365d, #2563eb);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateY(-100%);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1001;
    }
    
    .pull-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .pull-icon {
        font-size: 1.5rem;
        font-weight: bold;
    }
    
    .pull-text {
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .pull-to-refresh.ready .pull-icon {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .context-actions {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        gap: 1rem;
        padding: 1rem;
    }
    
    .context-actions button {
        background: #1a365d;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }
    
    .context-actions button:hover {
        background: #2563eb;
    }
    
    /* Touch feedback for interactive elements */
    .touch-active {
        transform: scale(0.98);
        opacity: 0.8;
        transition: all 0.1s ease;
    }
    
    /* Smooth modal swipe animations */
    .modal-content {
        transition: transform 0.3s ease, opacity 0.3s ease;
    }
`;

// Inject gesture styles
const styleSheet = document.createElement('style');
styleSheet.textContent = gestureStyles;
document.head.appendChild(styleSheet);

// Initialize gestures manager
window.mobileGestures = new MobileGesturesManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileGesturesManager;
}
