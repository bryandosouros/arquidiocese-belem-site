import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-storage.js';

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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Global state
let currentUser = null;
let currentEditingPost = null;
let posts = [];
let postTags = [];

// DOM Elements
const userNameEl = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.admin-section');
const postEditorModal = document.getElementById('post-editor-modal');
const postForm = document.getElementById('post-form');
const postsListEl = document.getElementById('posts-list');
const recentPostsEl = document.getElementById('recent-posts');

// Initialize TinyMCE
function initTinyMCE() {
    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: '#post-content',
            height: 400,
            menubar: false,
            statusbar: false,
            branding: false,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image link | fullscreen',
            content_style: 'body { font-family: "Open Sans", sans-serif; font-size: 14px; margin: 1rem; }',
            setup: function (editor) {
                editor.on('init', function () {
                    console.log('✅ TinyMCE Editor initialized successfully');
                });
                
                editor.on('change', function () {
                    editor.save();
                });
            },
            file_picker_callback: function (callback, value, meta) {
                if (meta.filetype === 'image') {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    
                    input.onchange = function () {
                        const file = this.files[0];
                        if (file) {
                            uploadImage(file).then(url => {
                                callback(url, { alt: file.name });
                            }).catch(error => {
                                console.error('Error uploading image:', error);
                                showNotification('Erro ao fazer upload da imagem', 'error');
                            });
                        }
                    };
                    
                    input.click();
                }
            },
            image_advtab: true,
            image_caption: true,
            image_dimensions: false,
            file_picker_types: 'image',
            automatic_uploads: true,
            init_instance_callback: function (editor) {
                // Handle any initialization errors
                if (editor.getElement()) {
                    console.log('✅ TinyMCE editor ready for:', editor.id);
                }
            }
        }).catch(error => {
            console.error('❌ TinyMCE initialization failed:', error);
            initFallbackEditor();
        });
    } else {
        console.warn('⚠️ TinyMCE not loaded, initializing fallback editor');
        initFallbackEditor();
    }
}

// Fallback rich text editor
function initFallbackEditor() {
    const contentElement = document.getElementById('post-content');
    if (!contentElement) return;
    
    // Convert to textarea if it's a div
    if (contentElement.tagName === 'DIV') {
        const textarea = document.createElement('textarea');
        textarea.id = 'post-content';
        textarea.name = 'content';
        textarea.className = 'form-textarea fallback-editor';
        textarea.rows = 15;
        textarea.placeholder = 'Digite o conteúdo do decreto aqui...';
        textarea.value = contentElement.innerHTML || '';
        
        contentElement.parentNode.replaceChild(textarea, contentElement);
        
        // Add basic formatting toolbar functionality
        setupFallbackToolbar();
        
        console.log('✅ Fallback editor initialized');
        showNotification('Editor de texto básico carregado', 'info');
    }
}

// Setup fallback toolbar
function setupFallbackToolbar() {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;
    
    const toolbarButtons = toolbar.querySelectorAll('.toolbar-btn');
    toolbarButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            const textarea = document.getElementById('post-content');
            
            if (textarea && textarea.tagName === 'TEXTAREA') {
                // Basic text manipulation for textarea
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                let replacement = selectedText;
                
                switch(command) {
                    case 'bold':
                        replacement = `**${selectedText}**`;
                        break;
                    case 'italic':
                        replacement = `*${selectedText}*`;
                        break;
                    case 'insertUnorderedList':
                        replacement = selectedText.split('\n').map(line => line.trim() ? `• ${line}` : line).join('\n');
                        break;
                    case 'insertOrderedList':
                        replacement = selectedText.split('\n').map((line, index) => line.trim() ? `${index + 1}. ${line}` : line).join('\n');
                        break;
                }
                
                textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
                textarea.focus();
                textarea.setSelectionRange(start, start + replacement.length);
            }
        });
    });
}

// Auth state management
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        userNameEl.textContent = user.email.split('@')[0];
        initializeAdmin();
    } else {
        window.location.href = 'login.html';
    }
});

// Initialize admin panel
async function initializeAdmin() {
    await loadPosts();
    updateDashboard();
    initTinyMCE();
    setupEventListeners();
    updateCurrentDate();
}

// Event listeners
function setupEventListeners() {
    // Logout
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        });
    });

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            showSection(sectionId);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Post editor modal
    document.getElementById('create-post-btn').addEventListener('click', () => openPostEditor());
    document.getElementById('new-post-btn').addEventListener('click', () => openPostEditor());
    document.getElementById('close-editor').addEventListener('click', () => closePostEditor());
    document.getElementById('cancel-edit').addEventListener('click', () => closePostEditor());

    // Post form
    postForm.addEventListener('submit', handlePostSubmit);

    // Tags input
    const tagsInput = document.getElementById('post-tags-input');
    tagsInput.addEventListener('keydown', handleTagInput);

    // Meta description counter
    const metaDesc = document.getElementById('meta-description');
    metaDesc.addEventListener('input', updateCharacterCount);

    // Search and filters
    document.getElementById('search-posts').addEventListener('input', filterPosts);
    document.getElementById('category-filter').addEventListener('change', filterPosts);
    document.getElementById('status-filter').addEventListener('change', filterPosts);
    document.getElementById('date-filter').addEventListener('change', filterPosts);
    document.getElementById('priority-filter').addEventListener('change', filterPosts);
}

// Navigation functions
function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Post management functions
async function loadPosts() {
    try {
        const q = query(collection(db, 'posts'), orderBy('publishDate', 'desc'));
        const querySnapshot = await getDocs(q);
        
        posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        
        renderPostsList();
        renderRecentPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        showNotification('Erro ao carregar posts', 'error');
    }
}

function renderPostsList() {
    if (posts.length === 0) {
        postsListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>Nenhum decreto encontrado</h3>
                <p>Comece criando seu primeiro decreto ou comunicado.</p>
                <button class="btn-primary" onclick="openPostEditor()">Criar Primeiro Decreto</button>
            </div>
        `;
        return;
    }

    postsListEl.innerHTML = posts.map(post => `
        <div class="post-item" data-post-id="${post.id}">
            <div class="post-item-content">
                <div class="post-header">
                    <h3 class="post-title">${post.title}</h3>
                    <div class="post-meta">
                        <span class="post-category ${post.category}">${getCategoryLabel(post.category)}</span>
                        <span class="post-status ${post.status}">${getStatusLabel(post.status)}</span>
                        ${post.priority && post.priority !== 'normal' ? `<span class="post-priority ${post.priority}">${getPriorityLabel(post.priority)}</span>` : ''}
                    </div>
                </div>
                <p class="post-excerpt">${post.excerpt || 'Sem resumo disponível'}</p>
                <div class="post-footer">
                    <span class="post-date">📅 ${formatDate(post.publishDate)}</span>
                    ${post.tags ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                </div>
            </div>
            <div class="post-actions">
                <button class="btn-edit" onclick="editPost('${post.id}')">✏️ Editar</button>
                <button class="btn-delete" onclick="deletePost('${post.id}')">🗑️ Excluir</button>
                ${post.status === 'published' ? `<button class="btn-view" onclick="viewPost('${post.id}')">👁️ Ver</button>` : ''}
            </div>
        </div>
    `).join('');
}

function renderRecentPosts() {
    const recentPosts = posts.slice(0, 5);
    
    if (recentPosts.length === 0) {
        recentPostsEl.innerHTML = '<p class="no-posts">Nenhuma publicação recente</p>';
        return;
    }

    recentPostsEl.innerHTML = recentPosts.map(post => `
        <div class="recent-post-item">
            <div class="recent-post-content">
                <h4 class="recent-post-title">${post.title}</h4>
                <div class="recent-post-meta">
                    <span class="recent-post-category">${getCategoryLabel(post.category)}</span>
                    <span class="recent-post-date">${formatDate(post.publishDate)}</span>
                </div>
            </div>
            <div class="recent-post-actions">
                <button class="btn-small" onclick="editPost('${post.id}')">Editar</button>
            </div>
        </div>
    `).join('');
}

// Post editor functions
function openPostEditor(postId = null) {
    currentEditingPost = postId;
    
    if (postId) {
        const post = posts.find(p => p.id === postId);
        if (post) {
            populatePostForm(post);
            document.getElementById('editor-title').textContent = 'Editar Decreto';
        }
    } else {
        resetPostForm();
        document.getElementById('editor-title').textContent = 'Novo Decreto';
    }
    
    postEditorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePostEditor() {
    postEditorModal.classList.remove('active');
    document.body.style.overflow = '';
    currentEditingPost = null;
    resetPostForm();
}

function populatePostForm(post) {
    document.getElementById('post-title').value = post.title || '';
    document.getElementById('post-category').value = post.category || '';
    document.getElementById('post-excerpt').value = post.excerpt || '';
    
    // Set content in TinyMCE or fallback editor
    const contentElement = document.getElementById('post-content');
    if (typeof tinymce !== 'undefined' && tinymce.get('post-content')) {
        tinymce.get('post-content').setContent(post.content || '');
    } else if (contentElement) {
        if (contentElement.tagName === 'TEXTAREA') {
            contentElement.value = post.content || '';
        } else {
            contentElement.innerHTML = post.content || '';
        }
    }
    
    document.getElementById('post-status').value = post.status || 'draft';
    document.getElementById('post-priority').value = post.priority || 'normal';
    document.getElementById('featured-image-url').value = post.featuredImage || '';
    document.getElementById('meta-description').value = post.metaDescription || '';
    
    if (post.publishDate) {
        const date = new Date(post.publishDate.seconds * 1000);
        document.getElementById('post-date').value = date.toISOString().slice(0, 16);
    }
    
    // Populate tags
    postTags = post.tags || [];
    renderTags();
}

function resetPostForm() {
    postForm.reset();
    postTags = [];
    renderTags();
    
    // Reset content editor
    const contentElement = document.getElementById('post-content');
    if (typeof tinymce !== 'undefined' && tinymce.get('post-content')) {
        tinymce.get('post-content').setContent('');
    } else if (contentElement) {
        if (contentElement.tagName === 'TEXTAREA') {
            contentElement.value = '';
        } else {
            contentElement.innerHTML = '';
        }
    }
    
    // Set default date to now
    const now = new Date();
    document.getElementById('post-date').value = now.toISOString().slice(0, 16);
}

async function handlePostSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('save-post');
    submitBtn.classList.add('loading');
    
    try {
        const formData = new FormData(postForm);
        let content = '';
        
        // Get content from TinyMCE or fallback textarea
        const contentElement = document.getElementById('post-content');
        if (typeof tinymce !== 'undefined' && tinymce.get('post-content')) {
            content = tinymce.get('post-content').getContent();
        } else if (contentElement) {
            content = contentElement.value || contentElement.innerHTML || '';
        }
        
        const postData = {
            title: formData.get('title'),
            category: formData.get('category'),
            excerpt: formData.get('excerpt'),
            content: content,
            status: formData.get('status'),
            priority: formData.get('priority'),
            featuredImage: formData.get('featuredImage'),
            metaDescription: formData.get('metaDescription'),
            tags: postTags,
            publishDate: formData.get('publishDate') ? new Date(formData.get('publishDate')) : new Date(),
            updatedAt: serverTimestamp()
        };
        
        if (currentEditingPost) {
            await updateDoc(doc(db, 'posts', currentEditingPost), postData);
            showNotification('Decreto atualizado com sucesso!', 'success');
        } else {
            postData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'posts'), postData);
            showNotification('Decreto criado com sucesso!', 'success');
        }
        
        closePostEditor();
        await loadPosts();
        updateDashboard();
        
    } catch (error) {
        console.error('Error saving post:', error);
        showNotification('Erro ao salvar decreto', 'error');
    } finally {
        submitBtn.classList.remove('loading');
    }
}

// Image upload function
async function uploadImage(file) {
    try {
        const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Erro ao enviar imagem', 'error');
        throw error;
    }
}

// Tag management
function handleTagInput(e) {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(e.target.value.trim());
        e.target.value = '';
    }
}


// Utility functions
function getCategoryLabel(category) {
    const labels = {
        'decretos': 'Decretos',
        'comunicados': 'Comunicados',
        'noticias': 'Notícias',
        'homilias': 'Homilias'
    };
    return labels[category] || category;
}

function getStatusLabel(status) {
    const labels = {
        'published': 'Publicado',
        'draft': 'Rascunho'
    };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    const labels = {
        'high': 'Alta',
        'normal': 'Normal',
        'low': 'Baixa'
    };
    return labels[priority] || priority;
}

function formatDate(date) {
    if (!date) return 'Data não definida';
    
    let dateObj;
    if (date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    } else {
        dateObj = new Date(date);
    }
    
    return dateObj.toLocaleString('pt-BR');
}

function updateCharacterCount() {
    const metaDesc = document.getElementById('meta-description');
    const counter = document.querySelector('.character-count');
    const count = metaDesc.value.length;
    counter.textContent = `${count}/160 caracteres`;
    
    if (count > 160) {
        counter.style.color = '#dc3545';
    } else if (count > 140) {
        counter.style.color = '#ffc107';
    } else {
        counter.style.color = '#6c757d';
    }
}

function updateCurrentDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    document.getElementById('today-date').textContent = today.toLocaleDateString('pt-BR', options);
}

function updateDashboard() {
    // Update statistics
    document.getElementById('total-posts').textContent = posts.length;
    
    const thisMonth = new Date();
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const postsThisMonth = posts.filter(post => {
        let postDate;
        if (post.publishDate && post.publishDate.seconds) {
            postDate = new Date(post.publishDate.seconds * 1000);
        } else {
            postDate = new Date(post.publishDate);
        }
        return postDate >= startOfMonth;
    });
    
    document.getElementById('posts-this-month').textContent = postsThisMonth.length;
}

// Filter and search functions
function filterPosts() {
    const searchTerm = document.getElementById('search-posts').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    
    let filteredPosts = posts.filter(post => {
        const matchesSearch = !searchTerm || 
            post.title.toLowerCase().includes(searchTerm) ||
            (post.content && post.content.toLowerCase().includes(searchTerm)) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        
        const matchesCategory = !categoryFilter || post.category === categoryFilter;
        const matchesStatus = !statusFilter || post.status === statusFilter;
        const matchesPriority = !priorityFilter || post.priority === priorityFilter;
        
        return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    });
    
    // Temporarily update posts array for rendering
    const originalPosts = [...posts];
    posts = filteredPosts;
    renderPostsList();
    posts = originalPosts;
}

// Global functions for onclick handlers
window.editPost = (postId) => openPostEditor(postId);
window.deletePost = async (postId) => {
    if (confirm('Tem certeza que deseja excluir este decreto?')) {
        try {
            await deleteDoc(doc(db, 'posts', postId));
            showNotification('Decreto excluído com sucesso!', 'success');
            await loadPosts();
            updateDashboard();
        } catch (error) {
            console.error('Error deleting post:', error);
            showNotification('Erro ao excluir decreto', 'error');
        }
    }
};

window.viewPost = (postId) => {
    window.open(`post.html?id=${postId}`, '_blank');
};

window.removeTag = removeTag;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM is already loaded since this is a module script
});

// Limpar todos os filtros
window.clearAllFilters = function() {
    document.getElementById('category-filter').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('priority-filter').value = '';
    document.getElementById('date-filter').value = '';
    document.getElementById('search-posts').value = '';
    
    renderPostsList();
    updateFilterStats(posts);
};

// Melhorar o sistema de tags com autocomplete
function setupTagsSystem() {
    const tagsInput = document.getElementById('post-tags-input');
    const tagsContainer = document.getElementById('post-tags-container');
    
    if (!tagsInput) return;
    
    // Criar container de sugestões
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'tags-suggestions';
    suggestionsContainer.style.display = 'none';
    tagsInput.parentNode.insertBefore(suggestionsContainer, tagsInput.nextSibling);
    
    // Event listeners
    tagsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagsInput.value.trim());
            tagsInput.value = '';
            hideSuggestions();
        }
        
        if (e.key === 'Escape') {
            hideSuggestions();
        }
    });
    
    tagsInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value.length > 1) {
            showTagSuggestions(value);
        } else {
            hideSuggestions();
        }
    });
    
    tagsInput.addEventListener('blur', (e) => {
        // Delay para permitir clique nas sugestões
        setTimeout(() => {
            if (tagsInput.value.trim()) {
                addTag(tagsInput.value.trim());
                tagsInput.value = '';
            }
            hideSuggestions();
        }, 200);
    });
    
    function showTagSuggestions(searchTerm) {
        if (!window.availableTags) return;
        
        const matches = window.availableTags.filter(tag => 
            tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !postTags.includes(tag)
        );
        
        if (matches.length === 0) {
            hideSuggestions();
            return;
        }
        
        const suggestionsHTML = matches.slice(0, 5).map(tag => 
            `<button type="button" class="tag-suggestion" onclick="selectTagSuggestion('${tag}')">${tag}</button>`
        ).join('');
        
        suggestionsContainer.innerHTML = suggestionsHTML;
        suggestionsContainer.style.display = 'block';
    }
    
    function hideSuggestions() {
        suggestionsContainer.style.display = 'none';
    }
    
    window.selectTagSuggestion = function(tag) {
        addTag(tag);
        tagsInput.value = '';
        hideSuggestions();
        tagsInput.focus();
    };
}

// Função para obter estatísticas por categoria
function getCategoryStats() {
    const stats = {
        decretos: 0,
        comunicados: 0,
        noticias: 0,
        homilias: 0
    };
    
    posts.forEach(post => {
        if (stats.hasOwnProperty(post.category)) {
            stats[post.category]++;
        }
    });
    
    return stats;
}

// Atualizar estatísticas do dashboard com mais detalhes
function updateDashboardStats() {
    // Stats básicas
    const totalElement = document.getElementById('total-posts');
    const monthElement = document.getElementById('posts-this-month');
    
    if (totalElement) totalElement.textContent = posts.length;
    
    const thisMonth = posts.filter(post => {
        if (!post.createdAt) return false;
        const postDate = new Date(post.createdAt.seconds * 1000);
        const now = new Date();
        return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
    }).length;
    
    if (monthElement) monthElement.textContent = thisMonth;
    
    // Adicionar gráfico de categorias se não existir
    addCategoryChart();
}

// Adicionar gráfico simples de categorias
function addCategoryChart() {
    const dashboardGrid = document.querySelector('.dashboard-grid');
    let chartWidget = document.getElementById('category-chart-widget');
    
    if (!chartWidget) {
        chartWidget = document.createElement('div');
        chartWidget.id = 'category-chart-widget';
        chartWidget.className = 'dashboard-widget';
        chartWidget.innerHTML = `
            <h3 class="widget-title">Publicações por Categoria</h3>
            <div class="category-chart" id="category-chart"></div>
        `;
        dashboardGrid.appendChild(chartWidget);
    }
    
    const stats = getCategoryStats();
    const chartContainer = document.getElementById('category-chart');
    
    const chartHTML = Object.entries(stats).map(([category, count]) => {
        const percentage = posts.length > 0 ? (count / posts.length * 100) : 0;
        return `
            <div class="chart-item">
                <div class="chart-label">
                    <span class="chart-category">${getCategoryLabel(category)}</span>
                    <span class="chart-count">${count}</span>
                </div>
                <div class="chart-bar">
                    <div class="chart-fill category-${category}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
    
    chartContainer.innerHTML = chartHTML;
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Fechar notificação
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Expor funções necessárias globalmente
window.removeTag = removeTag;
window.openPostEditor = () => openPostEditor();
window.editPost = (postId) => openPostEditor(postId);
window.deletePost = deletePost;
window.duplicatePost = async function(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    try {
        const duplicatedPost = {
            ...post,
            title: `${post.title} (Cópia)`,
            status: 'draft',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            views: 0
        };
        
        delete duplicatedPost.id;
        
        await addDoc(collection(db, 'posts'), duplicatedPost);
        showNotification('Decreto duplicado com sucesso!', 'success');
        await loadPosts();
        
    } catch (error) {
        console.error('Erro ao duplicar post:', error);
        showNotification('Erro ao duplicar o decreto.', 'error');
    }
};

function renderFilteredPosts(filteredPosts) {
    if (filteredPosts.length === 0) {
        postsListElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente ajustar os filtros ou o termo de busca.</p>
            </div>
        `;
        return;
    }
    
    // Usar a mesma lógica da renderPostsList mas com os posts filtrados
    const originalPosts = posts;
    posts = filteredPosts;
    renderPostsList();
    posts = originalPosts;
}

// Configurar contador de caracteres
function setupCharacterCounter() {
    const metaDescription = document.getElementById('meta-description');
    const charCount = document.querySelector('.character-count');
    
    if (metaDescription && charCount) {
        metaDescription.addEventListener('input', () => {
            const length = metaDescription.value.length;
            charCount.textContent = `${length}/160 caracteres`;
            charCount.classList.toggle('over-limit', length > 160);
        });
    }
}

function addTag(tagText) {
    if (!tagText || postTags.includes(tagText)) return;
    
    postTags.push(tagText);
    renderTags();
}

function removeTag(tagToRemove) {
    postTags = postTags.filter(tag => tag !== tagToRemove);
    renderTags();
}

function renderTags() {
    const tagsContainer = document.getElementById('post-tags-container');
    if (!tagsContainer) return;
    
    const tagsHTML = postTags.map(tag => `
        <span class="tag-item">
            ${tag}
            <button type="button" class="tag-remove" onclick="removeTag('${tag}')">&times;</button>
        </span>
    `).join('');
    tagsContainer.innerHTML = tagsHTML;
}

// Atualizar posts recentes no dashboard
function updateRecentPosts() {
    if (!recentPostsElement) return;
    
    const recentPosts = posts.slice(0, 5);
    
    if (recentPosts.length === 0) {
        recentPostsElement.innerHTML = '<p class="no-posts">Nenhuma publicação encontrada.</p>';
        return;
    }
    
    const recentPostsHTML = recentPosts.map(post => {
        const date = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
        return `
            <div class="recent-post-item">
                <div class="recent-post-content">
                    <h4 class="recent-post-title">${post.title}</h4>
                    <div class="recent-post-meta">
                        <span class="recent-post-category">${getCategoryLabel(post.category)}</span>
                        <span class="recent-post-date">${formatDate(date)}</span>
                    </div>
                </div>
                <button class="recent-post-edit" onclick="editPost('${post.id}')">✏️</button>
            </div>
        `;
    }).join('');
    
    recentPostsElement.innerHTML = recentPostsHTML;
}

// Atualizar data de hoje
function updateTodayDate() {
    const today = new Date();
    const todayElement = document.getElementById('today-date');
    if (todayElement) {
        todayElement.textContent = today.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }
}

// Remover duplicações no final do arquivo
function getPriorityName(priority) {
    const priorities = {
        'high': 'Alta',
        'normal': 'Normal',
        'low': 'Baixa'
    };
    return priorities[priority] || 'Normal';
}

console.log('🔥 Admin Panel v3.0 carregado - Sistema avançado de categorias e gestão! ⛪');
