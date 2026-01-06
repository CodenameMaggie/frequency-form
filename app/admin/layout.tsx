'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSession, signOut, checkAdminAccess } from '@/lib/admin-auth'
import {
  LayoutDashboard,
  FileText,
  Package,
  DollarSign,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const session = await getSession()
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
        return
      }

      if (session) {
        const isAdmin = await checkAdminAccess()
        if (!isAdmin) {
          router.push('/admin/login')
          return
        }
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Applications', href: '/admin/applications', icon: FileText },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Brand Partners', href: '/admin/partners', icon: Users },
    { name: 'Payouts', href: '/admin/payouts', icon: DollarSign },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#1a3a2f] text-white p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#c9a962]" />
          <span className="font-serif text-lg">Admin</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-[#1a3a2f] text-white transform transition-transform lg:translate-x-0 z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-[#c9a962]" />
            <h1 className="text-xl font-serif">Admin Panel</h1>
          </div>
          <p className="text-[#e8dcc4] text-sm">Frequency & Form</p>
        </div>

        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors ${
                  isActive
                    ? 'bg-[#c9a962] text-white'
                    : 'text-[#e8dcc4] hover:bg-[#1a3a2f]/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-[#e8dcc4] hover:bg-[#1a3a2f]/50 rounded-sm transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
