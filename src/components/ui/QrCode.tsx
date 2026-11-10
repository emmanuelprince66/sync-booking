import type { ComponentType } from 'react'
import QRCodeModule, { type QRCodeProps } from 'react-qr-code'

/** react-qr-code is CommonJS: depending on the bundler's interop its default import is the component or the module. */
const QRCodeSvg = ((QRCodeModule as unknown as { default?: ComponentType<QRCodeProps> }).default ?? QRCodeModule) as ComponentType<QRCodeProps>

/** An SVG QR code in CLIQBOOK's ink colour. */
export function QrCode({ value, size = 136, title }: { value: string; size?: number; title: string }) {
  return <QRCodeSvg value={value} size={size} fgColor="#173A2E" title={title}/>
}
