const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export async function api(path, options = {}, token) {
  const response = await fetch(API + path, { ...options, headers: {...options.headers, ...(token && {Authorization: `Bearer ${token}`})} });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

export async function downloadFile(path, token, fallbackName = 'download') {
  const response = await fetch(API + path, { headers: { ...(token && {Authorization: `Bearer ${token}`}) } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Download failed');
  }
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackName;
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.URL.revokeObjectURL(url);
}
