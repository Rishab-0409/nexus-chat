import { useStore } from '../store'
import { Wifi, WifiOff, Bluetooth } from 'lucide-react'
import { useState } from 'react'
import btManager from '../utils/bluetooth'
import toast from 'react-hot-toast'

export default function NetworkBadge() {
  const { networkMode, btPeers } = useStore()
  const [scanning, setScanning] = useState(false)

  const handleBTScan = async () => {
    setScanning(true)
    const result = await btManager.scan()
    setScanning(false)
    if (result.error) toast.error('BT: ' + result.error)
    else if (result.fallback) toast('Using local mesh network', { icon: '📡' })
    else toast.success('Connected to: ' + result.device)
  }

  const configs = {
    online:    { icon: Wifi,     label: 'Online',    cls: 'net-online',  dot: 'bg-green-400' },
    offline:   { icon: WifiOff,  label: 'Offline',   cls: 'net-offline', dot: 'bg-yellow-400' },
    bluetooth: { icon: Bluetooth,'label': 'Bluetooth', cls: 'net-bt',    dot: 'bg-indigo-400' },
  }
  const cfg = configs[networkMode] || configs.online
  const Icon = cfg.icon

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-lg`}
        style={{ background: networkMode === 'online' ? 'rgba(16,185,129,0.15)' : networkMode === 'bluetooth' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                 border: `1px solid ${networkMode === 'online' ? 'rgba(16,185,129,0.3)' : networkMode === 'bluetooth' ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
        <span className={`w-2 h-2 rounded-full ${cfg.dot} ${networkMode !== 'online' ? 'bt-scanning' : ''}`} />
        <Icon className="w-3 h-3" />
        <span>{cfg.label}</span>
      </div>

      {/* BT scan button when offline */}
      {networkMode !== 'online' && (
        <button onClick={handleBTScan} disabled={scanning}
          className="px-2 py-1.5 rounded-full text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-50">
          {scanning ? 'Scanning…' : 'Find Peers'}
        </button>
      )}
    </div>
  )
}
