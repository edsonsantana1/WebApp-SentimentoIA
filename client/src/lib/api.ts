export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const AUTH_TOKEN_KEY = "sentimentoia_access_token";
export const AUTH_USER_KEY = "sentimentoia_user";

export type AuthUser = {
  id?: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
  mfa_enabled?: boolean;
  mfa_verified?: boolean;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("manus-runtime-user-info");
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(typeof detail === "string" ? detail : "Erro na requisição");
  }

  return data as T;
}

export const authApi = {
  register(payload: { name: string; email: string; phone?: string; password: string }) {
    return apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  me() {
    return apiFetch<AuthUser>("/api/auth/me");
  },
  logout() {
    clearAuthSession();
  },
};


export type Mention = {
  id: string;
  brand_id?: string;
  brand_name?: string;
  text: string;
  source: string;
  sentiment: string;
  criticality: string;
  urgency_score?: number;
  confidence?: number;
  aspects?: string[];
  critical_terms?: string[];
  rating?: number;
  author?: string;
  url?: string;
  published_at?: string;
  created_at?: string;
};

export type DashboardMetrics = {
  total_mentions: number;
  sentiment_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  top_aspects: Record<string, number>;
  critical_mentions: number;
  average_urgency: number;
  reputation_score: number;
  recent_mentions: Mention[];
};

export type DashboardResponse = {
  search_id: string | null;
  query?: string;
  metrics: Partial<DashboardMetrics>;
  mentions: Mention[];
  alerts?: any[];
  llm_analysis?: any;
  errors?: any[];
};

export type SearchResponse = {
  search_id: string;
  query?: string;
  cached?: boolean;
  total: number;
  mentions: Mention[];
  metrics: Partial<DashboardMetrics>;
  llm_analysis?: any;
  alerts?: any[];
  errors?: Array<{ source?: string; error?: string } | string>;
};

export const sentimentApi = {
  dashboard() {
    return apiFetch<DashboardResponse>("/api/dashboard");
  },
  search(payload: { brand_name: string; sources: string[]; period_days?: number; locality?: string }) {
    return apiFetch<SearchResponse>("/api/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  mentions() {
    return apiFetch<Mention[]>("/api/mentions");
  },
  insights(refresh = false) {
    return apiFetch<any>(refresh ? "/api/insights?refresh=true" : "/api/insights");
  },
  analyze(payload: { text: string; brand_name?: string; source?: string }) {
    return apiFetch<Mention>("/api/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export async function downloadReport(format: "csv" | "pdf") {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/reports/export/${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Erro ao gerar relatório");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = format === "csv" ? "relatorio_sentimento.csv" : "relatorio_sentimento.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
