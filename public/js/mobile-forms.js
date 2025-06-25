/**
 * Mobile Forms Enhancement - Release 6A: Mobile-First Experience
 * Enhanced form interactions and UX for mobile devices
 */

class MobileFormsManager {
    constructor() {
        this.activeField = null;
        this.keyboardHeight = 0;
        this.originalViewportHeight = window.innerHeight;
        this.formInputs = [];
        this.validationRules = new Map();
        
        this.init();
    }

    init() {
        console.log('📱 Initializing Mobile Forms Manager...');
        
        this.enhanceFormInputs();
        this.setupKeyboardHandling();
        this.setupFormValidation();
        this.setupFormNavigation();
        this.setupAutoFill();
        this.setupFormSubmission();
        
        console.log('✅ Mobile Forms Manager initialized');
    }

    enhanceFormInputs() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            this.formInputs.push(input);
            
            // Add mobile-friendly attributes
            if (input.type === 'email') {
                input.setAttribute('inputmode', 'email');
                input.setAttribute('autocomplete', 'email');
            } else if (input.type === 'tel') {
                input.setAttribute('inputmode', 'tel');
                input.setAttribute('autocomplete', 'tel');
            } else if (input.type === 'url') {
                input.setAttribute('inputmode', 'url');
                input.setAttribute('autocomplete', 'url');
            } else if (input.name && input.name.includes('name')) {
                input.setAttribute('autocomplete', 'name');
            }
            
            // Enhanced touch interactions
            this.addTouchEnhancements(input);
            
            // Auto-resize textareas
            if (input.tagName === 'TEXTAREA') {
                this.setupAutoResize(input);
            }
            
            // Enhanced validation feedback
            this.setupInputValidation(input);
            
            // Floating labels
            this.setupFloatingLabel(input);
        });
    }

    addTouchEnhancements(input) {
        // Ensure minimum touch target size
        const rect = input.getBoundingClientRect();
        if (rect.height < 44) {
            input.style.minHeight = '44px';
            input.style.paddingTop = '12px';
            input.style.paddingBottom = '12px';
        }
        
        // Touch feedback
        input.addEventListener('touchstart', () => {
            input.classList.add('touch-active');
        }, { passive: true });
        
        input.addEventListener('touchend', () => {
            setTimeout(() => {
                input.classList.remove('touch-active');
            }, 150);
        }, { passive: true });
        
        // Focus handling
        input.addEventListener('focus', () => {
            this.handleInputFocus(input);
        });
        
        input.addEventListener('blur', () => {
            this.handleInputBlur(input);
        });
    }

    setupAutoResize(textarea) {
        const resize = () => {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 200);
            textarea.style.height = newHeight + 'px';
        };
        
        textarea.addEventListener('input', resize);
        textarea.addEventListener('focus', resize);
        
        // Initial resize
        resize();
    }

    setupFloatingLabel(input) {
        const container = input.parentElement;
        const label = container.querySelector('label[for="' + input.id + '"]');
        
        if (!label) return;
        
        // Create floating label structure
        container.classList.add('floating-label-container');
        label.classList.add('floating-label');
        
        const updateLabel = () => {
            if (input.value || input === document.activeElement) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        };
        
        input.addEventListener('focus', updateLabel);
        input.addEventListener('blur', updateLabel);
        input.addEventListener('input', updateLabel);
        
        // Initial state
        updateLabel();
    }

    setupInputValidation(input) {
        let validationTimeout;
        
        input.addEventListener('input', () => {
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(() => {
                this.validateInput(input);
            }, 500);
        });
        
        input.addEventListener('blur', () => {
            this.validateInput(input);
        });
    }

    validateInput(input) {
        const value = input.value.trim();
        const type = input.type;
        let isValid = true;
        let message = '';
        
        // Remove previous validation state
        input.classList.remove('valid', 'invalid');
        this.clearValidationMessage(input);
        
        // Skip validation for empty non-required fields
        if (!value && !input.required) return;
        
        // Required field validation
        if (input.required && !value) {
            isValid = false;
            message = 'Este campo é obrigatório';
        }
        
        // Email validation
        else if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Insira um email válido';
            }
        }
        
        // Phone validation
        else if (type === 'tel' && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\D/g, ''))) {
                isValid = false;
                message = 'Insira um telefone válido';
            }
        }
        
        // URL validation
        else if (type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                isValid = false;
                message = 'Insira uma URL válida';
            }
        }
        
        // Custom validation rules
        const customRule = this.validationRules.get(input.name || input.id);
        if (customRule && value) {
            const result = customRule(value);
            if (result !== true) {
                isValid = false;
                message = result;
            }
        }
        
        // Apply validation state
        input.classList.add(isValid ? 'valid' : 'invalid');
        
        if (!isValid) {
            this.showValidationMessage(input, message);
            this.vibrateError();
        }
        
        return isValid;
    }

    showValidationMessage(input, message) {
        let errorElement = input.parentElement.querySelector('.validation-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'validation-message';
            input.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearValidationMessage(input) {
        const errorElement = input.parentElement.querySelector('.validation-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    setupKeyboardHandling() {
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleKeyboardToggle();
            });
        } else {
            window.addEventListener('resize', () => {
                this.handleKeyboardToggle();
            });
        }
    }

    handleKeyboardToggle() {
        const currentHeight = window.visualViewport ? 
            window.visualViewport.height : window.innerHeight;
        
        this.keyboardHeight = this.originalViewportHeight - currentHeight;
        
        if (this.keyboardHeight > 150) {
            document.body.classList.add('keyboard-open');
            this.adjustFormForKeyboard();
        } else {
            document.body.classList.remove('keyboard-open');
            this.resetFormLayout();
        }
    }

    adjustFormForKeyboard() {
        if (this.activeField) {
            setTimeout(() => {
                const rect = this.activeField.getBoundingClientRect();
                const viewportHeight = window.visualViewport ? 
                    window.visualViewport.height : window.innerHeight;
                
                if (rect.bottom > viewportHeight - 50) {
                    this.activeField.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 300);
        }
    }

    resetFormLayout() {
        // Reset any layout adjustments
        document.querySelectorAll('.form-adjusted').forEach(el => {
            el.classList.remove('form-adjusted');
        });
    }

    handleInputFocus(input) {
        this.activeField = input;
        input.parentElement.classList.add('field-focused');
        
        // Add form navigation controls for mobile
        if (window.innerWidth <= 768) {
            this.showFormNavigation(input);
        }
    }

    handleInputBlur(input) {
        if (this.activeField === input) {
            this.activeField = null;
        }
        input.parentElement.classList.remove('field-focused');
        this.hideFormNavigation();
    }

    setupFormNavigation() {
        // Create form navigation toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'form-navigation-toolbar';
        toolbar.innerHTML = `
            <button type="button" class="form-nav-btn" data-action="prev">
                <span>◀</span> Anterior
            </button>
            <button type="button" class="form-nav-btn" data-action="next">
                Próximo <span>▶</span>
            </button>
            <button type="button" class="form-nav-btn" data-action="done">
                Concluir
            </button>
        `;
        
        document.body.appendChild(toolbar);
        
        // Handle navigation
        toolbar.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                this.handleFormNavigation(action);
            }
        });
    }

    showFormNavigation(input) {
        const toolbar = document.querySelector('.form-navigation-toolbar');
        if (!toolbar) return;
        
        const currentIndex = this.formInputs.indexOf(input);
        const prevBtn = toolbar.querySelector('[data-action="prev"]');
        const nextBtn = toolbar.querySelector('[data-action="next"]');
        
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === this.formInputs.length - 1;
        
        toolbar.classList.add('visible');
    }

    hideFormNavigation() {
        const toolbar = document.querySelector('.form-navigation-toolbar');
        if (toolbar) {
            toolbar.classList.remove('visible');
        }
    }

    handleFormNavigation(action) {
        if (!this.activeField) return;
        
        const currentIndex = this.formInputs.indexOf(this.activeField);
        
        switch (action) {
            case 'prev':
                if (currentIndex > 0) {
                    this.formInputs[currentIndex - 1].focus();
                }
                break;
            case 'next':
                if (currentIndex < this.formInputs.length - 1) {
                    this.formInputs[currentIndex + 1].focus();
                }
                break;
            case 'done':
                this.activeField.blur();
                break;
        }
    }

    setupAutoFill() {
        // Smart autofill suggestions based on field names and types
        this.formInputs.forEach(input => {
            if (input.type === 'email' && !input.value) {
                input.addEventListener('focus', () => {
                    if (localStorage.getItem('userEmail')) {
                        this.showAutoFillSuggestion(input, localStorage.getItem('userEmail'));
                    }
                });
            }
        });
    }

    showAutoFillSuggestion(input, value) {
        const suggestion = document.createElement('div');
        suggestion.className = 'autofill-suggestion';
        suggestion.textContent = `Usar: ${value}`;
        suggestion.addEventListener('click', () => {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            suggestion.remove();
        });
        
        input.parentElement.appendChild(suggestion);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (suggestion.parentElement) {
                suggestion.remove();
            }
        }, 3000);
    }

    setupFormSubmission() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                this.handleFormSubmit(form, e);
            }
        });
    }

    handleFormSubmit(form, event) {
        // Validate all fields
        let isValid = true;
        const invalidFields = [];
        
        this.formInputs.forEach(input => {
            if (form.contains(input)) {
                if (!this.validateInput(input)) {
                    isValid = false;
                    invalidFields.push(input);
                }
            }
        });
        
        if (!isValid) {
            event.preventDefault();
            
            // Focus first invalid field
            if (invalidFields.length > 0) {
                invalidFields[0].focus();
                invalidFields[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
            
            this.vibrateError();
            
            if (window.mobileUX) {
                window.mobileUX.showToast('Por favor, corrija os campos em vermelho', 'error', 3000);
            }
            
            return false;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            
            if (submitBtn.dataset.loadingText) {
                submitBtn.textContent = submitBtn.dataset.loadingText;
            }
        }
        
        return true;
    }

    addValidationRule(fieldName, validator) {
        this.validationRules.set(fieldName, validator);
    }

    vibrateError() {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    vibrateSuccess() {
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }
    }
}

// CSS for mobile forms
const formStyles = `
    /* Touch-friendly form inputs */
    .touch-device input,
    .touch-device textarea,
    .touch-device select {
        min-height: 44px;
        padding: 12px 16px;
        font-size: 16px; /* Prevents zoom on iOS */
        border-radius: 8px;
        border: 2px solid #e2e8f0;
        transition: all 0.2s ease;
    }
    
    .touch-device input:focus,
    .touch-device textarea:focus,
    .touch-device select:focus {
        border-color: #1a365d;
        box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.1);
        outline: none;
    }
    
    /* Touch feedback */
    .touch-active {
        transform: scale(0.98);
        background-color: #f7fafc;
    }
    
    /* Floating labels */
    .floating-label-container {
        position: relative;
        margin-bottom: 1.5rem;
    }
    
    .floating-label {
        position: absolute;
        top: 50%;
        left: 16px;
        transform: translateY(-50%);
        color: #a0aec0;
        font-size: 16px;
        pointer-events: none;
        transition: all 0.2s ease;
        background: white;
        padding: 0 4px;
    }
    
    .floating-label.active {
        top: 0;
        font-size: 12px;
        color: #1a365d;
        font-weight: 600;
    }
    
    /* Field focus state */
    .field-focused {
        transform: scale(1.02);
        transition: transform 0.2s ease;
    }
    
    /* Validation states */
    .valid {
        border-color: #38a169 !important;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%2338a169' viewBox='0 0 16 16'%3e%3cpath d='M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
    }
    
    .invalid {
        border-color: #e53e3e !important;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23e53e3e' viewBox='0 0 16 16'%3e%3cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
    }
    
    /* Validation messages */
    .validation-message {
        display: none;
        color: #e53e3e;
        font-size: 14px;
        margin-top: 4px;
        padding-left: 16px;
    }
    
    /* Form navigation toolbar */
    .form-navigation-toolbar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 1px solid #e2e8f0;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 1000;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .form-navigation-toolbar.visible {
        transform: translateY(0);
    }
    
    .form-nav-btn {
        background: #1a365d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 40px;
    }
    
    .form-nav-btn:disabled {
        background: #cbd5e0;
        cursor: not-allowed;
    }
    
    .form-nav-btn:not(:disabled):hover {
        background: #2c5282;
        transform: translateY(-1px);
    }
    
    /* Autofill suggestions */
    .autofill-suggestion {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-top: none;
        padding: 12px 16px;
        cursor: pointer;
        font-size: 14px;
        color: #4a5568;
        z-index: 10;
    }
    
    .autofill-suggestion:hover {
        background: #f7fafc;
        color: #1a365d;
    }
    
    /* Keyboard open adjustments */
    .keyboard-open .form-navigation-toolbar {
        bottom: 0;
        padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    }
    
    /* Loading state for submit buttons */
    .loading {
        position: relative;
        color: transparent !important;
    }
    
    .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid transparent;
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Responsive form layouts */
    @media (max-width: 768px) {
        .form-row {
            display: block !important;
        }
        
        .form-row .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            display: block;
        }
    }
`;

// Inject form styles
const styleSheet = document.createElement('style');
styleSheet.textContent = formStyles;
document.head.appendChild(styleSheet);

// Initialize mobile forms manager
window.mobileForms = new MobileFormsManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileFormsManager;
}
