import { useState } from 'react'
import { useStore } from '../store'
import { AlertTriangle, MapPin, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import btManager from '../utils/bluetooth'

export default function SOSButton() {
  const { sendSOS, user, networkMode } = useStore()
  const [open, setOpen]       = useState(false)
  const [message, setMessage] = useState('EMERGENCY — I need immediate help!')
  const [locating, setLocating] = useState(false)
  const [location, setLocation] = useState(null)
  const [sending, setSending]   = useState(false)
  const [countdown, setCountdown] = useState(0)

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        toast.success('Location captured')
      },
      () => { setLocating(false); toast.error('Location unavailable') },
      { timeout: 8000 }
    )
  }

  const handleSOS = async () => {
    if (sending) return
    setSending(true)
    // 3-second countdown so accidental taps can be cancelled
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      await new Promise(r => setTimeout(r, 1000))
    }
    setCountdown(0)

    try {
      // Internet broadcast
      await sendSOS(message, location)
      // Bluetooth broadcast for offline coverage
      await btManager.sendSOS(user?.id, user?.username, message, location)
      toast.success('🚨 SOS broadcast sent to all users!', { duration: 6000 })
      setOpen(false)
    } catch (e) {
      // If internet fails, still broadcast via BT
      try {
        await btManager.sendSOS(user?.id, user?.username, message, location)
        toast('🔵 SOS sent via Bluetooth', { icon: '📡', duration: 6000 })
      } catch {
        toast.error('SOS failed — no network available')
      }
    }
    setSending(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative sos-ring w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40 transition-colors"
        title="Send SOS Emergency Alert"
      >
        <AlertTriangle className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-red-500/20">
            {/* Header */}
            <div className="bg-red-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <span className="font-bold text-white text-lg">Emergency SOS</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-gray-400 text-sm">
                This will broadcast an emergency alert to <strong className="text-white">ALL users</strong> via
                {networkMode === 'online' ? ' internet' : ''} and Bluetooth mesh network.
              </p>

              {/* Message */}
              <div>
                <label className="block text-xs text-gray-400 mb-2 font-medium">Emergency Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  className="nexus-input w-full rounded-xl px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* Quick messages */}
              <div className="flex flex-wrap gap-2">
                {['Need medical help!', 'Fire emergency!', 'Stuck/Trapped!', 'Send police!'].map(m => (
                  <button key={m} onClick={() => setMessage(m)}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-red-500/50 transition-colors">
                    {m}
                  </button>
                ))}
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <button onClick={getLocation} disabled={locating}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-nexus-500/50 transition-colors disabled:opacity-50">
                  <MapPin className="w-4 h-4 text-nexus-400" />
                  {locating ? 'Getting location…' : location ? '✓ Location added' : 'Add Location'}
                </button>
                {location && (
                  <span className="text-xs text-gray-500">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </span>
                )}
              </div>

              {/* Send button */}
              <button
                onClick={handleSOS}
                disabled={sending || !message.trim()}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-colors"
                style={{ animation: sending ? 'sosFlash 0.5s ease-in-out infinite' : 'none' }}
              >
                <Send className="w-4 h-4" />
                {countdown > 0 ? `Sending in ${countdown}…` : sending ? 'Broadcasting…' : 'SEND SOS ALERT'}
              </button>

              {sending && countdown > 0 && (
                <button onClick={() => { setSending(false); setCountdown(0) }}
                  className="w-full py-2 rounded-xl border border-white/20 text-sm text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
