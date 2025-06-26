/**
 * User Management System for Cúria Digital
 * Integração com Firebase Auth e Firestore para gerenciamento de usuários
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
    deleteUser,
    updatePassword
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where, 
    Timestamp,
    setDoc 
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBUuKIfxUXGHIPH2eQBwUggWawexQ3-L5A",
    authDomain: "belem-hb.firebaseapp.com",
    projectId: "belem-hb",
    storageBucket: "belem-hb.firebasestorage.app",
    messagingSenderId: "669142237239",
    appId: "1:669142237239:web:9fa0de02efe4da6865ffb2",
    measurementId: "G-92E26Y6HB1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// User Management Class
class UserManager {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            await this.loadUsers();
            this.setupEventListeners();
            this.updateStats();
        } catch (error) {
            console.error('Error initializing User Manager:', error);
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-users');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filterUsers();
            }, 300));
        }

        // Filter functionality
        const roleFilter = document.getElementById('role-filter');
        const statusFilter = document.getElementById('status-user-filter');
        
        if (roleFilter) roleFilter.addEventListener('change', () => this.filterUsers());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterUsers());

        // Modal controls
        const createUserBtn = document.getElementById('create-user-btn');
        const userForm = document.getElementById('user-form');
        
        if (createUserBtn) {
            createUserBtn.addEventListener('click', () => this.openCreateUserModal());
        }
        
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleUserFormSubmit(e));
        }

        // Bulk actions
        const bulkApprove = document.getElementById('bulk-activate');
        const bulkDeactivate = document.getElementById('bulk-deactivate');
        const bulkDelete = document.getElementById('bulk-delete');
        
        if (bulkApprove) bulkApprove.addEventListener('click', () => this.bulkActivateUsers());
        if (bulkDeactivate) bulkDeactivate.addEventListener('click', () => this.bulkDeactivateUsers());
        if (bulkDelete) bulkDelete.addEventListener('click', () => this.bulkDeleteUsers());
    }

    async loadUsers() {
        try {
            // First try to load from Firebase
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(usersQuery);
            
            this.users = [];
            querySnapshot.forEach((doc) => {
                this.users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // If no users found in Firebase, create some initial admin users
            if (this.users.length === 0) {
                console.log('No users found in Firebase. Creating initial admin user...');
                await this.createInitialAdminUser();
                // Reload after creating initial user
                const newQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                const newSnapshot = await getDocs(newQuery);
                this.users = [];
                newSnapshot.forEach((doc) => {
                    this.users.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }

            this.filteredUsers = [...this.users];
            this.renderUsers();
            this.updateStats();
            
            console.log('Users loaded from Firebase:', this.users.length);
        } catch (error) {
            console.error('Error loading users from Firebase:', error);
            // Only fallback to mock data if Firebase is completely unavailable
            this.loadMockUsersAsFallback();
        }
    }

    async createInitialAdminUser() {
        try {
            // Get current authenticated user
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userDoc = {
                    name: currentUser.displayName || 'Administrador Sistema',
                    email: currentUser.email,
                    role: 'admin',
                    status: 'active',
                    permissions: ['create_posts', 'edit_posts', 'delete_posts', 'moderate_comments', 'manage_media', 'manage_users', 'system_settings', 'analytics'],
                    notes: 'Usuário administrador inicial criado automaticamente',
                    createdAt: Timestamp.now(),
                    lastAccess: Timestamp.now(),
                    uid: currentUser.uid
                };

                await setDoc(doc(db, 'users', currentUser.uid), userDoc);
                console.log('Initial admin user created successfully');
            }
        } catch (error) {
            console.error('Error creating initial admin user:', error);
        }
    }

    loadMockUsersAsFallback() {
        console.warn('Loading mock users as fallback - Firebase connection failed');
        this.users = [
            {
                id: 'fallback-1',
                name: 'Administrador (Fallback)',
                email: 'admin@arquidiocesebelem.org.br',
                role: 'admin',
                status: 'active',
                lastAccess: new Date(),
                createdAt: new Date(),
                permissions: ['create_posts', 'edit_posts', 'delete_posts', 'moderate_comments', 'manage_media', 'manage_users', 'system_settings', 'analytics'],
                notes: 'Usuário de fallback - conecte-se ao Firebase para gerenciamento real'
            }
        ];

        this.filteredUsers = [...this.users];
        this.renderUsers();
        this.updateStats();
        
        // Show warning message
        this.showFirebaseWarning();
    }

    showFirebaseWarning() {
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            const warningRow = document.createElement('tr');
            warningRow.className = 'warning-row';
            warningRow.innerHTML = `
                <td colspan="7" style="background: rgba(245, 158, 11, 0.1); color: #d97706; text-align: center; padding: 1rem;">
                    ⚠️ Modo Offline - Conecte-se ao Firebase para gerenciamento real de usuários
                </td>
            `;
            tbody.insertBefore(warningRow, tbody.firstChild);
        }
    }

    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-users">
                        <div class="empty-state">
                            <p>Nenhum usuário encontrado</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" value="${user.id}" class="user-checkbox">
                </td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${this.getInitials(user.name)}</div>
                        <div class="user-details">
                            <div class="user-name">${user.name}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="user-role ${user.role}">${this.translateRole(user.role)}</span></td>
                <td><span class="user-status ${user.status}">${this.translateStatus(user.status)}</span></td>
                <td>${user.lastAccess ? this.formatDate(user.lastAccess) : 'Nunca'}</td>
                <td>
                    <div class="user-actions">
                        <button class="user-action-btn edit" onclick="userManager.editUser('${user.id}')" title="Editar usuário">
                            ✏️
                        </button>
                        <button class="user-action-btn delete" onclick="userManager.deleteUser('${user.id}')" title="Excluir usuário">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners to checkboxes
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateBulkActions());
        });
    }

    filterUsers() {
        const searchTerm = document.getElementById('search-users')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('role-filter')?.value || '';
        const statusFilter = document.getElementById('status-user-filter')?.value || '';

        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                                user.email.toLowerCase().includes(searchTerm) ||
                                this.translateRole(user.role).toLowerCase().includes(searchTerm);
            
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });

        this.renderUsers();
    }

    updateStats() {
        const adminCount = this.users.filter(u => u.role === 'admin').length;
        const editorCount = this.users.filter(u => u.role === 'editor').length;
        const totalUsers = this.users.length;

        const adminCountEl = document.getElementById('admin-count');
        const editorCountEl = document.getElementById('editor-count');
        const totalUsersEl = document.getElementById('total-users');

        if (adminCountEl) adminCountEl.textContent = adminCount;
        if (editorCountEl) editorCountEl.textContent = editorCount;
        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    }

    async createUser(userData) {
        try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const user = userCredential.user;

            // Update user profile
            await updateProfile(user, {
                displayName: userData.name
            });

            // Send email verification
            await sendEmailVerification(user);

            // Create user document in Firestore
            const userDoc = {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                status: userData.status,
                permissions: userData.permissions || [],
                notes: userData.notes || '',
                createdAt: Timestamp.now(),
                lastAccess: null,
                uid: user.uid
            };

            await setDoc(doc(db, 'users', user.uid), userDoc);

            console.log('User created successfully:', user.uid);
            this.loadUsers(); // Reload users list
            return { success: true, user: userDoc };

        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(userId, userData) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                ...userData,
                updatedAt: Timestamp.now()
            });

            console.log('User updated successfully:', userId);
            this.loadUsers(); // Reload users list
            return { success: true };

        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteUser(userId) {
        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            // Delete from Firestore
            await deleteDoc(doc(db, 'users', userId));
            
            console.log('User deleted successfully:', userId);
            this.loadUsers(); // Reload users list
            return { success: true };

        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro ao excluir usuário: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Populate form with user data
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-status').value = user.status;
        document.getElementById('user-notes').value = user.notes || '';

        // Set permissions
        const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]');
        permissionCheckboxes.forEach(checkbox => {
            checkbox.checked = user.permissions && user.permissions.includes(checkbox.value);
        });

        // Clear password field for editing
        document.getElementById('user-password').value = '';

        // Update modal title
        document.getElementById('user-editor-title').textContent = 'Editar Usuário';

        // Show modal
        const modal = document.getElementById('user-editor-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Store current editing user
        this.currentUser = user;
    }

    openCreateUserModal() {
        // Reset form
        document.getElementById('user-form').reset();
        
        // Update modal title
        document.getElementById('user-editor-title').textContent = 'Novo Usuário';
        
        // Show modal
        const modal = document.getElementById('user-editor-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Clear current editing user
        this.currentUser = null;
    }

    async handleUserFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            permissions: formData.getAll('permissions')
        };

        const password = formData.get('password');

        // Show loading state
        const submitBtn = document.getElementById('save-user');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;

        try {
            let result;
            
            if (this.currentUser) {
                // Update existing user
                result = await this.updateUser(this.currentUser.id, userData);
            } else {
                // Create new user
                if (!password) {
                    alert('Senha é obrigatória para novos usuários');
                    return;
                }
                userData.password = password;
                result = await this.createUser(userData);
            }

            if (result.success) {
                // Close modal
                const modal = document.getElementById('user-editor-modal');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                
                // Show success message
                alert(this.currentUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
            } else {
                alert('Erro: ' + result.error);
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Erro ao salvar usuário: ' + error.message);
        } finally {
            // Reset loading state
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    updateBulkActions() {
        const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');

        if (selectedCheckboxes.length > 0) {
            bulkActions.style.display = 'block';
            selectedCount.textContent = `${selectedCheckboxes.length} usuários selecionados`;
        } else {
            bulkActions.style.display = 'none';
        }

        // Update select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-users');
        const totalCheckboxes = document.querySelectorAll('.user-checkbox');
        selectAllCheckbox.checked = selectedCheckboxes.length === totalCheckboxes.length;
        selectAllCheckbox.indeterminate = selectedCheckboxes.length > 0 && selectedCheckboxes.length < totalCheckboxes.length;
    }

    bulkActivateUsers() {
        const selectedUsers = this.getSelectedUsers();
        if (selectedUsers.length === 0) return;

        if (confirm(`Ativar ${selectedUsers.length} usuários selecionados?`)) {
            // Implement bulk activation
            console.log('Bulk activating users:', selectedUsers);
        }
    }

    bulkDeactivateUsers() {
        const selectedUsers = this.getSelectedUsers();
        if (selectedUsers.length === 0) return;

        if (confirm(`Desativar ${selectedUsers.length} usuários selecionados?`)) {
            // Implement bulk deactivation
            console.log('Bulk deactivating users:', selectedUsers);
        }
    }

    bulkDeleteUsers() {
        const selectedUsers = this.getSelectedUsers();
        if (selectedUsers.length === 0) return;

        if (confirm(`ATENÇÃO: Excluir ${selectedUsers.length} usuários selecionados? Esta ação não pode ser desfeita.`)) {
            // Implement bulk deletion
            console.log('Bulk deleting users:', selectedUsers);
        }
    }

    getSelectedUsers() {
        const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        return Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
    }

    // Utility methods
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    translateRole(role) {
        const roles = {
            'admin': 'Administrador',
            'editor': 'Editor',
            'moderator': 'Moderador',
            'contributor': 'Colaborador'
        };
        return roles[role] || role;
    }

    translateStatus(status) {
        const statuses = {
            'active': 'Ativo',
            'inactive': 'Inativo',
            'pending': 'Pendente'
        };
        return statuses[status] || status;
    }

    formatDate(date) {
        if (date instanceof Timestamp) {
            date = date.toDate();
        }
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('pt-BR') + ' ' + 
               date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize User Manager
const userManager = new UserManager();

// Export for global access
window.userManager = userManager;

export default UserManager;
