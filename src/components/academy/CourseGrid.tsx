import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

type Category = 'SCANNER BASICS' | 'STRATEGY' | 'RISK' | 'QUANT'

interface Course {
  title: string
  category: Category
  description: string
  lessons: string
  difficulty: 1 | 2 | 3
  progress?: number
}

const CATEGORY_STYLE: Record<Category, { bar: string; chip: string }> = {
  'SCANNER BASICS': {
    bar: 'bg-pulse',
    chip: 'border-pulse/30 bg-pulse/10 text-pulse',
  },
  STRATEGY: {
    bar: 'bg-amber-watch',
    chip: 'border-amber-watch/30 bg-amber-watch/10 text-amber-watch',
  },
  RISK: {
    bar: 'bg-signal',
    chip: 'border-signal/30 bg-signal/10 text-signal',
  },
  QUANT: {
    bar: 'bg-quant',
    chip: 'border-quant/30 bg-quant/10 text-quant',
  },
}

const COURSES: Course[] = [
  {
    title: 'Scanner Bootcamp',
    category: 'SCANNER BASICS',
    description: 'Every filter, every field, every hotkey. Master the workspace in one sitting.',
    lessons: '8 lessons · 1h 20m',
    difficulty: 1,
  },
  {
    title: 'Momentum Breakout Mastery',
    category: 'STRATEGY',
    description: 'The flagship engine, trade by trade. 40 real alerts dissected.',
    lessons: '12 lessons · 2h 45m',
    difficulty: 2,
    progress: 40,
  },
  {
    title: 'Risk: The Only Real Edge',
    category: 'RISK',
    description: 'Position sizing, R-multiples, and why your stop is your strategy.',
    lessons: '6 lessons · 55m',
    difficulty: 1,
  },
  {
    title: 'Reading the Quant Score',
    category: 'QUANT',
    description: 'What a 78 actually means. Statistical edge without the math degree.',
    lessons: '5 lessons · 40m',
    difficulty: 2,
  },
  {
    title: 'Gap Trading Systems',
    category: 'STRATEGY',
    description: 'Gap-and-go vs. gap-and-fade: the decision tree the engine runs.',
    lessons: '9 lessons · 1h 50m',
    difficulty: 2,
    progress: 70,
  },
  {
    title: 'Options Flow for Equity Traders',
    category: 'QUANT',
    description: 'Sweeps, blocks, and what the whales know 10 minutes before you.',
    lessons: '7 lessons · 1h 15m',
    difficulty: 3,
  },
]

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn('h-1.5 w-1.5 rounded-full', i <= level ? 'bg-ink-secondary' : 'bg-grid')}
        />
      ))}
    </span>
  )
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const style = CATEGORY_STYLE[course.category]
  return (
    <motion.article
      className="group relative flex flex-col overflow-hidden rounded-xl border border-grid bg-carbon transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-pulse/30 hover:shadow-glow"
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: index * 0.09, ease: EASE }}
    >
      {/* Category accent bar — grows on hover */}
      <div className={cn('h-0.5 w-full transition-all duration-300 group-hover:h-1', style.bar)} />

      <div className="flex flex-1 flex-col p-6">
        <span
          className={cn(
            'inline-flex w-fit rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide transition-all duration-300 group-hover:brightness-125',
            style.chip,
          )}
        >
          {course.category}
        </span>
        <h3 className="mt-4 font-display text-2xl font-medium leading-[1.2] text-ink-primary">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-[1.5] text-ink-secondary">
          {course.description}
        </p>

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-muted">{course.lessons}</span>
            <DifficultyDots level={course.difficulty} />
          </div>
          {course.progress !== undefined && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-wide text-ink-muted">
                  IN PROGRESS
                </span>
                <span className="font-mono text-[11px] font-medium text-pulse">
                  {course.progress}%
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-steel">
                <motion.div
                  className="h-full rounded-full bg-pulse"
                  initial={{ width: '0%' }}
                  whileInView={{ width: `${course.progress}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.09, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default function CourseGrid() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-24 lg:px-12">
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <p className="label-eyebrow text-pulse">COURSES</p>
        <h2 className="mt-4 font-display text-[32px] font-bold leading-[1.05] tracking-[-0.02em] text-ink-primary md:text-5xl">
          From tape reader to sniper.
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((course, i) => (
          <CourseCard key={course.title} course={course} index={i} />
        ))}
      </div>
    </section>
  )
}
