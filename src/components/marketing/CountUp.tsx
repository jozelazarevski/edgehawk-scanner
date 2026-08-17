import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Mono stat number that counts up from 0 when scrolled into view. */
export default function CountUp({
  to,
  decimals = 0,
  duration = 0.9,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const mv = useMotionValue(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, to, { duration, ease: EASE })
    return () => controls.stop()
  }, [inView, to, duration, mv])

  const text = useTransform(
    mv,
    (v) =>
      prefix +
      v.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) +
      suffix,
  )

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  )
}
