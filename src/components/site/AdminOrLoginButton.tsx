'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Check Payload's session so the public header always points to the right admin destination.
export function AdminOrLoginButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          setIsLoggedIn(false)
          return
        }

        const data: { user: { id: string } | null } = await response.json()
        setIsLoggedIn(Boolean(data.user?.id))
      })
      .catch(() => setIsLoggedIn(false))
  }, [])

  return (
    <Link href={isLoggedIn ? '/admin' : '/admin/login'} className="site-header__action">
      {isLoggedIn ? 'Admin Panel' : 'Log in'}
    </Link>
  )
}
