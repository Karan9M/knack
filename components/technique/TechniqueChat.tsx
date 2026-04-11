'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Send, Sparkles, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MovingBorder } from '@/components/ui/moving-border'
import type { Technique } from '@/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TechniqueChatProps {
  technique: Technique
  hobby: string
}

function BlurStreamText({ text }: { text: string }) {
  const words = text.trim().length > 0 ? text.split(/\s+/) : []
  return (
    <span className="flex flex-wrap gap-x-1.5 gap-y-0.5">
      {words.map((word, index) => (
        <motion.span
          key={`${index}-${word}`}
          initial={{ filter: 'blur(10px)', opacity: 0, y: 8 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

export function TechniqueChat({ technique, hobby }: TechniqueChatProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [fetching, setFetching] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const streamRunIdRef = useRef(0)

  const title = useMemo(() => `Ask about ${technique.name}`, [technique.name])

  useEffect(() => {
    streamRunIdRef.current += 1
    setOpen(false)
    setInput('')
    setMessages([])
    setFetching(false)
    setStreaming(false)
  }, [technique.id])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      const inPanel = !!panelRef.current?.contains(target)
      const inBar = !!barRef.current?.contains(target)
      if (!inPanel && !inBar) setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, fetching, streaming])

  async function streamAssistantReply(fullText: string) {
    const runId = ++streamRunIdRef.current
    let visible = ''
    setMessages((prev) => {
      const assistantMessage: ChatMessage = { role: 'assistant', content: '' }
      return [...prev, assistantMessage].slice(-20)
    })

    for (const char of fullText) {
      if (runId !== streamRunIdRef.current) return
      visible += char
      setMessages((prev) => {
        const next = [...prev]
        const idx = next.length - 1
        if (idx >= 0 && next[idx].role === 'assistant') {
          next[idx] = { ...next[idx], content: visible }
        }
        return next.slice(-20)
      })
      await new Promise((resolve) => setTimeout(resolve, 12))
    }
  }

  async function sendMessage() {
    const question = input.trim()
    if (!question || fetching || streaming) return

    const nextUser: ChatMessage = { role: 'user', content: question }
    const nextHistory = [...messages, nextUser].slice(-12)
    setMessages(nextHistory)
    setInput('')
    setFetching(true)

    try {
      const res = await fetch('/api/technique-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          hobby,
          techniqueName: technique.name,
          whyItMatters: technique.whyItMatters,
          keyConcepts: technique.keyConcepts,
          mdxContent: technique.mdxContent,
          notes: technique.notes,
          history: nextHistory.slice(-10),
        }),
      })

      const data = (await res.json()) as { answer?: string; error?: string }
      if (!res.ok || !data.answer) {
        throw new Error(data.error ?? 'Could not get an answer')
      }

      setFetching(false)
      setStreaming(true)
      await streamAssistantReply(data.answer as string)
      setStreaming(false)
    } catch {
      setFetching(false)
      setStreaming(false)
      setMessages((prev) => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: 'I could not answer right now. Please try again.',
        }
        return [...prev, assistantMessage].slice(-20)
      })
    }
  }

  return (
    <>
      <div
        ref={barRef}
        className={cn(
          'fixed z-[67] md:right-auto md:left-1/2 md:w-[min(86vw,760px)] md:-translate-x-1/2',
          'left-[max(1rem,env(safe-area-inset-left,0px))]',
          'right-[max(5.75rem,calc(env(safe-area-inset-right,0px)+5.25rem))]',
          'bottom-[max(1.5rem,env(safe-area-inset-bottom,0px)+0.75rem)]'
        )}
      >
        <div className="relative p-[1.5px] rounded-2xl overflow-hidden shadow-lg border border-border">
          <div className="absolute inset-0 rounded-2xl">
            <MovingBorder duration={7000} rx="50%" ry="50%">
              <div className="h-20 w-20 bg-[radial-gradient(circle,oklch(0.6171_0.1375_39)_0%,oklch(0.74_0.13_55)_50%,transparent_80%)] opacity-80" />
            </MovingBorder>
          </div>

          <div className="relative flex min-h-[60px] items-center gap-2 rounded-[calc(1rem-1px)] bg-card py-1.5 pl-2.5 pr-2 sm:gap-2.5 sm:pl-3 sm:pr-2.5 md:px-4">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary/80 hover:bg-secondary"
              aria-label={open ? 'Close chat panel' : 'Open chat panel'}
            >
              {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </button>

            <div className="min-w-0 flex-1">
              <input
                value={input}
                onFocus={() => setOpen(true)}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
                placeholder={`Ask about ${technique.name}...`}
                className={cn(
                  'h-10 w-full min-w-0 border-0 bg-transparent py-2 text-[0.9375rem] sm:text-[1.0625rem]',
                  'placeholder:text-muted-foreground/70 focus:outline-none'
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={fetching || streaming || input.trim().length === 0}
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                'bg-secondary text-foreground disabled:opacity-50',
                'touch-manipulation'
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed bottom-24 z-[67] left-4 right-4 md:right-auto md:w-[min(86vw,760px)] md:left-1/2 md:-translate-x-1/2 rounded-2xl border border-border',
              'bg-card shadow-2xl backdrop-blur overflow-hidden'
            )}
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Technique Coach
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
            </div>

            <div ref={listRef} className="max-h-[44vh] overflow-y-auto px-3 py-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground px-1">
                  Ask anything about this technique and I&apos;ll answer using current content
                  context.
                </p>
              )}
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => (
                  <motion.div
                    key={`${m.role}-${idx}`}
                    initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      'flex items-end gap-2.5',
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {m.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-foreground/80" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                        m.role === 'user'
                          ? 'rounded-br-md bg-primary/25 text-foreground'
                          : 'bg-secondary text-foreground'
                      )}
                    >
                      {m.role === 'assistant' ? (
                        m.content ? (
                          <BlurStreamText text={m.content} />
                        ) : (
                          '...'
                        )
                      ) : (
                        m.content
                      )}
                    </div>
                    {m.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-0.5">
                        <User className="h-4 w-4 text-foreground/80" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {fetching && (
                <motion.div
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 0.8, repeatType: 'reverse' }}
                  className="flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-foreground/80" />
                  </div>
                  <div className="rounded-2xl bg-secondary px-3 py-2 text-sm text-foreground">
                    Thinking...
                  </div>
                </motion.div>
              )}
            </div>

            <div className="border-t border-border p-2.5 text-xs text-muted-foreground">
              Context: {technique.name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
