/**
 * URL do services/api — só usado em código server-side (Route Handlers,
 * Server Components). O browser nunca chama o NestJS diretamente; tudo
 * passa pelos Route Handlers deste app, que guardam os tokens em cookies
 * httpOnly (ver lib/session.ts).
 */
export function apiUrl(): string {
  return process.env.API_URL ?? "http://localhost:3355";
}

export interface ApiError {
  message: string | string[];
  statusCode?: number;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
}

/**
 * Erro de rede/serviço indisponível (services/api fora do ar, DNS, timeout
 * etc) — distinto de uma resposta HTTP de erro do backend, que já vem com
 * status e corpo JSON próprios.
 */
export class ApiUnavailableError extends Error {}

/** apiFetch + tratamento de indisponibilidade — usar nos Route Handlers que proxyam services/api. */
export async function apiFetchOrThrow(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await apiFetch(path, init);
  } catch {
    throw new ApiUnavailableError(`Falha ao conectar em services/api (${path})`);
  }
}
