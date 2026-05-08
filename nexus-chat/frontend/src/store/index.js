import { create } from 'zustand'
import api from '../utils/api'
import { connectWebSocket, disconnectWebSocket } from '../utils/websocket'

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('nexus_token'),

  // Conversations & Messages
  conversations: [],
  activeConvId: null,
  messages: {},        // conv_id -> messages[]
  typingUsers: {},     // conv_id -> { user_id: username }
  unreadCounts: {},

  // Users
  onlineUsers: new Set(),
  allUsers: [],

  // Network
  networkMode: 'online',   // 'online' | 'offline' | 'bluetooth'
  btPeers: [],

  // UI
  showSOS: false,
  sosAlerts: [],
  activeGame: null,
  showAISummarize: false,
  aiSummary: '',
  aiLoading: false,
  searchQuery: '',

  // ── Auth Actions ────────────────────────────────────────────────────────────
  login: async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password })
    localStorage.setItem('nexus_token', res.data.token)
    set({ user: res.data.user, token: res.data.token })
    await get().initialize()
    return res.data
  },

  register: async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    localStorage.setItem('nexus_token', res.data.token)
    set({ user: res.data.user, token: res.data.token })
    await get().initialize()
    return res.data
  },

  logout: () => {
    localStorage.removeItem('nexus_token')
    disconnectWebSocket()
    set({ user: null, token: null, conversations: [], messages: {}, activeConvId: null })
  },

  initialize: async () => {
    try {
      const token = localStorage.getItem('nexus_token')
      if (!token) return
      const [me, convs, users] = await Promise.all([
        api.get('/auth/me').then(r => r.data),
        api.get('/conversations').then(r => r.data),
        api.get('/users').then(r => r.data)
      ])
      set({ user: me, conversations: convs, allUsers: users })
      connectWebSocket(token, get().handleWsMessage)
      get().startNetworkMonitor()
    } catch (e) {
      console.error('Initialize error:', e)
    }
  },

  // ── WebSocket Handler ───────────────────────────────────────────────────────
  handleWsMessage: (event) => {
    const data = JSON.parse(event.data)
    const { activeConvId, messages } = get()

    switch (data.type) {
      case 'message':
        set(state => {
          const convMsgs = state.messages[data.conversation_id] || []
          // Avoid duplicates
          if (convMsgs.find(m => m.id === data.id)) return state
          return {
            messages: {
              ...state.messages,
              [data.conversation_id]: [...convMsgs, data]
            },
            conversations: state.conversations.map(c =>
              c.id === data.conversation_id
                ? { ...c, last_message: data.content, last_message_time: data.created_at,
                    unread_count: data.conversation_id !== activeConvId ? (c.unread_count || 0) + 1 : 0 }
                : c
            ).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0))
          }
        })
        break

      case 'typing':
        set(state => {
          const key = data.conversation_id
          const prev = state.typingUsers[key] || {}
          if (data.is_typing) {
            return { typingUsers: { ...state.typingUsers, [key]: { ...prev, [data.user_id]: data.username } } }
          } else {
            const { [data.user_id]: _, ...rest } = prev
            return { typingUsers: { ...state.typingUsers, [key]: rest } }
          }
        })
        // Auto-clear typing after 3s
        setTimeout(() => {
          set(state => {
            const prev = state.typingUsers[data.conversation_id] || {}
            const { [data.user_id]: _, ...rest } = prev
            return { typingUsers: { ...state.typingUsers, [data.conversation_id]: rest } }
          })
        }, 3000)
        break

      case 'presence':
        set(state => {
          const s = new Set(state.onlineUsers)
          data.is_online ? s.add(data.user_id) : s.delete(data.user_id)
          return {
            onlineUsers: s,
            allUsers: state.allUsers.map(u =>
              u.id === data.user_id ? { ...u, is_online: data.is_online } : u
            )
          }
        })
        break

      case 'reaction_update':
        set(state => {
          const updated = {}
          for (const [convId, msgs] of Object.entries(state.messages)) {
            updated[convId] = msgs.map(m =>
              m.id === data.message_id ? { ...m, reactions: data.reactions } : m
            )
          }
          return { messages: updated }
        })
        break

      case 'sos_alert':
        set(state => ({
          sosAlerts: [data, ...state.sosAlerts].slice(0, 20),
          showSOS: true
        }))
        // Play alert sound
        try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...').play() } catch {}
        break

      case 'game_move':
        set({ activeGame: { ...get().activeGame, lastMove: data } })
        break
    }
  },

  // ── Conversations ───────────────────────────────────────────────────────────
  setActiveConv: async (convId) => {
    set({ activeConvId: convId })
    if (!get().messages[convId]) {
      const msgs = await api.get(`/conversations/${convId}/messages`).then(r => r.data)
      set(state => ({
        messages: { ...state.messages, [convId]: msgs },
        conversations: state.conversations.map(c =>
          c.id === convId ? { ...c, unread_count: 0 } : c
        )
      }))
    }
  },

  sendMessage: async (content, type = 'text', extra = {}) => {
    const { activeConvId, user } = get()
    if (!activeConvId) return
    const payload = { type: 'message', conversation_id: activeConvId, content, msg_type: type, ...extra }
    window._ws?.send(JSON.stringify(payload))
  },

  sendTyping: (isTyping) => {
    const { activeConvId } = get()
    if (!activeConvId) return
    window._ws?.send(JSON.stringify({ type: 'typing', conversation_id: activeConvId, is_typing: isTyping }))
  },

  sendReaction: (messageId, emoji) => {
    const { activeConvId } = get()
    window._ws?.send(JSON.stringify({ type: 'reaction', message_id: messageId, emoji, conversation_id: activeConvId }))
  },

  createConversation: async (name, type, memberIds) => {
    const res = await api.post('/conversations', { name, type, member_ids: memberIds })
    const convs = await api.get('/conversations').then(r => r.data)
    set({ conversations: convs })
    return res.data
  },

  // ── AI Features ─────────────────────────────────────────────────────────────
  summarizeConversation: async () => {
    const { activeConvId } = get()
    set({ aiLoading: true, showAISummarize: true })
    try {
      const res = await api.post(`/conversations/${activeConvId}/summarize`)
      set({ aiSummary: res.data.summary, aiLoading: false })
    } catch {
      set({ aiSummary: 'Failed to summarize. Please try again.', aiLoading: false })
    }
  },

  getAIReply: async (prompt) => {
    const { activeConvId } = get()
    const res = await api.post(`/conversations/${activeConvId}/ai-reply`, { prompt })
    return res.data.reply
  },

  // ── SOS ─────────────────────────────────────────────────────────────────────
  sendSOS: async (message, location) => {
    await api.post('/sos/broadcast', { message, location })
  },

  // ── Network Monitor ─────────────────────────────────────────────────────────
  startNetworkMonitor: () => {
    const check = async () => {
      try {
        await fetch('/api/network/status', { signal: AbortSignal.timeout(3000) })
        if (get().networkMode !== 'online') {
          set({ networkMode: 'online' })
          connectWebSocket(localStorage.getItem('nexus_token'), get().handleWsMessage)
        }
      } catch {
        if (get().networkMode === 'online') {
          set({ networkMode: 'bluetooth' })
          get().initBluetooth()
        }
      }
    }
    setInterval(check, 5000)
    window.addEventListener('online',  () => { set({ networkMode: 'online' }); connectWebSocket(localStorage.getItem('nexus_token'), get().handleWsMessage) })
    window.addEventListener('offline', () => { set({ networkMode: 'bluetooth' }); get().initBluetooth() })
  },

  initBluetooth: async () => {
    if (!navigator.bluetooth) {
      set({ networkMode: 'offline' })
      return
    }
    set({ networkMode: 'bluetooth' })
    // BLE implementation — see BluetoothManager component
  },
}))
