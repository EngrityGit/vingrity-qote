import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Paperclip, X, Loader2, Wand2, ImageIcon, FileIcon, ChevronDown } from 'lucide-react'
import { useRateItems } from '../../hooks/useRateItems'
import { useHubLocations } from '../../hooks/useHubLocations'
import { useClients } from '../../hooks/useClients'
import { useAISettings } from '../../hooks/useAISettings'
import { generateQuoteWithAI } from '../../lib/aiClient'
import { fileToBase64 } from '../../lib/utils'
import { AIProvider } from '../../types'
import { PendingAttachment } from '../../types/ai'
import { useAIDraftStore } from '../../store/useAIDraftStore'
import { toast } from '../../store/useToastStore'

const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: 'Claude 3.5',
  openai: 'GPT-4o',
  google: 'Gemini 1.5',
}

export function AIQuoteGenerator({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { data: rateSheet = [] } = useRateItems()
  const { data: hubLocations = [] } = useHubLocations()
  const { data: clients = [] } = useClients()
  const { data: aiSettings } = useAISettings()
  const { setPendingDraft } = useAIDraftStore()

  const [requestText, setRequestText] = useState('')
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [provider, setProvider] = useState<AIProvider | null>(null)
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (provider === null && aiSettings?.default_provider) {
      setProvider(aiSettings.default_provider)
    }
  }, [aiSettings, provider])

  const effectiveProvider = provider ?? aiSettings?.default_provider ?? 'anthropic'

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const newAttachments: PendingAttachment[] = []
    for (const file of Array.from(files)) {
      const base64 = await fileToBase64(file)
      newAttachments.push({ fileName: file.name, mediaType: file.type, base64, file })
    }
    setAttachments((prev) => [...prev, ...newAttachments])
  }

  function removeAttachment(fileName: string) {
    setAttachments((prev) => prev.filter((a) => a.fileName !== fileName))
  }

  async function handleGenerate() {
    if (!requestText.trim() && attachments.length === 0) {
      toast({ type: 'warning', title: 'Input required', description: 'Please provide a request or a file.' })
      return
    }
    setGenerating(true)
    try {
      const draft = await generateQuoteWithAI({
        provider: effectiveProvider,
        requestText,
        attachments,
        rateSheet,
        hubLocations,
        clientNames: clients.map((c) => c.company_name),
      })
      setPendingDraft(draft, attachments, effectiveProvider)
      toast({ type: 'success', title: 'Draft generated' })
      navigate('/quotes/new')
    } catch (err: any) {
      toast({ type: 'error', title: 'Generation failed', description: err.message })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className={`bg-white rounded-[32px] shadow-[0_20px_50px_rgba(32,32,96,0.05)] border border-gray-100 overflow-hidden ${compact ? 'p-4' : 'p-8'}`}>
      
      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] flex items-center justify-center">
            <Sparkles size={20} className="text-[#0071fe]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#202060]">AI Estimator</h3>
            <p className="text-[10px] text-[#00adee] font-bold uppercase tracking-widest">Powered by Intelligence</p>
          </div>
        </div>
        
        <div className="relative group">
          <select
            value={effectiveProvider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            className="appearance-none bg-gray-50 border-none rounded-full pl-4 pr-10 py-2 text-[11px] font-bold text-gray-500 outline-none hover:bg-gray-100 transition-all cursor-pointer"
          >
            {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 2. INPUT AREA */}
      <div className="relative mb-6">
        <textarea
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          placeholder="Describe your project or paste client requirements here..."
          className="w-full min-h-[160px] bg-gray-50 rounded-[24px] p-6 text-sm border-2 border-transparent focus:border-[#0071fe]/20 focus:bg-white outline-none transition-all placeholder:text-gray-400 text-[#202060] resize-none"
        />
        
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 pt-0">
            {attachments.map((a) => (
              <div key={a.fileName} className="flex items-center gap-2 bg-[#F0F7FF] border border-[#0071fe]/10 rounded-full px-3 py-1.5 text-[10px] font-bold text-[#0071fe]">
                {a.mediaType.startsWith('image/') ? <ImageIcon size={14}/> : <FileIcon size={14}/>}
                <span className="max-w-[120px] truncate">{a.fileName}</span>
                <button onClick={() => removeAttachment(a.fileName)} className="hover:text-[#fa0202]">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. ACTIONS */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-[#202060] text-xs font-bold hover:bg-gray-50 transition-all"
        >
          <Paperclip size={18} className="text-gray-400" />
          <span>Attach File</span>
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

        <button 
          onClick={handleGenerate} 
          disabled={generating} 
          className="flex items-center gap-3 px-10 py-3.5 rounded-full bg-[#0071fe] text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
        >
          {generating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
          <span>{generating ? 'Analyzing...' : 'Generate Quote'}</span>
        </button>
      </div>
    </div>
  )
}