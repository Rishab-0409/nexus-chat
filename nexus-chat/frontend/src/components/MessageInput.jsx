import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from '../store'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../utils/api'
import {
  Send, Paperclip, Smile, Mic, MicOff, Sparkles, X, Image
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

export default function MessageInput({ replyTo, onCancelReply }) {
  const { sendMessage, sendTyping, getAIReply } = useStore()

  const [text, setText]             = useState('')
  const [showEmoji, setShowEmoji]   = useState(false)
  const [recording, setRecording]   = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [aiLoading, setAiLoading]   = useState(false)
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [aiSuggestions, setAiSugg] = useState([])

  const inputRef    = useRef(null)
  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const typingTimer = useRef(null)

  // Focus input on mount & conv change
  useEffect(() => { inputRef.current?.focus() }, [])

  // ── Typing indicator ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setText(e.target.value)
    sendTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => sendTyping(false), 2000)
  }

  // ── Send text ───────────────────────────────────────────────────────────────
  const handleSend = () => {
    const content = text.trim()
    if (!content) return
    sendMessage(content, 'text', replyTo ? { reply_to: replyTo.id } : {})
    setText('')
    onCancelReply?.()
    setShowEmoji(false)
    sendTyping(false)
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── File upload ─────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (files) => {
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) { toast.error(`${file.name} is too large (max 50 MB)`); continue }
      setUploading(true)
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await api.post('/upload', form)
        const { url, type, name, size } = res.data
        sendMessage(name, type, { file_url: url, file_name: name, file_size: size, reply_to: replyTo?.id })
        onCancelReply?.()
      } catch { toast.error('Upload failed') }
      finally { setUploading(false) }
    }
  }, [replyTo])

  const { getRootProps, getInputProps, isDragActive, open: openFile } = useDropzone({
    onDrop, noClick: true, noKeyboard: true,
    accept: {
      'image/*': [], 'video/*': [], 'audio/*': [],
      'application/pdf': [], 'text/*': [],
      'application/zip': [], 'application/msword': [],
    }
  })

  // ── Voice recording ─────────────────────────────────────────────────────────
  const toggleRecording = async () => {
    if (recording) {
      mediaRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' })
        const file = new File([blob], `voice_${Date.now()}.ogg`, { type: 'audio/ogg' })
        await onDrop([file])
      }
      recorder.start()
      mediaRef.current = recorder
      setRecording(true)
    } catch { toast.error('Microphone access denied') }
  }

  // ── AI Suggestions ──────────────────────────────────────────────────────────
  const fetchAISuggestions = async () => {
    setAiLoading(true)
    setShowAIMenu(true)
    try {
      const prompts = [
        'Suggest a friendly reply',
        'Summarize what was said',
        'Write a professional response',
      ]
      const replies = await Promise.all(
        prompts.map(p => getAIReply(p))
      )
      setAiSugg(replies)
    } catch { toast.error('AI unavailable') }
    finally { setAiLoading(false) }
  }

  return (
    <div className="border-t border-white/5 bg-gray-900/50">
      {/* Drag overlay */}
      <div {...getRootProps()} className={`relative ${isDragActive ? 'ring-2 ring-nexus-500 ring-inset' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive && (
          <div className="absolute inset-0 bg-nexus-500/10 flex items-center justify-center z-20 rounded-lg m-2 border-2 border-dashed border-nexus-500">
            <p className="text-nexus-400 font-medium">Drop files here</p>
          </div>
        )}

        <div className="px-4 py-3">
          <div className="flex items-end gap-2">
            {/* Left actions */}
            <div className="flex items-center gap-1 flex-shrink-0 pb-1">
              <button onClick={openFile} disabled={uploading}
                className="p-2 rounded-lg text-gray-400 hover:text-nexus-400 hover:bg-white/5 transition-colors"
                title="Attach file">
                <Paperclip className="w-4 h-4" />
              </button>
              <button onClick={() => setShowEmoji(p => !p)}
                className="p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-white/5 transition-colors"
                title="Emoji">
                <Smile className="w-4 h-4" />
              </button>
              <button onClick={fetchAISuggestions} disabled={aiLoading}
                className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-white/5 transition-colors"
                title="AI suggestions">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            {/* Text area */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKey}
                placeholder="Message… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="nexus-input w-full rounded-2xl px-4 py-2.5 text-sm resize-none leading-relaxed"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 flex-shrink-0 pb-1">
              <button onClick={toggleRecording}
                className={`p-2 rounded-lg transition-colors ${recording
                  ? 'text-red-400 bg-red-500/10 animate-pulse'
                  : 'text-gray-400 hover:text-nexus-400 hover:bg-white/5'}`}
                title={recording ? 'Stop recording' : 'Voice message'}>
                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSend}
                disabled={!text.trim() && !uploading}
                className="p-2 rounded-xl bg-nexus-500 hover:bg-nexus-600 disabled:opacity-40 text-white transition-colors shadow-lg shadow-nexus-500/20"
              >
                {uploading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 z-50">
          <EmojiPicker
            theme="dark"
            onEmojiClick={e => { setText(p => p + e.emoji); inputRef.current?.focus() }}
            height={350} width={300}
          />
        </div>
      )}

      {/* AI suggestion menu */}
      {showAIMenu && (
        <div className="absolute bottom-20 right-4 w-80 bg-gray-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">AI Suggestions</span>
            </div>
            <button onClick={() => setShowAIMenu(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 space-y-1 max-h-52 overflow-y-auto">
            {aiLoading
              ? [1,2,3].map(i => (
                  <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
                ))
              : aiSuggestions.map((s, i) => (
                  <button key={i} onClick={() => { setText(s); setShowAIMenu(false); inputRef.current?.focus() }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    {s}
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
