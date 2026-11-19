"use client";

import { ArrowLeft, Camera, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function ScanPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-base font-semibold text-gray-900">
              Scan Barcode
            </h1>
            <p className="text-xs text-gray-500">Scan a product barcode</p>
          </div>
        </div>
      </header>

      {/* Scanner */}
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4">
        <div
          className="
            relative
            flex
            aspect-square
            w-full
            max-w-md
            items-center
            justify-center
            overflow-hidden
            rounded-3xl
            border
            border-gray-200
            bg-black
            shadow-xl
          "
        >
          {/* Camera Placeholder */}
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl">
              <Camera className="h-8 w-8" />
            </div>

            <div className="text-center">
              <p className="font-medium">Camera Scanner</p>

              <p className="mt-1 text-sm text-white/60">
                Position the barcode inside the frame
              </p>
            </div>
          </div>

          {/* Scanner Frame */}
          <div className="pointer-events-none absolute inset-10 rounded-2xl border-2 border-white/80">
            {/* Corners */}
            <span className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-white" />
            <span className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-white" />
            <span className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-white" />
            <span className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-white" />

            {/* Scan Line */}
            <span
              className="
                absolute
                left-4
                right-4
                top-1/2
                h-0.5
                animate-pulse
                bg-red-500
                shadow-[0_0_12px_rgba(239,68,68,0.9)]
              "
            />
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-6 flex max-w-md flex-col items-center text-center">
          <QrCode className="mb-2 h-6 w-6 text-gray-500" />

          <p className="text-sm font-medium text-gray-900">
            Scan product barcode
          </p>

          <p className="mt-1 text-xs text-gray-500">
            The product will be searched automatically after scanning.
          </p>
        </div>
      </div>
    </main>
  );
}
