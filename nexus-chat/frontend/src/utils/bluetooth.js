/**
 * BluetoothManager
 * Uses Web Bluetooth API + BroadcastChannel for local peer mesh
 * Falls back to BroadcastChannel (same-device tabs) when BLE not available
 */

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const TX_UUID      = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
const RX_UUID      = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

class BluetoothManager {
  constructor() {
    this.device = null
    this.server = null
    this.rxChar = null
    this.txChar = null
    this.peers = new Map()
    this.channel = new BroadcastChannel('nexus-chat-bt')
    this.onMessage = null
    this.isScanning = false
  }

  init(onMessage) {
    this.onMessage = onMessage
    // BroadcastChannel for local same-device simulation
    this.channel.onmessage = (e) => {
      if (e.data.type === 'bt_message' && this.onMessage) {
        this.onMessage({ ...e.data, via: 'broadcast_channel' })
      }
    }
    console.log('[BT] Manager initialized')
  }

  async scan() {
    if (!navigator.bluetooth) {
      console.log('[BT] Web Bluetooth not supported, using BroadcastChannel fallback')
      this.isScanning = true
      return { fallback: true, message: 'Using local mesh (BroadcastChannel)' }
    }
    try {
      this.isScanning = true
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'NexusChat' }],
        optionalServices: [SERVICE_UUID]
      })
      this.server = await this.device.gatt.connect()
      const service = await this.server.getPrimaryService(SERVICE_UUID)
      this.rxChar = await service.getCharacteristic(RX_UUID)
      this.txChar = await service.getCharacteristic(TX_UUID)
      await this.rxChar.startNotifications()
      this.rxChar.addEventListener('characteristicvaluechanged', (e) => {
        const decoder = new TextDecoder()
        const msg = decoder.decode(e.target.value)
        try {
          const parsed = JSON.parse(msg)
          if (this.onMessage) this.onMessage({ ...parsed, via: 'bluetooth' })
        } catch {}
      })
      this.peers.set(this.device.id, { name: this.device.name, connected: true })
      return { success: true, device: this.device.name }
    } catch (err) {
      this.isScanning = false
      return { error: err.message }
    }
  }

  async send(message) {
    const payload = JSON.stringify({ type: 'bt_message', ...message, timestamp: Date.now() })
    // Try real BT
    if (this.txChar) {
      try {
        const encoder = new TextEncoder()
        // BT packets are max 512 bytes; chunk if needed
        const bytes = encoder.encode(payload)
        for (let i = 0; i < bytes.length; i += 512) {
          await this.txChar.writeValue(bytes.slice(i, i + 512))
        }
        return true
      } catch (e) {
        console.warn('[BT] Send failed, falling back to BroadcastChannel', e)
      }
    }
    // Fallback to BroadcastChannel
    this.channel.postMessage({ type: 'bt_message', ...message, timestamp: Date.now() })
    return true
  }

  async sendSOS(senderId, senderName, message, location) {
    const sos = {
      type: 'sos_alert',
      sender_id: senderId,
      sender_name: senderName,
      message,
      location,
      priority: 'EMERGENCY',
      via: 'bluetooth',
      timestamp: new Date().toISOString()
    }
    await this.send(sos)
    this.channel.postMessage(sos) // Also broadcast locally
    return sos
  }

  getPeers() {
    return Array.from(this.peers.values())
  }

  disconnect() {
    this.device?.gatt?.disconnect()
    this.isScanning = false
    this.device = null
  }
}

export const btManager = new BluetoothManager()
export default btManager
