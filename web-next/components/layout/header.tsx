'use client'

import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { NavLink } from './nav-link'
import { ThemeToggle } from './theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { user, signOut } = useAuth()
  const isDevBypass = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'

  return (
    <>
      {isDevBypass && (
        <div className="w-full bg-yellow-500 text-black px-4 py-2 text-center text-sm font-bold">
          ⚠️ AUTHENTICATION DISABLED - DEV MODE ONLY
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">Nexus</span>
          </Link>
          <nav className="flex items-center space-x-1">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/qc">QC Entry</NavLink>
            <NavLink href="/approval">Approvals</NavLink>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.email || 'User'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        </div>
      </header>
    </>
  )
}
