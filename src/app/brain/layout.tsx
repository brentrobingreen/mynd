import AppNav from '@/components/layout/AppNav'

export default function BrainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppNav />
      <main className="flex-1 ml-60 min-h-screen bg-[var(--background)]">
        {children}
      </main>
    </div>
  )
}
