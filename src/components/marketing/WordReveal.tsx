import { motion } from 'framer-motion'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/**
 * Word-level split headline reveal: words slide up from a clipped mask
 * with a stagger (0.06s default per design system).
 */
export default function WordReveal({
  text,
  className,
  delay = 0,
  stagger = 0.06,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden
          className="inline-block overflow-hidden align-bottom"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.7, ease: EASE, delay: delay + i * stagger }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
