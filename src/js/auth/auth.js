/**
 * FacturApp - Authentication System
 * Simple local authentication with roles
 */

const Auth = {
    currentUser: null,
    users: [],
    
    // Default roles
    roles: {
        admin: {
            name: 'Administrador',
            permissions: ['view', 'create', 'edit', 'delete', 'settings', 'users', 'reports', 'export']
        },
        accountant: {
            name: 'Contable',
            permissions: ['view', 'create', 'edit', 'reports', 'export']
        },
        viewer: {
            name: 'Visualizador',
            permissions: ['view', 'reports']
        }
    },

    /**
     * Initialize auth system
     */
    async init() {
        // Load users from storage
        await this.loadUsers();
        
        // Check if there's a logged in user
        const savedUser = await DB.getSetting('current_user');
        if (savedUser) {
            this.currentUser = this.users.find(u => u.id === savedUser);
        }

        // If no users exist, create default admin
        if (this.users.length === 0) {
            await this.createDefaultAdmin();
        }

        return this.currentUser;
    },

    /**
     * Load users from IndexedDB
     */
    async loadUsers() {
        return new Promise((resolve, reject) => {
            const store = DB.getStore('settings');
            const request = store.get('users');
            
            request.onsuccess = () => {
                this.users = request.result?.value || [];
                resolve(this.users);
            };
            request.onerror = () => {
                this.users = [];
                resolve(this.users);
            };
        });
    },

    /**
     * Save users to IndexedDB
     */
    async saveUsers() {
        await DB.saveSetting('users', this.users);
    },

    /**
     * Create default admin user
     */
    async createDefaultAdmin() {
        const admin = {
            id: 'admin-' + Helpers.generateId(),
            username: 'admin',
            password: await this.hashPassword('admin123'),
            name: 'Administrador',
            email: '',
            role: 'admin',
            active: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        this.users.push(admin);
        await this.saveUsers();
        
        console.log('Default admin created (user: admin, pass: admin123)');
        return admin;
    },

    /**
     * Hash password (simple hash for demo - in production use bcrypt)
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'facturapp-salt');
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Login
     */
    async login(username, password) {
        const hashedPassword = await this.hashPassword(password);
        const user = this.users.find(u => 
            u.username === username && 
            u.password === hashedPassword && 
            u.active
        );

        if (!user) {
            throw new Error('Usuario o contraseña incorrectos');
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        await this.saveUsers();

        // Set current user
        this.currentUser = user;
        await DB.saveSetting('current_user', user.id);

        return user;
    },

    /**
     * Logout
     */
    async logout() {
        this.currentUser = null;
        await DB.saveSetting('current_user', null);
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this.currentUser;
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    },

    /**
     * Check if current user has permission
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        const role = this.roles[this.currentUser.role];
        return role && role.permissions.includes(permission);
    },

    /**
     * Create new user
     */
    async createUser(userData) {
        // Check if username exists
        if (this.users.find(u => u.username === userData.username)) {
            throw new Error('El nombre de usuario ya existe');
        }

        const user = {
            id: 'user-' + Helpers.generateId(),
            username: userData.username,
            password: await this.hashPassword(userData.password),
            name: userData.name || userData.username,
            email: userData.email || '',
            role: userData.role || 'viewer',
            active: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        this.users.push(user);
        await this.saveUsers();

        return user;
    },

    /**
     * Update user
     */
    async updateUser(userId, updates) {
        const user = this.users.find(u => u.id === userId);
        if (!user) throw new Error('Usuario no encontrado');

        // Update fields
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email;
        if (updates.role) user.role = updates.role;
        if (updates.active !== undefined) user.active = updates.active;
        if (updates.password) {
            user.password = await this.hashPassword(updates.password);
        }

        await this.saveUsers();
        return user;
    },

    /**
     * Delete user
     */
    async deleteUser(userId) {
        if (userId === this.currentUser?.id) {
            throw new Error('No puedes eliminar tu propio usuario');
        }

        this.users = this.users.filter(u => u.id !== userId);
        await this.saveUsers();
    },

    /**
     * Get all users (without passwords)
     */
    getUsers() {
        return this.users.map(u => ({
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            role: u.role,
            active: u.active,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin
        }));
    },

    /**
     * Get available roles
     */
    getRoles() {
        return Object.entries(this.roles).map(([key, value]) => ({
            id: key,
            name: value.name,
            permissions: value.permissions
        }));
    },

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = this.users.find(u => u.id === userId);
        if (!user) throw new Error('Usuario no encontrado');

        const hashedCurrent = await this.hashPassword(currentPassword);
        if (user.password !== hashedCurrent) {
            throw new Error('Contraseña actual incorrecta');
        }

        user.password = await this.hashPassword(newPassword);
        await this.saveUsers();
    },

    /**
     * Render login form
     */
    renderLoginForm() {
        return `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <div>
                        <div class="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            FacturApp
                        </h2>
                        <p class="mt-2 text-center text-sm text-gray-600">
                            Inicia sesión para continuar
                        </p>
                    </div>
                    <form id="login-form" class="mt-8 space-y-6" onsubmit="Auth.handleLogin(event)">
                        <div class="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label for="login-username" class="sr-only">Usuario</label>
                                <input id="login-username" name="username" type="text" required 
                                    class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                                    placeholder="Usuario">
                            </div>
                            <div>
                                <label for="login-password" class="sr-only">Contraseña</label>
                                <input id="login-password" name="password" type="password" required 
                                    class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                                    placeholder="Contraseña">
                            </div>
                        </div>

                        <div id="login-error" class="hidden text-red-600 text-sm text-center"></div>

                        <div>
                            <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                Iniciar sesión
                            </button>
                        </div>

                        <div class="text-sm text-center text-gray-500">
                            <p>Usuario por defecto: <strong>admin</strong> / <strong>admin123</strong></p>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            await this.login(username, password);
            // Reload app
            window.location.reload();
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    },

    /**
     * Render user management panel
     */
    renderUserManagement() {
        const users = this.getUsers();
        const roles = this.getRoles();

        return `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
                    <button onclick="Auth.showCreateUserModal()" class="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Nuevo usuario
                    </button>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último acceso</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${users.map(user => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 text-sm font-medium text-gray-900">${user.username}</td>
                                    <td class="px-6 py-4 text-sm text-gray-600">${user.name}</td>
                                    <td class="px-6 py-4">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'accountant' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }">
                                            ${this.roles[user.role]?.name || user.role}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }">
                                            ${user.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-600">
                                        ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <button onclick="Auth.editUser('${user.id}')" class="text-gray-400 hover:text-blue-600" title="Editar">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                </svg>
                                            </button>
                                            ${user.id !== this.currentUser?.id ? `
                                                <button onclick="Auth.toggleUserActive('${user.id}')" class="text-gray-400 hover:text-yellow-600" title="${user.active ? 'Desactivar' : 'Activar'}">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                                                    </svg>
                                                </button>
                                                <button onclick="Auth.deleteUser('${user.id}')" class="text-gray-400 hover:text-red-600" title="Eliminar">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                    </svg>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Show create user modal
     */
    showCreateUserModal() {
        const roles = this.getRoles();
        const modal = document.getElementById('modal-content');
        
        modal.innerHTML = `
            <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold">Crear Nuevo Usuario</h3>
                    <button onclick="Auth.closeModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="create-user-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario *</label>
                        <input type="text" id="new-username" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                        <input type="password" id="new-password" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                        <input type="text" id="new-name" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="new-email" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <select id="new-role" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            ${roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                        </select>
                    </div>
                    <div id="create-user-error" class="hidden text-red-600 text-sm"></div>
                    <div class="flex gap-3">
                        <button type="button" onclick="Auth.createUserFromForm()" class="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
                            Crear usuario
                        </button>
                        <button type="button" onclick="Auth.closeModal()" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Create user from form
     */
    async createUserFromForm() {
        const errorDiv = document.getElementById('create-user-error');
        
        try {
            const userData = {
                username: document.getElementById('new-username').value,
                password: document.getElementById('new-password').value,
                name: document.getElementById('new-name').value,
                email: document.getElementById('new-email').value,
                role: document.getElementById('new-role').value
            };

            await this.createUser(userData);
            this.closeModal();
            
            // Refresh user management if visible
            if (document.getElementById('user-management')) {
                document.getElementById('user-management').innerHTML = this.renderUserManagement();
            }
            
            Helpers.showToast('Usuario creado correctamente', 'success');
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    },

    /**
     * Edit user
     */
    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const roles = this.getRoles();
        const modal = document.getElementById('modal-content');
        
        modal.innerHTML = `
            <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold">Editar Usuario</h3>
                    <button onclick="Auth.closeModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="edit-user-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                        <input type="text" value="${user.username}" disabled class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                        <input type="text" id="edit-name" value="${user.name}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="edit-email" value="${user.email}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <select id="edit-role" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            ${roles.map(r => `<option value="${r.id}" ${r.id === user.role ? 'selected' : ''}>${r.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña (dejar vacío para no cambiar)</label>
                        <input type="password" id="edit-password" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="••••••••">
                    </div>
                    <div id="edit-user-error" class="hidden text-red-600 text-sm"></div>
                    <div class="flex gap-3">
                        <button type="button" onclick="Auth.saveUserEdit('${userId}')" class="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
                            Guardar cambios
                        </button>
                        <button type="button" onclick="Auth.closeModal()" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Save user edits
     */
    async saveUserEdit(userId) {
        const errorDiv = document.getElementById('edit-user-error');
        
        try {
            const updates = {
                name: document.getElementById('edit-name').value,
                email: document.getElementById('edit-email').value,
                role: document.getElementById('edit-role').value
            };

            const password = document.getElementById('edit-password').value;
            if (password) updates.password = password;

            await this.updateUser(userId, updates);
            this.closeModal();
            
            // Refresh user management
            if (document.getElementById('user-management')) {
                document.getElementById('user-management').innerHTML = this.renderUserManagement();
            }
            
            Helpers.showToast('Usuario actualizado', 'success');
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    },

    /**
     * Toggle user active status
     */
    async toggleUserActive(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        user.active = !user.active;
        await this.saveUsers();
        
        // Refresh user management
        if (document.getElementById('user-management')) {
            document.getElementById('user-management').innerHTML = this.renderUserManagement();
        }
        
        Helpers.showToast(`Usuario ${user.active ? 'activado' : 'desactivado'}`, 'success');
    },

    /**
     * Delete user
     */
    async deleteUser(userId) {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            await this.deleteUser(userId);
            
            // Refresh user management
            if (document.getElementById('user-management')) {
                document.getElementById('user-management').innerHTML = this.renderUserManagement();
            }
            
            Helpers.showToast('Usuario eliminado', 'success');
        } catch (error) {
            Helpers.showToast(error.message, 'error');
        }
    },

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    /**
     * Render user info in sidebar
     */
    renderUserInfo() {
        if (!this.currentUser) return '';
        
        return `
            <div class="p-4 border-t border-gray-200">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span class="text-primary-600 font-semibold">${this.currentUser.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">${this.currentUser.name}</p>
                        <p class="text-xs text-gray-500">${this.roles[this.currentUser.role]?.name || this.currentUser.role}</p>
                    </div>
                    <button onclick="Auth.showLogoutConfirm()" class="text-gray-400 hover:text-red-600" title="Cerrar sesión">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Show logout confirmation
     */
    showLogoutConfirm() {
        if (confirm('¿Cerrar sesión?')) {
            this.logout();
            window.location.reload();
        }
    }
};

// Make globally available
window.Auth = Auth;
