import { useState } from 'react'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

export default function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
        copied
          ? 'text-green-600'
          : 'text-blue-600 hover:text-blue-800'
      } ${className}`}
      title={copied ? '¡Copiado!' : 'Copiar'}
    >
      {copied ? (
        <>
          <span>✓</span>
          {label && <span>{label}</span>}
        </>
      ) : (
        <>
          <span>📋</span>
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  )
}
