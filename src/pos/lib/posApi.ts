const BASE = import.meta.env.VITE_API_URL || '';

function token() {
  return localStorage.getItem('pos_token') || '';
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api/pos${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const posAPI = {
  // Auth
  login: (email: string, pin: string) =>
    req<any>('POST', '/auth/login', { email, pin }),

  // Sessions
  openSession: (openingBalance: number) =>
    req<any>('POST', '/sessions', { openingBalance }),
  getCurrentSession: () =>
    req<any>('GET', '/sessions/current'),
  closeSession: (id: string, closingBalance: number, notes?: string) =>
    req<any>('PUT', `/sessions/${id}/close`, { closingBalance, notes }),
  getSessionReport: (id: string) =>
    req<any>('GET', `/sessions/${id}/report`),
  listSessions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<any[]>('GET', `/sessions${qs}`);
  },

  // Products
  getProducts: (q?: string) => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    return req<any[]>('GET', `/products${qs}`);
  },
  getProductByBarcode: (code: string) =>
    req<any>('GET', `/products/barcode/${encodeURIComponent(code)}`),

  // Transactions
  createTransaction: (data: unknown) =>
    req<any>('POST', '/transactions', data),
  batchSync: (transactions: unknown[]) =>
    req<any>('POST', '/transactions/batch', { transactions }),
  listTransactions: (sessionId?: string) => {
    const qs = sessionId ? `?sessionId=${sessionId}` : '';
    return req<any[]>('GET', `/transactions${qs}`);
  },
  getTransaction: (id: string) =>
    req<any>('GET', `/transactions/${id}`),
  sendReceipt: (id: string) =>
    req<any>('POST', `/transactions/${id}/receipt`),

  // Returns
  createReturn: (data: unknown) =>
    req<any>('POST', '/returns', data),
  getReturn: (id: string) =>
    req<any>('GET', `/returns/${id}`),

  // Cash movements
  addCashMovement: (data: unknown) =>
    req<any>('POST', '/cash-movements', data),
  listCashMovements: (sessionId: string) =>
    req<any[]>('GET', `/cash-movements/${sessionId}`),

  // Reports
  getDailyReport: (date?: string) => {
    const qs = date ? `?date=${date}` : '';
    return req<any>('GET', `/reports/daily${qs}`);
  },
  getCashierReport: (cashierId: string, from: string, to: string) =>
    req<any>('GET', `/reports/cashier/${cashierId}?from=${from}&to=${to}`),

  // Cashier management
  listCashiers: () => req<any[]>('GET', '/cashiers'),
  createCashier: (data: unknown) => req<any>('POST', '/cashiers', data),
  resetPin: (userId: string, pin: string) =>
    req<any>('PUT', `/cashiers/${userId}/pin`, { pin }),
  changeOwnPin: (currentPin: string, newPin: string) =>
    req<any>('PUT', '/cashiers/me/pin', { currentPin, newPin }),
};
