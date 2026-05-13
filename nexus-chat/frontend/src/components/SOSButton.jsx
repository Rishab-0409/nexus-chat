import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { AlertTriangle, MapPin, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import btManager from '../utils/bluetooth'

export default function SOSButton() {
  const { sendSOS, user, networkMode } = useStore()
  const [open, setOpen]           = useState(false)
  const [message, setMessage]     = useState('EMERGENCY — I need immediate help!')
  const [locating, setLocating]   = useState(false)
  const [location, setLocation]   = useState(null)
  const [sending, setSending]     = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const closeModal = () => {
    setOpen(false)
    setSending(false)
    setCountdown(0)
    setLocation(null)
    setMessage('EMERGENCY — I need immediate help!')
  }

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
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      await new Promise(r => setTimeout(r, 1000))
    }
    setCountdown(0)
    try {
      await sendSOS(message, location)
      await btManager.sendSOS(user?.id, user?.username, message, location)
      toast.success('🚨 SOS broadcast sent to all users!', { duration: 6000 })
      closeModal()
    } catch (e) {
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
      {/* SOS Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40 transition-colors flex-shrink-0"
        title="Send SOS Emergency Alert"
      >
        <AlertTriangle className="w-4 h-4" />
      </button>

      {/* Modal — rendered at document root level via fixed positioning */}
      {open && (
        <div
          className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#1a1a2e', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: '#dc2626' }} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <span className="font-bold text-white text-lg">Emergency SOS</span>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-gray-400 text-sm">
                This will broadcast an emergency alert to{' '}
                <strong className="text-white">ALL users</strong> via internet and Bluetooth.
              </p>

              {/* Message textarea */}
              <div>
                <label className="block text-xs text-gray-400 mb-2 font-medium">
                  Emergency Message
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none text-white"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                />
              </div>

              {/* Quick messages */}
              <div className="flex flex-wrap gap-2">
                {['Need medical help!', 'Fire emergency!', 'Stuck/Trapped!', 'Send police!'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMessage(m)}
                    className="px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <button
                  onClick={getLocation}
                  disabled={locating}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <MapPin className="w-4 h-4 text-blue-400" />
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
                className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                style={{ background: '#dc2626' }}
              >
                <Send className="w-4 h-4" />
                {countdown > 0
                  ? `Sending in ${countdown}…`
                  : sending
                  ? 'Broadcasting…'
                  : 'SEND SOS ALERT'}
              </button>

              {/* Cancel during countdown */}
              {sending && countdown > 0 && (
                <button
                  onClick={closeModal}
                  className="w-full py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
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