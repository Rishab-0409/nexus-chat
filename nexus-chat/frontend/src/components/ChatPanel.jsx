import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import AISummaryModal from './AISummaryModal'

export default function ChatPanel() {
  const {
    activeConvId, conversations, messages, typingUsers,
    user, showAISummarize
  } = useStore()

  const conv         = conversations.find(c => c.id === activeConvId)
  const convMessages = messages[activeConvId] || []
  const typing       = typingUsers[activeConvId] || {}
  const typingNames  = Object.values(typing)

  const bottomRef = useRef(null)
  const [replyTo, setReplyTo]   = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convMessages.length])

  // Group messages by date
  const grouped = groupByDate(convMessages)

  if (!conv) return null

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conv={conv} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {convMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-5xl mb-4">👋</span>
            <p className="text-gray-400 font-medium">Start the conversation!</p>
            <p className="text-gray-600 text-sm mt-1">Say hello to get things going.</p>
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs text-gray-600 px-2 py-1 rounded-full bg-white/3 border border-white/5">{date}</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {msgs.map((msg, i) => {
              const prev = msgs[i - 1]
              const showAvatar = !prev || prev.sender_id !== msg.sender_id
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user?.id}
                  showAvatar={showAvatar}
                  onReply={() => setReplyTo(msg)}
                  replySource={convMessages.find(m => m.id === msg.reply_to)}
                />
              )
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {typingNames.length > 0 && (
          <div className="flex items-end gap-2 animate-fade-in mt-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">
              {typingNames[0]?.[0]?.toUpperCase()}
            </div>
            <div className="bg-gray-800 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="text-xs text-gray-500 mr-2">
                {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing
              </span>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="mx-4 mb-1 px-3 py-2 rounded-lg bg-nexus-500/10 border-l-2 border-nexus-500 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-nexus-400">{replyTo.sender_name}</p>
            <p className="text-xs text-gray-400 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white ml-2 text-lg leading-none">×</button>
        </div>
      )}

      <MessageInput replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />

      {showAISummarize && <AISummaryModal />}
    </div>
  )
}

function groupByDate(messages) {
  const groups = {}
  for (const msg of messages) {
    const d = new Date(msg.created_at + (msg.created_at.includes('Z') ? '' : 'Z'))
    const label = isToday(d) ? 'Today'
      : isYesterday(d) ? 'Yesterday'
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups[label]) groups[label] = { date: label, msgs: [] }
    groups[label].msgs.push(msg)
  }
  return Object.values(groups)
}
function isToday(d)     { const n = new Date(); return d.toDateString() === n.toDateString() }
function isYesterday(d) { const y = new Date(); y.setDate(y.getDate()-1); return d.toDateString() === y.toDateString() }
