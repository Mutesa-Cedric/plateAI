'use client'

import Image from "next/image"


export default function Logo({ className, showText = true }: { className?: string, showText?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={'/logo.svg'}
        alt="Plate AI"
        width={32}
        height={32}
      />
      {
        showText && (
          <span className="text-lg font-bold text-gray-950">Plate AI</span>
        )
      }
    </div>
  )
}
