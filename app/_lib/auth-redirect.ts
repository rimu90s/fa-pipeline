export function getDefaultAppRedirect(): string {
  return "/visit";
}

export function getAuthRedirectFromQuery(searchParams: URLSearchParams): string {
  const next = searchParams.get("next");
  if (!next) return getDefaultAppRedirect();
  if (!next.startsWith("/")) return getDefaultAppRedirect(); // harden open-redirect
  return next;
}
