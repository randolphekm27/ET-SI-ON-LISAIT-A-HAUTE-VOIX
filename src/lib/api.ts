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
      `Le serveur a renvoyé une page HTML au lieu des données attendues (code ${response.status}). Rechargez la page et réessayez.`,
    );
  }

  let parsed: (T & { error?: string }) | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as T & { error?: string };
    } catch {
      throw new Error(
        `Réponse inattendue du serveur (code ${response.status}). Réessayez dans un instant.`,
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      parsed?.error || `Un souci est survenu côté serveur (code ${response.status}).`,
    );
  }

  if (!parsed) {
    throw new Error('Le serveur a renvoyé une réponse vide.');
  }

  return parsed;
}
