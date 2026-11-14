import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Le service de stockage n'est pas configuré côté navigateur (VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquant).",
    );
  }
  return supabase;
}

export async function uploadFileToSignedStorageUrl(params: {
  path: string;
  token: string;
  file: File;
  contentType: string;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Le stockage de fichiers n'est pas configuré sur cet environnement.",
    );
  }

  const xhrFetch: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || 'GET').toUpperCase();

    if (method !== 'PUT' && method !== 'POST') {
      return fetch(input, init);
    }

    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);

      if (init?.headers) {
        const headers = new Headers(init.headers);
        headers.forEach((value, key) => {
          // Laisse le navigateur définir Content-Type + boundary si FormData
          if (
            !(init.body instanceof FormData) ||
            key.toLowerCase() !== 'content-type'
          ) {
            xhr.setRequestHeader(key, value);
          }
        });
      }

      if (xhr.upload && params.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
            params.onProgress?.(pct);
          }
        };
      }

      xhr.onload = () => {
        if (params.onProgress && xhr.status >= 200 && xhr.status < 300) {
          params.onProgress(100);
        }
        const rawHeaders = xhr.getAllResponseHeaders();
        const headerMap = new Headers();
        for (const line of rawHeaders.trim().split(/[\r\n]+/)) {
          const idx = line.indexOf(':');
          if (idx > 0) {
            headerMap.append(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
          }
        }
        resolve(
          new Response(xhr.responseText || '{}', {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headerMap,
          }),
        );
      };

      xhr.onerror = () => {
        reject(new Error('Échec de la connexion réseau pendant le téléversement.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Le téléversement a pris trop de temps. Réessayez avec une connexion stable.'));
      };

      xhr.onabort = () => {
        reject(new Error('Le téléversement a été annulé.'));
      };

      xhr.send((init?.body as XMLHttpRequestBodyInit | null) ?? null);
    });
  };

  const uploadClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: xhrFetch,
    },
  });

  const { error } = await uploadClient.storage
    .from('candidatures')
    .uploadToSignedUrl(params.path, params.token, params.file, {
      contentType: params.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message || "Le stockage n'a pas accepté ce fichier.",
    );
  }
}
