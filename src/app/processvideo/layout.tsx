export default function ProcessVideoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-md">
          {children}
        </div>
      </div>
    </main>
  )
}
