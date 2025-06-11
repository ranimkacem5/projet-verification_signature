import { Suspense } from "react"
import SignatureUploader from "@/components/signature-uploader"
import ParticleBackground from "@/components/particle-background"
import { Loader2 } from "lucide-react"

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-100 p-4 color-cycle-root">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-center">
          <span className="accent-text">Signature</span>
          <span className="text-black">Guard</span>
        </h1>
        <p className="text-gray-600 text-center mb-8">Securely upload your signature for verification</p>

        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64 rounded-xl bg-gray-100 shadow-[inset_5px_5px_10px_#d9d9d9,_inset_-5px_-5px_10px_#ffffff]">
              <Loader2 className="h-8 w-8 accent-text animate-spin" />
            </div>
          }
        >
          <SignatureUploader />
        </Suspense>
      </div>
    </main>
  )
}
