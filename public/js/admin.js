import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-storage.js';
// Não precisamos mais do 'getFunctions' para este fluxo!

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBUuKIfxUXGHIPH2eQBwUggWawexQ3-L5A",
    authDomain: "belem-hb.firebaseapp.com",
    projectId: "belem-hb",
    storageBucket: "belem-hb.appspot.com",
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
let currentUserRole = null;
let currentEditingPost = null;
let posts = [];

const roleNames = {
    superAdmin: 'Super Admin',
    siteAdmin: 'Admin do Site',
    editor: 'Editor',
    autor: 'Autor'
};

// DOM Elements
const userNameEl = document.getElementById('user-name');
const userRoleDisplayEl = document.getElementById('user-role-display');
const logoutBtn = document.getElementById('logout-btn');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.admin-section');
const postEditorModal = document.getElementById('post-editor-modal');
const postForm = document.getElementById('post-form');
const postsListEl = document.getElementById('posts-list');
const recentPostsEl = document.getElementById('recent-posts');


/**
 * Busca a permissão (role) do usuário diretamente da coleção 'roles' no Firestore.
 * @param {object} user - O objeto do usuário do Firebase.
 * @returns {string|null} - A string da role ou nulo se não encontrada.
 */
async function getRoleFromFirestore(user) {
    try {
        const roleDocRef = doc(db, 'roles', user.uid);
        const roleDocSnap = await getDoc(roleDocRef);

        if (roleDocSnap.exists()) {
            console.log("Documento de permissão encontrado:", roleDocSnap.data());
            return roleDocSnap.data().role;
        } else {
            console.warn("Nenhum documento de permissão encontrado para o usuário:", user.uid);
            return null;
        }
    } catch (error) {
        console.error("Erro ao buscar permissão do Firestore:", error);
        return null;
    }
}


// Auth state management - MODIFICADO para ler a role do Firestore
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const role = await getRoleFromFirestore(user);

        if (!role) {
            showNotification('Acesso negado. Você não tem permissão para acessar esta área.', 'error');
            setTimeout(() => signOut(auth), 4000);
            return;
        }
        
        currentUser = user;
        currentUserRole = role;

        userNameEl.textContent = user.displayName || user.email.split('@')[0];
        userRoleDisplayEl.textContent = roleNames[currentUserRole] || 'Desconhecido';

        initializeAdminPanel();

    } else {
        window.location.replace('login.html');
    }
});

// O RESTANTE DO SEU CÓDIGO (initializeAdminPanel, initTinyMCE, etc.) PERMANECE O MESMO
// ... (vou colar o resto para garantir a integridade do arquivo)

// Initialize admin panel
async function initializeAdminPanel() {
    setupRoleBasedUI();
    await loadPosts();
    updateDashboard();
    initTinyMCE();
    setupEventListeners();
    updateCurrentDate();
}

function setupRoleBasedUI() {
    // Esta função agora controla a seção de gestão de usuários
    const usersNavPlaceholder = document.getElementById('nav-users-placeholder');
    const usersSection = document.getElementById('users-section');
    
    if (currentUserRole === 'superAdmin' && usersNavPlaceholder) {
        usersNavPlaceholder.style.display = 'block'; // Mostra o link do menu
        // A seção agora explica como adicionar roles manualmente
        usersSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Gestão de Usuários (Manual)</h2>
            </div>
            <div class="card">
                <h3>Como Atribuir Permissões</h3>
                <p>Com este sistema gratuito, as permissões são gerenciadas diretamente no Console do Firebase:</p>
                <ol>
                    <li>Vá para <strong>Build > Firestore Database</strong>.</li>
                    <li>Crie ou acesse a coleção chamada <strong>roles</strong>.</li>
                    <li>Clique em <strong>Adicionar documento</strong>.</li>
                    <li>No campo 'ID do documento', cole o <strong>UID</strong> do usuário.</li>
                    <li>Adicione um campo chamado <strong>role</strong> (tipo string).</li>
                    <li>No valor do campo, digite a permissão: <strong>superAdmin</strong>, <strong>siteAdmin</strong>, <strong>editor</strong> ou <strong>autor</strong>.</li>
                    <li>Clique em Salvar. A permissão será aplicada no próximo login do usuário.</li>
                </ol>
                 <p>Para encontrar o UID de um usuário, vá para <strong>Build > Authentication</strong> e copie da lista.</p>
            </div>
        `;
    }
}


// Initialize TinyMCE
function initTinyMCE() {
    if (typeof tinymce === 'undefined') {
        console.warn('TinyMCE não carregado.');
        return;
    }
    tinymce.init({
        selector: '#post-content',
        height: 400,
        menubar: false,
        plugins: 'lists link image table code help wordcount',
        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image | code',
        content_style: 'body { font-family: "Open Sans", sans-serif; font-size: 14px; }',
        file_picker_callback: (callback, value, meta) => {
            if (meta.filetype === 'image') {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.onchange = async () => {
                    const file = input.files[0];
                    if (file) {
                        try {
                            const url = await uploadImage(file);
                            callback(url, { alt: file.name });
                        } catch (error) {
                             showNotification('Erro ao fazer upload da imagem', 'error');
                        }
                    }
                };
                input.click();
            }
        }
    }).catch(err => console.error("Falha ao inicializar TinyMCE: ", err));
}

// Event listeners
function setupEventListeners() {
    logoutBtn.addEventListener('click', () => signOut(auth));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            showSection(sectionId);
            document.querySelectorAll('.nav-link.active').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    document.getElementById('new-post-btn').addEventListener('click', () => openPostEditor());
    document.getElementById('close-editor').addEventListener('click', closePostEditor);
    document.getElementById('cancel-edit').addEventListener('click', closePostEditor);

    postForm.addEventListener('submit', handlePostSubmit);
}

// Navigation functions
function showSection(sectionId) {
    sections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Post management functions
async function loadPosts() {
    try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPostsList();
        renderRecentPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        showNotification('Erro ao carregar posts. Verifique suas regras de segurança do Firestore.', 'error');
    }
}

function renderPostsList() {
    if (!postsListEl) return;
    if (posts.length === 0) {
        postsListEl.innerHTML = `<div class="empty-state"><h3>Nenhum decreto encontrado</h3></div>`;
        return;
    }
    postsListEl.innerHTML = posts.map(post => `
        <div class="post-item" data-post-id="${post.id}">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-actions">
                <button class="btn-edit" data-id="${post.id}">✏️ Editar</button>
                <button class="btn-delete" data-id="${post.id}">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.post-item .btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => editPost(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.post-item .btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => deletePost(e.currentTarget.dataset.id));
    });
}


function renderRecentPosts() {
     if (!recentPostsEl) return;
    const recent = posts.slice(0, 5);
    if (recent.length === 0) {
        recentPostsEl.innerHTML = '<p>Nenhuma publicação recente</p>';
        return;
    }
    recentPostsEl.innerHTML = recent.map(post => `<div><h4>${post.title}</h4></div>`).join('');
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
    postEditorModal.style.display = 'flex';
}

function closePostEditor() {
    postEditorModal.style.display = 'none';
    currentEditingPost = null;
    resetPostForm();
}

function populatePostForm(post) {
    document.getElementById('post-title').value = post.title || '';
    if (tinymce.get('post-content')) {
        tinymce.get('post-content').setContent(post.content || '');
    }
}

function resetPostForm() {
    postForm.reset();
    if (tinymce.get('post-content')) {
        tinymce.get('post-content').setContent('');
    }
}

async function handlePostSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('save-post');
    submitBtn.disabled = true;

    try {
        const postData = {
            title: document.getElementById('post-title').value,
            content: tinymce.get('post-content').getContent(),
            author: currentUser.uid, // Salva quem criou/editou
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
        submitBtn.disabled = false;
    }
}

// Utility functions
async function uploadImage(file) {
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
}

function deletePost(postId) {
    if (confirm('Tem certeza que deseja excluir este decreto?')) {
        deleteDoc(doc(db, 'posts', postId))
            .then(async () => {
                showNotification('Decreto excluído com sucesso!', 'success');
                await loadPosts();
                updateDashboard();
            })
            .catch(error => {
                console.error('Error deleting post:', error);
                showNotification('Erro ao excluir decreto', 'error');
            });
    }
}

function editPost(postId) {
    openPostEditor(postId);
}

function updateCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('today-date');
    if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('pt-BR', options);
    }
}

function updateDashboard() {
    const totalEl = document.getElementById('total-posts');
    const monthEl = document.getElementById('posts-this-month');
    if(totalEl) totalEl.textContent = posts.length;
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const postsThisMonth = posts.filter(p => p.createdAt && p.createdAt.toDate() >= startOfMonth).length;
    if(monthEl) monthEl.textContent = postsThisMonth;
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}