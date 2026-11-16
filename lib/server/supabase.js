import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SecureStoreAdapter } from './secureStoreAdapter';
import { trackedFetch } from './connectivity';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Set them in .env (see .env.example).'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Every request reports whether it reached the server, which is how the
  // app knows it's online or offline (see connectivity.js; no polling).
  global: { fetch: trackedFetch },
});
