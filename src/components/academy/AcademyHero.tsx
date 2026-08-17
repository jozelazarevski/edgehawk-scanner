import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const HEADLINE = 'The edge is a skill.'.split(' ')
const SUB =
  'Scanner mastery, risk frameworks, and pattern playbooks — taught in the language of the tape.'.split(
    ' ',
  )

/** Word that rises out of a clipped mask (hero headline treatment). */
function MaskedWord({ word, delay, className }: { word: string; delay: number; className?: string }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <motion.span
        className={`inline-block ${className ?? ''}`}
        initial={{ y: '110%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.6, delay, ease: EASE }}
      >
        {word}
      </motion.span>
    </span>
  )
}

export default function AcademyHero() {
  return (
    <section className="relative -mt-16 h-[480px] overflow-hidden">
      {/* Background image with slow Ken Burns drift */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/academy-hero.webp)' }}
        initial={{ scale: 1 }}
        animate={{ scale: 1.06 }}
        transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
      />
      {/* Legibility gradient — darker toward the bottom where the text sits */}
      <div className="absolute inset-0 bg-gradient-to-t from-abyss/95 via-abyss/60 to-abyss/30" />
      {/* Gradient wipe: reveals the image from black on load */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-abyss via-abyss to-abyss/90"
        initial={{ y: '0%' }}
        animate={{ y: '101%' }}
        transition={{ duration: 1, ease: EASE }}
      />

      {/* Content — bottom-left aligned */}
      <div className="relative mx-auto flex h-full max-w-[1280px] items-end px-6 pb-14 lg:px-12">
        <div className="max-w-[720px]">
          <motion.p
            className="label-eyebrow text-pulse"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
          >
            EDGEHAWK ACADEMY
          </motion.p>
          <h1 className="mt-4 font-display text-[40px] font-bold leading-none tracking-[-0.02em] text-ink-primary md:text-[64px]">
            {HEADLINE.map((word, i) => (
              <span key={i}>
                <MaskedWord word={word} delay={0.35 + i * 0.06} />{' '}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-[560px] text-lg leading-[1.6] text-ink-primary/85">
            {SUB.map((word, i) => (
              <span key={i}>
                <MaskedWord word={word} delay={0.6 + i * 0.06} className="will-change-transform" />
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
