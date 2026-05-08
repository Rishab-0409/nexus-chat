import { useStore } from '../store'
import { Sparkles, X, Copy, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AISummaryModal() {
  const { aiSummary, aiLoading, summarizeConversation } = useStore()

  const copy = () => {
    navigator.clipboard.writeText(aiSummary)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg glass border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">AI Chat Summary</h3>
              <p className="text-xs text-gray-500">Powered by Claude</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={summarizeConversation} disabled={aiLoading}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Regenerate">
              <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={copy} disabled={aiLoading}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              title="Copy">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => useStore.setState({ showAISummarize: false, aiSummary: '' })}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {aiLoading
            ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{animationDelay:'0ms'}} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{animationDelay:'150ms'}} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{animationDelay:'300ms'}} />
                  <span className="text-sm text-gray-400 ml-1">Analyzing conversation…</span>
                </div>
                {[4, 3, 5].map((w, i) => (
                  <div key={i} className={`h-4 rounded-full bg-white/5 animate-pulse`} style={{ width: `${w * 15}%` }} />
                ))}
              </div>
            )
            : (
              <div className="bg-purple-500/5 border border-purple-500/15 rounded-xl p-4">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {aiSummary || 'No summary available.'}
                </p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
