/**
 * Layout Manager - Scripts básicos para layout e funcionalidades
 */

class LayoutManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupNewsletterForm();
        this.setupSmoothScrolling();
        this.setupHeaderScroll();
    }

    // Mobile Menu
    setupMobileMenu() {
        const hamburger = document.querySelector('.menu-hamburger');
        const menu = document.querySelector('.menu-lista-principal');
        
        if (hamburger && menu) {
            hamburger.addEventListener('click', () => {
                menu.classList.toggle('ativo');
                hamburger.setAttribute('aria-expanded', 
                    hamburger.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
                );
            });

            // Close menu when clicking on a link
            menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    menu.classList.remove('ativo');
                    hamburger.setAttribute('aria-expanded', 'false');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
                    menu.classList.remove('ativo');
                    hamburger.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    // Newsletter Form
    setupNewsletterForm() {
        const form = document.getElementById('newsletter-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('newsletter-email').value;
                
                if (this.validateEmail(email)) {
                    this.showNotification('✅ Obrigado! Em breve você receberá nossas atualizações.', 'success');
                    form.reset();
                    
                    // Opcional: enviar para sistema de newsletter
                    this.subscribeToNewsletter(email);
                } else {
                    this.showNotification('❌ Por favor, insira um e-mail válido.', 'error');
                }
            });
        }
    }

    // Email Validation
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Newsletter Subscription (placeholder)
    subscribeToNewsletter(email) {
        // Aqui você pode integrar com um serviço de newsletter
        console.log('Newsletter subscription:', email);
        
        // Exemplo de integração futura:
        // fetch('/api/newsletter/subscribe', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email })
        // });
    }

    // Smooth Scrolling
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Header Scroll Effect
    setupHeaderScroll() {
        const header = document.querySelector('.site-header');
        if (header) {
            let lastScrollY = window.scrollY;
            
            window.addEventListener('scroll', () => {
                const currentScrollY = window.scrollY;
                
                if (currentScrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                
                lastScrollY = currentScrollY;
            });
        }
    }

    // Notification System
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: '10000',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.9rem',
            fontWeight: '500',
            maxWidth: '300px',
            wordWrap: 'break-word',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LayoutManager();
});

// Add header scroll effect CSS
const headerScrollCSS = `
.site-header.scrolled {
    background: rgba(26, 54, 93, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(26, 54, 93, 0.3);
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = headerScrollCSS;
document.head.appendChild(style);
