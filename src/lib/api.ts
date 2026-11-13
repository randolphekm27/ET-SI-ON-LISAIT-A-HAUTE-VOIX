export async function fetchApiJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (
    contentType.includes('text/html') ||
    text.trimStart().toLowerCase().startsWith('<!doctype') ||
    text.trimStart().toLowerCase().startsWith('<html')
  ) {
    throw new Error(
      `Le serveur API a renvoyé une page HTML (HTTP ${response.status}). Veuillez recharger la page et réessayer.`,
    );
  }

  let parsed: (T & { error?: string }) | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as T & { error?: string };
    } catch {
      throw new Error(
        `Réponse non valide du serveur (HTTP ${response.status}). Veuillez réessayer dans un instant.`,
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      parsed?.error || `Erreur serveur (code ${response.status}).`,
    );
  }

  if (!parsed) {
    throw new Error('Réponse vide reçue du serveur.');
  }

  return parsed;
}
