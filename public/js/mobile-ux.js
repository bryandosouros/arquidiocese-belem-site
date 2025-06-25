/**
 * Mobile UX Module - Release 6A: Mobile-First Experience
 * Advanced mobile user experience enhancements for Arquidiocese de Belém
 */

class MobileUXManager {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        this.touchDevice = 'ontouchstart' in window;
        this.lastScrollY = 0;
        this.headerHeight = 0;
        this.init();
    }

    init() {
        console.log('🔧 Initializing Mobile UX Manager...');
        
        this.detectDevice();
        this.setupViewportHelpers();
        this.setupTouchOptimizations();
        this.setupScrollBehaviors();
        this.setupSafeAreaHandling();
        this.setupKeyboardHandling();
        this.setupOrientationHandling();
        this.setupPerformanceOptimizations();
        
        console.log('✅ Mobile UX Manager initialized');
    }

    detectDevice() {
        // Enhanced device detection
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        document.body.classList.add('js-enabled');
        
        if (this.touchDevice) {
            document.body.classList.add('touch-device');
        }
        
        if (isIOS) {
            document.body.classList.add('ios-device');
        }
        
        if (isAndroid) {
            document.body.classList.add('android-device');
        }
        
        if (isSafari) {
            document.body.classList.add('safari-browser');
        }
        
        // Update breakpoint classes
        this.updateBreakpointClasses();
    }

    updateBreakpointClasses() {
        const width = window.innerWidth;
        const body = document.body;
        
        // Remove all breakpoint classes
        body.classList.remove('bp-xs', 'bp-sm', 'bp-md', 'bp-lg', 'bp-tablet', 'bp-laptop', 'bp-desktop');
        
        // Add current breakpoint class
        if (width < 375) {
            body.classList.add('bp-xs');
        } else if (width < 414) {
            body.classList.add('bp-sm');
        } else if (width < 576) {
            body.classList.add('bp-md');
        } else if (width < 768) {
            body.classList.add('bp-lg');
        } else if (width < 1024) {
            body.classList.add('bp-tablet');
        } else if (width < 1200) {
            body.classList.add('bp-laptop');
        } else {
            body.classList.add('bp-desktop');
        }
    }

    setupViewportHelpers() {
        // CSS Custom Properties for dynamic viewport
        const updateViewportUnits = () => {
            const vh = window.innerHeight * 0.01;
            const vw = window.innerWidth * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            document.documentElement.style.setProperty('--vw', `${vw}px`);
        };

        updateViewportUnits();
        
        // Update on resize and orientation change
        window.addEventListener('resize', updateViewportUnits);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateViewportUnits, 100);
        });
    }

    setupTouchOptimizations() {
        if (!this.touchDevice) return;

        // Optimize touch targets
        document.querySelectorAll('button, a, input, select, textarea').forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.classList.add('touch-target-small');
            }
        });

        // Add touch feedback
        document.addEventListener('touchstart', function(e) {
            if (e.target.matches('button, .btn, a[href], input[type="button"], input[type="submit"]')) {
                e.target.classList.add('touch-active');
            }
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            setTimeout(() => {
                e.target.classList.remove('touch-active');
            }, 150);
        }, { passive: true });

        // Prevent double-tap zoom on buttons
        document.addEventListener('touchend', function(e) {
            if (e.target.matches('button, .btn, input[type="button"], input[type="submit"]')) {
                e.preventDefault();
            }
        });
    }

    setupScrollBehaviors() {
        // Smart header hiding on mobile
        const header = document.querySelector('.site-header');
        if (!header || !this.isMobile) return;

        this.headerHeight = header.offsetHeight;
        let ticking = false;

        const updateHeader = () => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > this.lastScrollY;
            const scrolledEnough = Math.abs(currentScrollY - this.lastScrollY) > 5;

            if (scrolledEnough) {
                if (scrollingDown && currentScrollY > this.headerHeight) {
                    header.classList.add('header-hidden');
                } else {
                    header.classList.remove('header-hidden');
                }
            }

            this.lastScrollY = currentScrollY;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }, { passive: true });
    }

    setupSafeAreaHandling() {
        // Handle safe areas for notched devices
        const detectSafeArea = () => {
            const safeAreaTop = getComputedStyle(document.documentElement)
                .getPropertyValue('--safe-area-inset-top') || '0px';
            const safeAreaBottom = getComputedStyle(document.documentElement)
                .getPropertyValue('--safe-area-inset-bottom') || '0px';

            if (parseInt(safeAreaTop) > 0 || parseInt(safeAreaBottom) > 0) {
                document.body.classList.add('has-safe-areas');
                
                // Apply to key elements
                document.documentElement.style.setProperty('--safe-area-top', safeAreaTop);
                document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom);
            }
        };

        detectSafeArea();
        
        // PWA standalone mode detection
        if (window.matchMedia('(display-mode: standalone)').matches) {
            document.body.classList.add('pwa-standalone');
        }
    }

    setupKeyboardHandling() {
        // Handle virtual keyboard on mobile
        if (!this.isMobile) return;

        let initialViewportHeight = window.visualViewport ? 
            window.visualViewport.height : window.innerHeight;

        const handleKeyboard = () => {
            const currentHeight = window.visualViewport ? 
                window.visualViewport.height : window.innerHeight;
            
            const keyboardHeight = initialViewportHeight - currentHeight;
            
            if (keyboardHeight > 150) { // Keyboard is open
                document.body.classList.add('keyboard-open');
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
            } else {
                document.body.classList.remove('keyboard-open');
                document.documentElement.style.setProperty('--keyboard-height', '0px');
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleKeyboard);
        } else {
            window.addEventListener('resize', handleKeyboard);
        }

        // Focus management for inputs
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea, select')) {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    setupOrientationHandling() {
        const handleOrientationChange = () => {
            document.body.classList.remove('orientation-portrait', 'orientation-landscape');
            
            setTimeout(() => {
                const isPortrait = window.innerHeight > window.innerWidth;
                document.body.classList.add(
                    isPortrait ? 'orientation-portrait' : 'orientation-landscape'
                );
                
                this.updateBreakpointClasses();
                
                // Recalculate viewport units
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            }, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        handleOrientationChange(); // Initial call
    }

    setupPerformanceOptimizations() {
        // Optimize scrolling performance
        let isScrolling = false;
        
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                document.body.classList.add('is-scrolling');
                isScrolling = true;
                
                setTimeout(() => {
                    document.body.classList.remove('is-scrolling');
                    isScrolling = false;
                }, 150);
            }
        }, { passive: true });

        // Optimize resize handling
        let resizeTimer;
        window.addEventListener('resize', () => {
            document.body.classList.add('is-resizing');
            
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                document.body.classList.remove('is-resizing');
                this.updateBreakpointClasses();
            }, 250);
        });

        // Optimize focus management
        document.addEventListener('focus', (e) => {
            if (e.target.matches('input, textarea, select, button, a[href]')) {
                document.body.classList.add('user-is-tabbing');
            }
        }, true);

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('user-is-tabbing');
        });
    }

    // Public methods for external use
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `mobile-toast mobile-toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}

// Initialize and expose globally
window.mobileUX = new MobileUXManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileUXManager;
}
