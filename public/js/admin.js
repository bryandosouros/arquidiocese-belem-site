import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, Timestamp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

// Configuração do Firebase (mesma do login.html)
const firebaseConfig = {
    apiKey: "AIzaSyBUuKIfxUXGHIPH2eQBwUggWawexQ3-L5A",
    authDomain: "belem-hb.firebaseapp.com",
    projectId: "belem-hb",
    storageBucket: "belem-hb.firebasestorage.app",
    messagingSenderId: "669142237239",
    appId: "1:669142237239:web:9fa0de02efe4da6865ffb2",
    measurementId: "G-92E26Y6HB1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Estado da aplicação
let currentUser = null;
let posts = [];
let currentEditingPost = null;
let currentTags = [];

// Elementos DOM
const userNameElement = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.admin-section');
const createPostBtn = document.getElementById('create-post-btn');
const newPostBtn = document.getElementById('new-post-btn');
const postEditorModal = document.getElementById('post-editor-modal');
const closeEditorBtn = document.getElementById('close-editor');
const postForm = document.getElementById('post-form');
const postsListElement = document.getElementById('posts-list');
const recentPostsElement = document.getElementById('recent-posts');

// Verificar autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        if (userNameElement) {
            userNameElement.textContent = user.email;
        }
        initializeAdmin();
        initializeNavigation();
    } else {
        // Redirecionar para login se não estiver autenticado
        window.location.href = 'login.html';
    }
});

// Inicializar navegação entre seções
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.admin-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Show corresponding section
            const sectionId = link.getAttribute('data-section') + '-section';
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// Função de logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            alert('Erro ao sair. Tente novamente.');
        }
    });
}

// Navegação entre seções
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionName = link.dataset.section;
        showSection(sectionName);
        
        // Atualizar navegação ativa
        navLinks.forEach(nl => nl.classList.remove('active'));
        link.classList.add('active');
    });
});

function showSection(sectionName) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Carregar dados específicos da seção
    if (sectionName === 'posts') {
        loadPosts();
    } else if (sectionName === 'dashboard') {
        loadDashboardData();
    }
}

// Inicializar área administrativa
async function initializeAdmin() {
    loadDashboardData();
    setupPostEditor();
    setupFilters();
    updateTodayDate();
    updateCalendar();
    initializeTags();
    await loadPosts();
    updateDashboardStats();
}

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        await loadPosts();
        updateDashboardStats();
        updateRecentPosts();
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Carregar posts do Firestore
async function loadPosts() {
    try {
        const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        
        posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderPostsList();
        return posts;
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        postsListElement.innerHTML = '<div class="error-state">Erro ao carregar posts. Tente recarregar a página.</div>';
    }
}

// Renderizar lista de posts
function renderPostsList() {
    if (posts.length === 0) {
        postsListElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>Nenhum decreto encontrado</h3>
                <p>Comece criando seu primeiro decreto oficial.</p>
                <button class="btn-primary" onclick="openPostEditor()">
                    <span>✍️</span>
                    Criar Primeiro Decreto
                </button>
            </div>
        `;
        return;
    }
    
    const postsHTML = posts.map(post => {
        const date = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
        const statusBadge = getStatusBadge(post.status);
        const priorityBadge = getPriorityBadge(post.priority);
        
        return `
            <div class="post-item" data-post-id="${post.id}">
                <div class="post-content">
                    <div class="post-header">
                        <h3 class="post-title">${post.title}</h3>
                        <div class="post-badges">
                            ${statusBadge}
                            ${priorityBadge}
                        </div>
                    </div>
                    <div class="post-meta">
                        <span class="post-category">${getCategoryLabel(post.category)}</span>
                        <span class="post-date">${formatDate(date)}</span>
                        ${post.tags ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                    </div>
                    <p class="post-excerpt">${post.excerpt || 'Sem resumo disponível.'}</p>
                </div>
                <div class="post-actions">
                    <button class="action-btn edit-btn" onclick="editPost('${post.id}')">
                        <span>✏️</span>
                        Editar
                    </button>
                    <button class="action-btn duplicate-btn" onclick="duplicatePost('${post.id}')">
                        <span>📋</span>
                        Duplicar
                    </button>
                    <button class="action-btn delete-btn" onclick="deletePost('${post.id}')">
                        <span>🗑️</span>
                        Excluir
                    </button>
                    ${post.status === 'published' ? 
                        `<a href="noticia.html?id=${post.id}" target="_blank" class="action-btn view-btn">
                            <span>👁️</span>
                            Ver
                        </a>` : ''
                    }
                </div>
            </div>
        `;
    }).join('');
    
    postsListElement.innerHTML = postsHTML;
}

// Funções auxiliares para badges e formatação
function getStatusBadge(status) {
    const badges = {
        published: '<span class="badge badge-success">Publicado</span>',
        draft: '<span class="badge badge-warning">Rascunho</span>'
    };
    return badges[status] || '';
}

function getPriorityBadge(priority) {
    const badges = {
        high: '<span class="badge badge-danger">Alta Prioridade</span>',
        normal: '<span class="badge badge-info">Normal</span>',
        low: '<span class="badge badge-secondary">Baixa</span>'
    };
    return badges[priority] || '';
}

function getCategoryLabel(category) {
    const labels = {
        decretos: 'Decretos',
        comunicados: 'Comunicados',
        noticias: 'Notícias',
        homilias: 'Homilias'
    };
    return labels[category] || category;
}

function formatDate(date) {
    if (!date) return 'Data não disponível';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Configurar editor de posts
function setupPostEditor() {
    // Botões para abrir editor
    createPostBtn.addEventListener('click', () => openPostEditor());
    newPostBtn.addEventListener('click', () => openPostEditor());
    
    // Fechar modal
    closeEditorBtn.addEventListener('click', closePostEditor);
    document.getElementById('cancel-edit').addEventListener('click', closePostEditor);
    
    // Fechar modal clicando fora
    postEditorModal.addEventListener('click', (e) => {
        if (e.target === postEditorModal) {
            closePostEditor();
        }
    });
    
    // Submissão do formulário
    postForm.addEventListener('submit', handlePostSubmit);
    
    // Configurar toolbar do editor
    setupEditorToolbar();
    
    // Configurar sistema de tags
    setupTagsSystem();
    
    // Configurar contador de caracteres
    setupCharacterCounter();
}

// Configurar toolbar do editor
function setupEditorToolbar() {
    const toolbarBtns = document.querySelectorAll('.toolbar-btn');
    const contentEditor = document.getElementById('post-content');
    
    toolbarBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            document.execCommand(command, false, null);
            contentEditor.focus();
        });
    });
}

// Abrir editor de posts
function openPostEditor(postId = null) {
    currentEditingPost = postId;
    currentTags = [];
    
    if (postId) {
        // Editar post existente
        const post = posts.find(p => p.id === postId);
        if (post) {
            document.getElementById('editor-title').textContent = 'Editar Decreto';
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-category').value = post.category;
            document.getElementById('post-excerpt').value = post.excerpt || '';
            document.getElementById('post-content').innerHTML = post.content || '';
            document.getElementById('post-status').value = post.status;
            document.getElementById('post-priority').value = post.priority || 'normal';
            document.getElementById('featured-image-url').value = post.featuredImage || '';
            document.getElementById('meta-description').value = post.metaDescription || '';
            
            if (post.publishDate) {
                const date = new Date(post.publishDate.seconds * 1000);
                document.getElementById('post-date').value = date.toISOString().slice(0, 16);
            }
            
            currentTags = post.tags || [];
            renderTags();
        }
    } else {
        // Novo post
        document.getElementById('editor-title').textContent = 'Novo Decreto';
        postForm.reset();
        document.getElementById('post-content').innerHTML = '';
        document.getElementById('post-date').value = new Date().toISOString().slice(0, 16);
        renderTags();
    }
    
    // Show modal
    if (postEditorModal) {
        postEditorModal.style.display = 'flex';
        postEditorModal.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
}

// Fechar editor
function closePostEditor() {
    if (postEditorModal) {
        postEditorModal.style.display = 'none';
        postEditorModal.classList.remove('active');
    }
    document.body.style.overflow = '';
    currentEditingPost = null;
    currentTags = [];
}

// Submeter formulário
async function handlePostSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('save-post');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Mostrar loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(postForm);
        const postData = {
            title: formData.get('title'),
            category: formData.get('category'),
            excerpt: formData.get('excerpt'),
            content: document.getElementById('post-content').innerHTML,
            status: formData.get('status'),
            priority: formData.get('priority'),
            featuredImage: formData.get('featuredImage'),
            metaDescription: formData.get('metaDescription'),
            tags: currentTags,
            publishDate: formData.get('publishDate') ? Timestamp.fromDate(new Date(formData.get('publishDate'))) : Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        
        if (currentEditingPost) {
            // Atualizar post existente
            await updateDoc(doc(db, 'posts', currentEditingPost), postData);
            showNotification('Decreto atualizado com sucesso!', 'success');
        } else {
            // Criar novo post
            postData.createdAt = Timestamp.now();
            postData.author = currentUser.email;
            await addDoc(collection(db, 'posts'), postData);
            showNotification('Decreto criado com sucesso!', 'success');
        }
        
        closePostEditor();
        loadPosts();
        
    } catch (error) {
        console.error('Erro ao salvar post:', error);
        showNotification('Erro ao salvar decreto. Tente novamente.', 'error');
    } finally {
        // Restaurar botão
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Excluir post
window.deletePost = async function(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const confirmed = confirm(`Tem certeza que deseja excluir o decreto "${post.title}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmed) return;
    
    try {
        await deleteDoc(doc(db, 'posts', postId));
        showNotification('Decreto excluído com sucesso!', 'success');
        loadPosts();
    } catch (error) {
        console.error('Erro ao excluir post:', error);
        showNotification('Erro ao excluir decreto. Tente novamente.', 'error');
    }
};

// Configurar filtros
function setupFilters() {
    const filters = ['category-filter', 'status-filter', 'date-filter', 'priority-filter'];
    const searchInput = document.getElementById('search-posts');
    
    filters.forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', applyFilters);
    });
    
    searchInput.addEventListener('input', applyFilters);
}

// Aplicar filtros
function applyFilters() {
    filterPosts();
}

// Atualizar calendário
function updateCalendar() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const todayElement = document.getElementById('today-date');
    if (todayElement) {
        todayElement.textContent = today.toLocaleDateString('pt-BR', options);
    }
}

// Inicializar sistema de tags
function initializeTags() {
    // Carregar tags existentes do Firestore para sugestões
    loadExistingTags();
}

// Carregar tags existentes
async function loadExistingTags() {
    try {
        const postsQuery = query(collection(db, 'posts'));
        const querySnapshot = await getDocs(postsQuery);
        
        const allTags = new Set();
        querySnapshot.forEach((doc) => {
            const post = doc.data();
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        // Armazenar para autocomplete
        window.availableTags = Array.from(allTags);
        
    } catch (error) {
        console.error('Erro ao carregar tags:', error);
    }
}

// Melhorar o sistema de filtros
function filterPosts() {
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const priorityFilter = document.getElementById('priority-filter')?.value || '';
    const dateFilter = document.getElementById('date-filter')?.value || '';
    const searchTerm = document.getElementById('search-posts')?.value.toLowerCase() || '';
    
    let filteredPosts = [...posts];
    
    // Filtro por categoria
    if (categoryFilter) {
        filteredPosts = filteredPosts.filter(post => post.category === categoryFilter);
    }
    
    // Filtro por status
    if (statusFilter) {
        filteredPosts = filteredPosts.filter(post => post.status === statusFilter);
    }
    
    // Filtro por prioridade
    if (priorityFilter) {
        filteredPosts = filteredPosts.filter(post => post.priority === priorityFilter);
    }
    
    // Filtro por data
    if (dateFilter) {
        const now = new Date();
        filteredPosts = filteredPosts.filter(post => {
            if (!post.createdAt) return false;
            const postDate = new Date(post.createdAt.seconds * 1000);
            
            switch (dateFilter) {
                case 'today':
                    return postDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return postDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return postDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    // Filtro por busca (título, excerpt, tags)
    if (searchTerm) {
        filteredPosts = filteredPosts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(searchTerm);
            const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(searchTerm);
            const contentMatch = post.content && post.content.toLowerCase().includes(searchTerm);
            const tagsMatch = post.tags && post.tags.some(tag => 
                tag.toLowerCase().includes(searchTerm)
            );
            
            return titleMatch || excerptMatch || contentMatch || tagsMatch;
        });
    }
    
    renderFilteredPosts(filteredPosts);
    updateFilterStats(filteredPosts);
}

// Atualizar estatísticas dos filtros
function updateFilterStats(filteredPosts) {
    const postsSection = document.getElementById('posts-section');
    let statsElement = postsSection.querySelector('.filter-stats');
    
    if (!statsElement) {
        statsElement = document.createElement('div');
        statsElement.className = 'filter-stats';
        const filtersContainer = postsSection.querySelector('.posts-filters');
        filtersContainer.parentNode.insertBefore(statsElement, filtersContainer.nextSibling);
    }
    
    const totalPosts = posts.length;
    const filteredCount = filteredPosts.length;
    
    if (filteredCount === totalPosts) {
        statsElement.innerHTML = `
            <div class="stats-item">
                <span class="stats-count">${totalPosts}</span>
                <span class="stats-label">decretos encontrados</span>
            </div>
        `;
    } else {
        statsElement.innerHTML = `
            <div class="stats-item">
                <span class="stats-count">${filteredCount}</span>
                <span class="stats-label">de ${totalPosts} decretos</span>
            </div>
            <button class="clear-filters-btn" onclick="clearAllFilters()">
                <span>🗑️</span>
                Limpar Filtros
            </button>
        `;
    }
}

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
            !currentTags.includes(tag)
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
    if (!tagText || currentTags.includes(tagText)) return;
    
    currentTags.push(tagText);
    renderTags();
}

function removeTag(tagToRemove) {
    currentTags = currentTags.filter(tag => tag !== tagToRemove);
    renderTags();
}

function renderTags() {
    const tagsContainer = document.getElementById('post-tags-container');
    if (!tagsContainer) return;
    
    const tagsHTML = currentTags.map(tag => `
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
