const BACKEND_URL = 'https://nexus-chat-production-527c.up.railway.app'

let ws = null
let reconnectTimer = null
let messageHandler = null

function getWsUrl(token) {
  const base = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')
  return `${base}/ws/${token}`
}

export function connectWebSocket(token, onMessage) {
  if (ws?.readyState === WebSocket.OPEN) return
  messageHandler = onMessage
  const url = getWsUrl(token)
  console.log('[WS] Connecting to:', url)
  ws = new WebSocket(url)
  window._ws = ws

  ws.onopen = () => { console.log('[WS] Connected'); clearTimeout(reconnectTimer) }
  ws.onmessage = (event) => { if (messageHandler) messageHandler(event) }
  ws.onclose = (e) => {
    console.log('[WS] Disconnected, code:', e.code)
    window._ws = null
    ws = null
    if (e.code !== 4001 && e.code !== 1000) {
      reconnectTimer = setTimeout(() => {
        const t = localStorage.getItem('nexus_token')
        if (t) connectWebSocket(t, messageHandler)
      }, 3000)
    }
  }
  ws.onerror = (e) => console.error('[WS] Error', e)
}

export function disconnectWebSocket() {
  clearTimeout(reconnectTimer)
  ws?.close(1000, 'logout')
  ws = null
  window._ws = null
}

export function sendWS(data) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(typeof data === 'string' ? data : JSON.stringify(data))
    return true
  }
  console.warn('[WS] Not connected')
  return false
}