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

function sendXhrWithProgress(opts: {
  method: 'POST' | 'PUT';
  url: string;
  headers?: Record<string, string>;
  body: XMLHttpRequestBodyInit;
  onProgress?: (percent: number) => void;
}): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method, opts.url, true);

    if (opts.headers) {
      for (const [key, value] of Object.entries(opts.headers)) {
        if (
          !(opts.body instanceof FormData) ||
          key.toLowerCase() !== 'content-type'
        ) {
          xhr.setRequestHeader(key, value);
        }
      }
    }

    if (xhr.upload && opts.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
          opts.onProgress?.(pct);
        }
      };
    }

    xhr.onload = () => {
      if (opts.onProgress && xhr.status >= 200 && xhr.status < 300) {
        opts.onProgress(100);
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

    xhr.send(opts.body);
  });
}

export class StorageFileTooLargeError extends Error {
  readonly isTooLarge = true;

  constructor(message: string) {
    super(message);
    this.name = 'StorageFileTooLargeError';
  }
}

export function isPayloadTooLargeResponse(
  status: number,
  rawMessage?: string,
): boolean {
  const lower = (rawMessage || '').toLowerCase();
  return (
    status === 413 ||
    lower.includes('exceeded the maximum allowed size') ||
    lower.includes('payload too large') ||
    lower.includes('maximum allowed size') ||
    lower.includes('entity too large')
  );
}

export function formatStorageUploadError(status: number, rawMessage?: string): string {
  if (isPayloadTooLargeResponse(status, rawMessage)) {
    return "Ce fichier vidéo est trop volumineux pour être envoyé. Veuillez vérifier la taille de votre vidéo (visez moins de 50 Mo si l'envoi bloque) et utilisez si besoin l'outil de compression ci-dessous avant de réessayer.";
  }
  return rawMessage || "Le stockage n'a pas accepté ce fichier.";
}

export async function uploadFileToSignedStorageUrl(params: {
  path: string;
  token: string;
  signedUrl?: string;
  uploadMode?: 'supabase_signed' | 'local_server';
  file: File;
  contentType: string;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  // 1. Mode serveur local (/api/submissions/local-upload)
  if (
    params.uploadMode === 'local_server' ||
    (params.signedUrl && params.signedUrl.startsWith('/api/'))
  ) {
    const targetUrl = params.signedUrl || '/api/submissions/local-upload';
    const response = await sendXhrWithProgress({
      method: 'POST',
      url: targetUrl,
      headers: {
        'x-upload-token': params.token,
        'Content-Type': params.contentType || 'application/octet-stream',
      },
      body: params.file,
      onProgress: params.onProgress,
    });
    if (!response.ok) {
      let msg = "Le serveur n'a pas accepté ce fichier.";
      try {
        const data = (await response.json()) as { error?: string };
        if (data?.error) msg = data.error;
      } catch {
        // ignore JSON parse error
      }
      const formatted = formatStorageUploadError(response.status, msg);
      if (isPayloadTooLargeResponse(response.status, msg)) {
        throw new StorageFileTooLargeError(formatted);
      }
      throw new Error(formatted);
    }
    return;
  }

  // 2. Upload direct vers l'URL signée retournée par /api/submissions/init
  // Fonctionne même sans VITE_SUPABASE_* configuré au build Vite !
  if (params.signedUrl && /^https?:\/\//i.test(params.signedUrl)) {
    const formData = new FormData();
    formData.append('cacheControl', '3600');
    formData.append('', params.file);

    const headers: Record<string, string> = {};
    if (supabasePublishableKey) {
      headers.apikey = supabasePublishableKey;
      headers.Authorization = `Bearer ${supabasePublishableKey}`;
    }

    const response = await sendXhrWithProgress({
      method: 'PUT',
      url: params.signedUrl,
      headers,
      body: formData,
      onProgress: params.onProgress,
    });

    if (!response.ok) {
      let msg = '';
      try {
        const data = (await response.json()) as {
          message?: string;
          error?: string;
          statusCode?: string | number;
        };
        if (data?.message || data?.error) msg = data.message || data.error || '';
      } catch {
        // ignore parse error
      }
      const formatted = formatStorageUploadError(response.status, msg);
      if (isPayloadTooLargeResponse(response.status, msg)) {
        throw new StorageFileTooLargeError(formatted);
      }
      throw new Error(formatted);
    }
    return;
  }

  // 3. Repli via SDK client Supabase si configuré
  if (!isSupabaseConfigured) {
    throw new Error(
      "Le service de téléversement n'a pas fourni de lien de destination valide.",
    );
  }

  const xhrFetch: typeof fetch = async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (init?.method || 'GET').toUpperCase();

    if (method !== 'PUT' && method !== 'POST') {
      return fetch(input, init);
    }

    const headerRecord: Record<string, string> = {};
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headerRecord[key] = value;
      });
    }

    return sendXhrWithProgress({
      method: method as 'POST' | 'PUT',
      url,
      headers: headerRecord,
      body: (init?.body as XMLHttpRequestBodyInit | null) ?? '',
      onProgress: params.onProgress,
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
    const formatted = formatStorageUploadError(0, error.message);
    if (isPayloadTooLargeResponse(0, error.message)) {
      throw new StorageFileTooLargeError(formatted);
    }
    throw new Error(formatted);
  }
}
