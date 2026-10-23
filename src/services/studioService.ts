/**
 * Client API pour les endpoints Aura Studio.
 * Toutes les opérations sont authentifiées (Bearer token) et isolées par utilisateur.
 */
import type {
  StudioProject,
  StudioProjectSummary,
  StudioProjectType,
  StudioProjectVersion,
  VirtualStudioFile,
} from '../shared/types.ts';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('aura_session_token');
  } catch {
    return null;
  }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export interface StudioListResponse {
  projects: StudioProjectSummary[];
  storage: { used: number; limit: number; planId: string };
}

export interface StudioProjectResponse {
  project: StudioProject;
  previewHtml?: string;
}

export interface StudioSaveResponse extends StudioProjectResponse {
  version: StudioProjectVersion;
  build: { ok: boolean; error?: string };
}

export class StudioApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new StudioApiError(
        data.error || `Erreur serveur (${res.status}).`,
        res.status,
        data.code
      );
    }
    return data as T;
  } catch (err) {
    if (err instanceof StudioApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new StudioApiError(
        'La requête a expiré. Vérifiez votre connexion puis réessayez.',
        408,
        'TIMEOUT'
      );
    }
    throw new StudioApiError(
      err instanceof Error ? err.message : 'Erreur réseau inattendue.',
      0,
      'NETWORK'
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const studioApi = {
  list(): Promise<StudioListResponse> {
    return request<StudioListResponse>('/api/studio/projects', {
      headers: authHeaders(),
    });
  },

  get(id: string): Promise<StudioProjectResponse> {
    return request<StudioProjectResponse>(`/api/studio/projects/${id}`, {
      headers: authHeaders(),
    });
  },

  create(params: {
    idea: string;
    name?: string;
    type?: StudioProjectType;
    sections?: string;
    styleNotes?: string;
    clientRequestId?: string;
  }): Promise<StudioProjectResponse> {
    return request<StudioProjectResponse>('/api/studio/projects', {
      method: 'POST',
      headers: authHeaders(
        params.clientRequestId
          ? { 'X-Client-Request-Id': params.clientRequestId }
          : {}
      ),
      body: JSON.stringify({
        idea: params.idea,
        name: params.name,
        type: params.type,
        sections: params.sections,
        styleNotes: params.styleNotes,
      }),
    });
  },

  patch(
    id: string,
    updates: {
      name?: string;
      description?: string;
      type?: StudioProjectType;
    }
  ): Promise<StudioProjectResponse> {
    return request<StudioProjectResponse>(`/api/studio/projects/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
  },

  remove(id: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(`/api/studio/projects/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
  },

  duplicate(id: string): Promise<StudioProjectResponse> {
    return request<StudioProjectResponse>(
      `/api/studio/projects/${id}/duplicate`,
      { method: 'POST', headers: authHeaders() }
    );
  },

  saveFiles(
    id: string,
    files: VirtualStudioFile[],
    label?: string
  ): Promise<StudioSaveResponse> {
    return request<StudioSaveResponse>(`/api/studio/projects/${id}/files`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ files, label }),
    });
  },

  iterate(
    id: string,
    instruction: string,
    clientRequestId?: string
  ): Promise<StudioSaveResponse & { previewHtml: string }> {
    return request<StudioSaveResponse & { previewHtml: string }>(
      `/api/studio/projects/${id}/iterate`,
      {
        method: 'POST',
        headers: authHeaders(
          clientRequestId ? { 'X-Client-Request-Id': clientRequestId } : {}
        ),
        body: JSON.stringify({ instruction }),
      }
    );
  },

  restoreVersion(
    id: string,
    versionId: string
  ): Promise<StudioProjectResponse & { version: StudioProjectVersion }> {
    return request<StudioProjectResponse & { version: StudioProjectVersion }>(
      `/api/studio/projects/${id}/versions/${versionId}/restore`,
      { method: 'POST', headers: authHeaders() }
    );
  },

  build(id: string): Promise<{ build: { ok: boolean; error?: string }; project: StudioProject }> {
    return request<{ build: { ok: boolean; error?: string }; project: StudioProject }>(
      `/api/studio/projects/${id}/build`,
      { method: 'POST', headers: authHeaders() }
    );
  },

  exportUrl(id: string): string {
    return `/api/studio/projects/${id}/export`;
  },

  async exportZip(id: string, projectName: string): Promise<void> {
    const token = getStoredToken();
    const res = await fetch(`/api/studio/projects/${id}/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new StudioApiError(data.error || 'Export impossible.', res.status);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName =
      (projectName || 'projet-aura')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'projet-aura';
    a.download = `${safeName}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
