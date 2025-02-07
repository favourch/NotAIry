/// <reference types="@sveltejs/kit" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: import('@supabase/supabase-js').SupabaseClient
			getSession(): Promise<import('@supabase/supabase-js').Session | null>
			user?: {
				id: string;
				email: string;
			};
		}
		interface PageData {
			session: import('@supabase/supabase-js').Session | null
		}
		// interface PageState {}
		// interface Platform {}
	}

	interface ImportMetaEnv {
		readonly VITE_PRIVY_APP_ID: string
		readonly VITE_PRIVY_APP_SECRET: string
		readonly VITE_PRIVY_CLIENT_ID: string
		readonly VITE_SUPABASE_URL: string
		readonly VITE_SUPABASE_ANON_KEY: string
	}
}

export {};
