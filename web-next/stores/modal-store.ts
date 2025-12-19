/**
 * Modal state management with Zustand
 */

import { create } from 'zustand'
import { ConfirmationModal } from '@/lib/api/types'

interface ModalState {
  modalData: ConfirmationModal | null
  isPolling: boolean
  pollingError: string | null

  setModalData: (data: ConfirmationModal | null) => void
  setPolling: (polling: boolean) => void
  setPollingError: (error: string | null) => void
  clearModal: () => void
}

const initialState = {
  modalData: null,
  isPolling: false,
  pollingError: null,
}

export const useModalStore = create<ModalState>((set) => ({
  ...initialState,

  setModalData: (data) => set({ modalData: data }),

  setPolling: (polling) => set({ isPolling: polling }),

  setPollingError: (error) => set({ pollingError: error }),

  clearModal: () => set({ modalData: null, pollingError: null }),
}))
