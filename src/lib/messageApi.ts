/** Authenticated messages API. The actor hint never grants access server-side. */
export type MessageActor = "customer" | "project_manager" | "admin";
const CUSTOMER_SESSION_KEY = "taklekkasjevakten_customer_session";
const PM_SESSION_KEY = "taklekkasjevakten_project_manager_session";

export function messageFetch(url: string, init: RequestInit = {}, actor: MessageActor): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-TLV-Message-Actor", actor);
  if (actor === "customer") {
    headers.set("X-TLV-Customer-Session", window.localStorage.getItem(CUSTOMER_SESSION_KEY) || "");
  } else if (actor === "project_manager") {
    headers.set("X-TLV-PM-Session", window.localStorage.getItem(PM_SESSION_KEY) || "");
  }
  return fetch(url, { ...init, headers, credentials: "include" });
}
