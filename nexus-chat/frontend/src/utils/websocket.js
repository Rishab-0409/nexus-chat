let ws = null
let reconnectTimer = null
let messageHandler = null

export function connectWebSocket(token, onMessage) {
  if (ws?.readyState === WebSocket.OPEN) return
  messageHandler = onMessage

  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${proto}://${location.host}/ws/${token}`
  ws = new WebSocket(url)
  window._ws = ws

  ws.onopen = () => {
    console.log('[WS] Connected')
    clearTimeout(reconnectTimer)
  }

  ws.onmessage = (event) => {
    if (messageHandler) messageHandler(event)
  }

  ws.onclose = (e) => {
    console.log('[WS] Disconnected', e.code)
    window._ws = null
    if (e.code !== 4001) {
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
  ws?.close()
  ws = null
  window._ws = null
}

export function sendWS(data) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(typeof data === 'string' ? data : JSON.stringify(data))
  }
}
