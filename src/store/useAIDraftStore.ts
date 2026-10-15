import { create } from 'zustand'
import { AIQuoteDraft, PendingAttachment } from '../types/ai'
import { AIProvider } from '../types'

interface AIDraftStore {
  pendingDraft: AIQuoteDraft | null
  pendingAttachments: PendingAttachment[]
  pendingProvider: AIProvider | null
  setPendingDraft: (draft: AIQuoteDraft, attachments: PendingAttachment[], provider: AIProvider) => void
  clearPendingDraft: () => void
}

export const useAIDraftStore = create<AIDraftStore>((set) => ({
  pendingDraft: null,
  pendingAttachments: [],
  pendingProvider: null,
  setPendingDraft: (draft, attachments, provider) =>
    set({ pendingDraft: draft, pendingAttachments: attachments, pendingProvider: provider }),
  clearPendingDraft: () => set({ pendingDraft: null, pendingAttachments: [], pendingProvider: null }),
}))
