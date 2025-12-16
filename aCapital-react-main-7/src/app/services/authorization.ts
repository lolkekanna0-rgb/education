import { BehaviorSubject, combineLatest, map } from "rxjs";

const STORAGE_KEY = "ackgtAuthTokenKey";

export const isAuthReady$ = new BehaviorSubject(false)
export const authToken$ = new BehaviorSubject<string | null>(null)

export const authState$ = combineLatest([authToken$, isAuthReady$]).pipe(
  map(([token, ready]) => ({ token, ready }))
)

export const initAuthToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(STORAGE_KEY)
    authToken$.next(token)
    isAuthReady$.next(true)
  }
}

export const setAuthToken = (token: string | null) => {
  authToken$.next(token)
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}
}