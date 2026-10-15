import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2, X, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIChatMessage, AIProvider, LineItem } from '../../types'
import { useRateItems } from '../../hooks/useRateItems'
import { useAISettings } from '../../hooks/useAISettings'
import { chatEditQuoteWithAI } from '../../lib/aiClient'
import { uid } from '../../lib/utils'
import { toast } from '../../store/useToastStore'
import clsx from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
  projectName: string
  projectLocation: string
  lineItems: LineItem[]
  notes: string
  defaultProvider?: AIProvider
  onApply: (changes: { project_name?: string; project_location?: string; line_items?: LineItem[]; notes?: string }) => void
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: 'Claude 3.5',
  openai: 'GPT-4o',
  google: 'Gemini 1.5',
}

export function AIChatPanel({ open, onClose, projectName, projectLocation, lineItems, notes, defaultProvider, onApply }: Props) {
  const { data: rateSheet = [] } = useRateItems()
  const { data: aiSettings } = useAISettings()
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [provider, setProvider] = useState<AIProvider | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (provider === null) {
      setProvider(defaultProvider ?? aiSettings?.default_provider ?? 'anthropic')
    }
  }, [defaultProvider, aiSettings, provider])

  const effectiveProvider: AIProvider = provider ?? defaultProvider ?? aiSettings?.default_provider ?? 'anthropic'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, sending])

  async function handleSend() {
    if (!input.trim() || sending) return
    const instruction = input.trim()
    setInput('')

    const userMsg: AIChatMessage = { 
      id: uid(), 
      role: 'user', 
      content: instruction, 
      created_at: new Date().toISOString() 
    }
    setMessages((prev) => [...prev, userMsg])
    setSending(true)

    try {
      // 1. Call the AI Function
      const updated = await chatEditQuoteWithAI({
        provider: effectiveProvider,
        instruction,
        currentState: { 
          project_name: projectName, 
          project_location: projectLocation || null, 
          line_items: lineItems, 
          notes: notes || null 
        },
        rateSheet,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      })

      // 2. Map the response to our NEW LineItem structure
      const newLineItems: LineItem[] = (updated.line_items ?? []).map((li: any) => {
        // Try to find a matching category_id from the rate sheet based on name
        const matchingRate = rateSheet.find(r => 
          r.category?.name.toLowerCase() === li.category_name?.toLowerCase() ||
          r.name.toLowerCase() === li.description?.toLowerCase()
        );

        return {
          id: li.id ?? uid(),
          description: li.description,
          qualification: li.qualification ?? undefined,
          quantity: Number(li.quantity) || 0,
          unit: li.unit,
          rate: Number(li.rate) || 0,
          is_call_out: !!li.is_call_out,
          // Use AI values if they exist, otherwise fallback to defaults
          call_out_min_hours: li.call_out_min_hours ?? 4,
          reporting_hours: li.reporting_hours ?? 1,
          category_id: li.category_id ?? matchingRate?.category_id,
          category_name: li.category_name ?? 'Other',
        }
      })

      // 3. Update the UI / Parent state
      onApply({
        project_name: updated.project_name,
        project_location: updated.project_location ?? undefined,
        line_items: newLineItems,
        notes: updated.notes ?? undefined,
      })

      const assistantMsg: AIChatMessage = {
        id: uid(),
        role: 'assistant',
        content: updated.assistant_reply ?? 'Done — I updated the quote.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      console.error('AI Chat Error:', err)
      toast({ 
        type: 'error', 
        title: 'AI edit failed', 
        description: err.message || 'Check Supabase Function logs' 
      })
      // Put the text back in the input so the user doesn't lose it
      setMessages((prev) => prev.slice(0, -1))
      setInput(instruction)
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-6 right-6 w-[420px] h-[600px] z-[100] flex flex-col overflow-hidden"
          style={{
            borderRadius: '2rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.4)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/30 bg-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Sparkles size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">AI Assistant</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Engrity AI Solutions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <select
                  value={effectiveProvider}
                  onChange={(e) => setProvider(e.target.value as AIProvider)}
                  className="appearance-none text-[11px] font-bold rounded-full border border-white/50 px-4 py-1.5 bg-white/40 hover:bg-white/60 transition-all cursor-pointer outline-none pr-7"
                >
                  {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <Cpu size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center border border-white/80 shadow-sm">
                  <Sparkles className="text-blue-400" size={24} />
                </div>
                <p className="text-xs text-gray-500 max-w-[220px] leading-relaxed">
                  "Change project name to Sturgeon County" or "Add 4 hours for the technician."
                </p>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={clsx(
                    'flex flex-col max-w-[85%]',
                    m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  <div
                    className={clsx(
                      'px-4 py-3 text-sm leading-relaxed shadow-sm',
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-[20px] rounded-tr-[4px] shadow-blue-200' 
                        : 'bg-white/80 text-gray-800 rounded-[20px] rounded-tl-[4px] border border-white'
                    )}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1.5 px-1 uppercase font-bold tracking-tighter">
                    {m.role === 'user' ? 'You' : PROVIDER_LABELS[effectiveProvider]}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {sending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                <div className="bg-white/60 border border-white px-4 py-3 rounded-[20px] rounded-tl-[4px] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  <span className="text-sm text-gray-500 font-medium italic">Processing liquid edits...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/20 border-t border-white/30">
            <div className="relative flex items-center bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-inner px-2 py-2 focus-within:ring-2 ring-blue-500/20 transition-all">
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 placeholder:text-gray-400 text-gray-900"
                placeholder="Type instructions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend} 
                disabled={sending || !input.trim()} 
                className={clsx(
                  "p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center",
                  input.trim() ? "bg-blue-600 text-white hover:scale-105 active:scale-95" : "bg-gray-200 text-gray-400"
                )}
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}