"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authState$ } from "@/app/services/authorization";
import GuardLoader from "@/app/components/Loader/Loader";

// В режиме разработки можно пропустить проверку авторизации
// Установите NEXT_PUBLIC_SKIP_AUTH=true в .env.local
// ВРЕМЕННО: установлено в true для разработки без авторизации
const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === "true" || true;

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [ready, setReady] = useState(false)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        const sub = authState$.subscribe(({ token, ready }) => {
            setReady(ready)
            setToken(token)
        })
        return () => sub.unsubscribe()
    }, [])

    useEffect(() => {
        if (SKIP_AUTH) return // Пропускаем проверку в режиме разработки
        if (!ready) return
        if (!token) router.replace('/auth')
    }, [ready, token, router])

    // В режиме разработки пропускаем проверку
    if (SKIP_AUTH) {
        return <>{children}</>
    }

    if (!ready || !token) return <GuardLoader></GuardLoader>
    return <>
        {token && ready && children}
    </>
}
