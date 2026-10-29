export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch('/api' + path, {
      method, credentials: 'same-origin', cache: 'no-store', signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
  } catch { throw new Error('Sem conexão com o servidor. Seus itens continuam na sacola.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new Error(data?.message || 'Não foi possível conectar ao banco de dados. Tente novamente.');
    error.status = response.status;
    throw error;
  }
  return data;
}
