import { useStore } from '../store'
import { AlertTriangle, MapPin, X } from 'lucide-react'

export default function SOSAlert() {
  const { sosAlerts, showSOS } = useStore()
  const latest = sosAlerts[0]

  if (!latest) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-red-500/50"
        style={{ animation: 'sosFlash 0.8s ease-in-out 3' }}>
        {/* Red header */}
        <div className="bg-red-600 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-6 h-6 text-white" />
            <span className="font-black text-white text-xl tracking-wide">🚨 EMERGENCY SOS</span>
          </div>
          <p className="text-red-200 text-xs">
            Via {latest.via === 'bluetooth' ? '🔵 Bluetooth' : '🌐 Internet'} •{' '}
            {new Date(latest.timestamp).toLocaleTimeString('en-IN')}
          </p>
        </div>

        <div className="bg-gray-900 p-5 space-y-4">
          <div>
            <p className="text-sm text-gray-400 font-medium">From</p>
            <p className="text-white font-bold text-lg">{latest.sender_name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-400 font-medium mb-1">Message</p>
            <p className="text-white bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-sm">
              {latest.message}
            </p>
          </div>

          {latest.location && (
            <a
              href={`https://maps.google.com/?q=${latest.location.lat},${latest.location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              View location on Google Maps →
            </a>
          )}

          {/* Multiple alerts indicator */}
          {sosAlerts.length > 1 && (
            <p className="text-xs text-gray-500 text-center">
              +{sosAlerts.length - 1} more alert{sosAlerts.length > 2 ? 's' : ''}
            </p>
          )}

          <button
            onClick={() => useStore.setState({ showSOS: false })}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
