export type SplitMode = 'Even' | 'Custom' | 'ByConsumption'
export type PaymentStatus = 'Pending' | 'MarkedAsPaid' | 'Confirmed'

export interface PaymentInfoDto {
  bankName: string
  accountType: string
  accountNumber: string
  rut: string
  holderName: string
  email: string
}

export interface ConsumptionItemDto {
  id: string
  description: string
  unitPrice: number
  quantity: number
  isShared: boolean
  sharedWithParticipantIds: string[] | null
  lineTotal: number
}

export interface OtherParticipantDto {
  id: string
  name: string
}

export interface ParticipantResponse {
  id: string
  name: string
  phone: string | null
  amount: number
  status: PaymentStatus
  uniqueToken: string
  paidAt: string | null
  items: ConsumptionItemDto[]
  paymentInfo?: PaymentInfoDto
  eventName?: string
  organizerName?: string
  isEventLocked: boolean
  splitMode?: SplitMode
  otherParticipants: OtherParticipantDto[]
}

export interface EventResponse {
  id: string
  eventName: string
  organizerName: string
  adminCode?: string
  totalAmount: number
  splitMode: SplitMode
  isLocked: boolean
  tipPercentage: number
  paymentInfo: PaymentInfoDto
  participants: ParticipantResponse[]
  createdAt: string
  expiresAt: string
  confirmedCount: number
  totalParticipants: number
}

export interface ParticipantSummaryDto {
  id: string
  name: string
  amount: number
  status: string
  items: ConsumptionItemDto[]
}

export interface EventSummaryResponse {
  eventId: string
  totalAmount: number
  tipPercentage: number
  isLocked: boolean
  participants: ParticipantSummaryDto[]
}

export interface ParticipantInputDto {
  name: string
  phone?: string
  amount: number
}

export interface CreateEventRequest {
  eventName: string
  organizerName: string
  splitMode: SplitMode
  totalAmount: number
  tipPercentage: number
  paymentInfo: PaymentInfoDto
  participants: ParticipantInputDto[]
}

export interface AddItemRequest {
  description: string
  unitPrice: number
  quantity: number
  isShared: boolean
  sharedWithParticipantIds?: string[]
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const { headers: optHeaders, ...restOptions } = options ?? {}
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...optHeaders },
    ...restOptions,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body.errors) {
        const firstErrors = Object.values(body.errors as Record<string, string[]>).flat()
        message = firstErrors[0] ?? message
      } else {
        message = body.message ?? body.title ?? message
      }
    } catch { /* ignore */ }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  createEvent: (data: CreateEventRequest) =>
    apiFetch<EventResponse>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEvent: (id: string, adminCode: string) =>
    apiFetch<EventResponse>(`/api/events/${id}`, {
      headers: { 'X-Admin-Code': adminCode },
    }),

  getEventSummary: (id: string, adminCode: string) =>
    apiFetch<EventSummaryResponse>(`/api/events/${id}/summary`, {
      headers: { 'X-Admin-Code': adminCode },
    }),

  lockEvent: (id: string, adminCode: string, tipPercentage: number) =>
    apiFetch<EventResponse>(`/api/events/${id}/lock`, {
      method: 'POST',
      headers: { 'X-Admin-Code': adminCode },
      body: JSON.stringify({ tipPercentage }),
    }),

  deleteEvent: (id: string, adminCode: string) =>
    apiFetch<void>(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Code': adminCode },
    }),

  remind: (eventId: string, participantId: string, adminCode: string) =>
    apiFetch<{ whatsappUrl: string }>(`/api/events/${eventId}/remind/${participantId}`, {
      method: 'POST',
      headers: { 'X-Admin-Code': adminCode },
    }),

  getParticipant: (token: string) =>
    apiFetch<ParticipantResponse>(`/api/participants/${token}`),

  markPaid: (token: string) =>
    apiFetch<ParticipantResponse>(`/api/participants/${token}/mark-paid`, {
      method: 'PATCH',
    }),

  confirmPayment: (participantId: string, adminCode: string) =>
    apiFetch<ParticipantResponse>(`/api/participants/${participantId}/confirm`, {
      method: 'PATCH',
      headers: { 'X-Admin-Code': adminCode },
    }),

  addItem: (token: string, data: AddItemRequest) =>
    apiFetch<ParticipantResponse>(`/api/participants/${token}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: (token: string, itemId: string, data: AddItemRequest) =>
    apiFetch<ParticipantResponse>(`/api/participants/${token}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteItem: (token: string, itemId: string) =>
    apiFetch<ParticipantResponse>(`/api/participants/${token}/items/${itemId}`, {
      method: 'DELETE',
    }),

  addParticipant: (eventId: string, adminCode: string, data: ParticipantInputDto) =>
    apiFetch<EventResponse>(`/api/events/${eventId}/participants`, {
      method: 'POST',
      headers: { 'X-Admin-Code': adminCode },
      body: JSON.stringify(data),
    }),
}

export { ApiError }
