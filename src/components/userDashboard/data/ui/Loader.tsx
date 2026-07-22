import type { FC } from "react"

type LoaderProps = {
  size?: number
  className?: string
}

const Loader: FC<LoaderProps> = ({ size = 24, className = "" }) => {
  const stroke = Math.max(2, Math.round(size / 8))

  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth={stroke} />
      <path d="M22 12a10 10 0 00-10-10" stroke="#174CD2" strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  )
}

export default Loader
