import { catchError, from, Observable, switchMap, take, throwError } from "rxjs";
import { authToken$, setAuthToken } from "../services/authorization";
import { user$ } from "../services/user";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3333";

export const http = <T>(
  path: string,
  options?: RequestInit
): Observable<T> => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return from(
    fetch(`${API_URL}${normalizedPath}`, options).then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    })
  ).pipe(
    take(1)
  );
};

export const httpWithAuth = <T>(path: string, options: RequestInit): Observable<T> => {
  return authToken$.pipe(
    take(1),
    switchMap((token) => {
      const headers = new Headers(options?.headers);
      
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return http<T>(path, { ...options, headers });
    }),
    catchError((err: Error) => {
      if (err instanceof Error && err.message.includes("E_UNAUTHORIZED_ACCESS")) {
        if (typeof window !== "undefined" && window.location.pathname !== "/auth") {
          window.location.href = "/auth";
          user$.next(null)
          setAuthToken(null)
        }
      }
      return throwError(() => err);
    })
  );
};

export { API_URL };
