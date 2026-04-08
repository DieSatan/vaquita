import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  url: string
  size?: number
}

export default function QRCode({ url, size = 160 }: QRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeSVG
        value={url}
        size={size}
        bgColor="#ffffff"
        fgColor="#15803d"
        level="M"
        includeMargin
      />
      <p className="text-xs text-gray-400 text-center break-all">{url}</p>
    </div>
  )
}
