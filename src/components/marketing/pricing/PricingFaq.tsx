import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const FAQS = [
  {
    q: 'Is the data really realtime?',
    a: 'Pro and Desk stream consolidated-tape ticks with zero added delay. Scout is delayed 15 minutes — enough to learn the platform, not enough to trade the open.',
  },
  {
    q: 'What exchanges do you cover?',
    a: 'All US equities on NYSE, NASDAQ, and NYSE American, plus CBOE/OPRA options flow on Desk. Crypto and FX are on the roadmap — see the changelog.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. One click, no retention maze. You keep Pro until the end of your billing period.',
  },
  {
    q: 'Do you offer refunds?',
    a: '14-day money-back guarantee on any paid plan, no questions, no forms.',
  },
  {
    q: 'Is this financial advice?',
    a: 'No. Edgehawk is a data and analytics tool. The Quant Score is a statistical measure, not a recommendation. Trade your own plan.',
  },
  {
    q: 'What brokers do you integrate with?',
    a: 'Alerts push via webhook, SMS, and email. Direct broker execution integrations (Alpaca, IBKR) are in beta for Desk plans.',
  },
]

export default function PricingFaq() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[760px] px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center font-display text-3xl font-bold tracking-[-0.01em] text-ink-primary md:text-4xl"
        >
          Questions on the tape.
        </motion.h2>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, ease: EASE, delay: i * 0.06 }}
            >
              <AccordionItem value={`faq-${i}`} className="border-grid">
                <AccordionTrigger className="py-5 text-base font-medium text-ink-primary transition-colors hover:text-pulse hover:no-underline [&>svg]:text-ink-muted">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-ink-secondary">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
