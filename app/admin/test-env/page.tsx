"use client"

export default function TestEnvPage() {
  return (
    <div className="p-10 text-lg text-white">
      Value of NEXT_PUBLIC_ADMIN_PASS:<br /><br />
      <pre className="bg-black/50 p-4 rounded-xl border border-white/20">
        {process.env.NEXT_PUBLIC_ADMIN_PASS ?? "❌ undefined"}
      </pre>
    </div>
  )
}
