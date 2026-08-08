/**
 * BillSnap - Supabase Client
 * Vanilla JavaScript client for Supabase
 */

const SupabaseClient = {
    client: null,
    initialized: false,

    /**
     * Initialize Supabase client
     */
    async init() {
        if (this.initialized) return this.client;

        try {
            // Load Supabase JS library
            if (!window.supabase) {
                await this.loadLibrary();
            }

            // Create client
            this.client = window.supabase.createClient(
                CONFIG.supabase.url,
                CONFIG.supabase.anonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                }
            );

            this.initialized = true;
            console.log('Supabase initialized');
            return this.client;
        } catch (error) {
            console.error('Supabase init error:', error);
            throw error;
        }
    },

    /**
     * Load Supabase library from CDN
     */
    async loadLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.async = true;
            script.onload = () => {
                // Wait for supabase to be available
                let attempts = 0;
                const check = () => {
                    if (window.supabase) {
                        resolve();
                    } else if (attempts < 50) {
                        attempts++;
                        setTimeout(check, 100);
                    } else {
                        reject(new Error('Supabase library not loaded'));
                    }
                };
                check();
            };
            script.onerror = () => reject(new Error('Failed to load Supabase'));
            document.head.appendChild(script);
        });
    },

    /**
     * Get the client
     */
    getClient() {
        return this.client;
    },

    // ==================== AUTH ====================

    /**
     * Sign up with email/password
     */
    async signUp(email, password, name) {
        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sign in with email/password
     */
    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        const { data, error } = await this.client.auth.signInWithOAuth({
            provider: 'google'
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sign out
     */
    async signOut() {
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get current user
     */
    async getUser() {
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    },

    /**
     * Get current session
     */
    async getSession() {
        const { data: { session } } = await this.client.auth.getSession();
        return session;
    },

    /**
     * Listen to auth changes
     */
    onAuthStateChange(callback) {
        return this.client.auth.onAuthStateChange(callback);
    },

    // ==================== DATABASE ====================

    /**
     * Get from table
     */
    async get(table, filters = {}, options = {}) {
        let query = this.client.from(table).select(options.select || '*');

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        // Apply ordering
        if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? true });
        }

        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Get single record
     */
    async getById(table, id) {
        const { data, error } = await this.client
            .from(table)
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Insert record
     */
    async insert(table, record) {
        const { data, error } = await this.client
            .from(table)
            .insert(record)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Update record
     */
    async update(table, id, updates) {
        const { data, error } = await this.client
            .from(table)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Delete record
     */
    async delete(table, id) {
        const { error } = await this.client
            .from(table)
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /**
     * Count records
     */
    async count(table, filters = {}) {
        let query = this.client.from(table).select('*', { count: 'exact', head: true });

        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { count, error } = await query;
        if (error) throw error;
        return count;
    },

    // ==================== STORAGE ====================

    /**
     * Upload file
     */
    async uploadFile(bucket, path, file) {
        const { data, error } = await this.client.storage
            .from(bucket)
            .upload(path, file);
        if (error) throw error;
        return data;
    },

    /**
     * Get file URL
     */
    getPublicUrl(bucket, path) {
        const { data } = this.client.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    },

    /**
     * Delete file
     */
    async deleteFile(bucket, path) {
        const { error } = await this.client.storage
            .from(bucket)
            .remove([path]);
        if (error) throw error;
    },

    // ==================== EDGE FUNCTIONS ====================

    /**
     * Invoke edge function
     */
    async invokeFunction(functionName, body = {}) {
        const { data, error } = await this.client.functions.invoke(functionName, {
            body
        });
        if (error) throw error;
        return data;
    },

    // ==================== REALTIME ====================

    /**
     * Subscribe to table changes
     */
    subscribeToTable(table, callback, filters = {}) {
        let channel = this.client
            .channel(`public:${table}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: table,
                    filter: filters.filter || undefined
                }, 
                callback
            )
            .subscribe();

        return channel;
    },

    /**
     * Unsubscribe
     */
    unsubscribe(channel) {
        this.client.removeChannel(channel);
    }
};

// Make globally available
window.SupabaseClient = SupabaseClient;
