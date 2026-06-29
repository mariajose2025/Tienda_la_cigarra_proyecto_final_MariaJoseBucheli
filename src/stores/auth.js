import { writable, derived } from 'svelte/store';

function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    loading: true,
    error: null
  });

  return {
    subscribe,
    setUser: (user) => update(state => ({ ...state, user, loading: false, error: null })),
    setLoading: (loading) => update(state => ({ ...state, loading })),
    setError: (error) => update(state => ({ ...state, error, loading: false })),
    clear: () => set({ user: null, loading: false, error: null })
  };
}

export const auth = createAuthStore();

export const isAuthenticated = derived(auth, $auth => !!$auth.user && !$auth.loading);
export const currentUser = derived(auth, $auth => $auth.user);
export const isLoading = derived(auth, $auth => $auth.loading);
export const authError = derived(auth, $auth => $auth.error);
