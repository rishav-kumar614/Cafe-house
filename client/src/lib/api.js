export class ApiError extends Error {
  constructor(message, { status, issues, details } = {}) {
    super(message);
    this.status = status;
    this.issues = issues || [];
    this.details = details;
  }
}

/** JSON fetch wrapper for the cafe API. Throws ApiError with server validation issues attached. */
export async function api(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      signal,
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the cafe server. Check your connection and try again.', { status: 0 });
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, {
      status: res.status,
      issues: data?.issues,
      details: data?.details,
    });
  }
  return data;
}

/** Converts server issue paths ("customer.phone") into a { path: message } map for forms. */
export function issuesToFieldErrors(issues = []) {
  const out = {};
  for (const issue of issues) if (!out[issue.path]) out[issue.path] = issue.message;
  return out;
}
