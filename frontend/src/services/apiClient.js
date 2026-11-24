export async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 204) return null;
  const data = await response
    .json()
    .catch(() => ({ message: "The server is unavailable. Please try again." }));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}
export function afterLogin() {
  const token = sessionStorage.getItem("flowe-invite");
  return token ? "/invite/" + token : "/workspace";
}
