'use client'

import { useEffect } from 'react'
import { initAuthToken } from '@/app/services/authorization'
import { getMeApi } from '@/app/api/user/get-me'
import { user$ } from '@/app/services/user'
import { useRouter } from 'next/navigation'
import { authToken$ } from '@/app/services/authorization'

export default function ClientInit({ children }: { children: React.ReactNode }) {

  const router = useRouter()

  useEffect(() => {
    initAuthToken()
    const token = authToken$.getValue()

    if (!token) {
      user$.next(null)
      return
    }

    const sub = getMeApi().subscribe({
      next: (result) => {
        if (result.success) {
          user$.next(result.data.user)
        }
      },
      error: () => {
        user$.next(null)
      }
    })

    return () => sub.unsubscribe()
  }, [router])

  return <>{children}</>
}
