import { useState } from 'react'
import { useStore } from '../store'
import Avatar from './Avatar'
import { Reply, Smile, Download, FileText, Image, Music, Film } from 'lucide-react'
import { format } from 'date-fns'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

export default function MessageBubble({ message: msg, isOwn, showAvatar, onReply, replySource }) {
  const { sendReaction } = useStore()
  const [showActions, setShowActions] = useState(false)
  const [showEmojis, setShowEmojis]   = useState(false)

  const time = format(new Date(msg.created_at + (msg.created_at.includes('Z') ? '' : 'Z')), 'HH:mm')

  return (
    <div
      className={`flex items-end gap-2 group msg-enter ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-0.5`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojis(false) }}
    >
      {/* Avatar — only shown on first of a run */}
      <div className="w-8 flex-shrink-0">
        {showAvatar && !isOwn && (
          <Avatar
            user={{ username: msg.sender_name, avatar_color: msg.sender_avatar_color, avatar_url: msg.sender_avatar_url }}
            size="xs"
          />
        )}
      </div>

      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name — only for group chats */}
        {showAvatar && !isOwn && (
          <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender_name}</p>
        )}

        {/* Reply reference */}
        {replySource && (
          <div className={`mb-1 px-2 py-1 rounded-lg border-l-2 border-nexus-500 bg-nexus-500/10 text-xs text-gray-400 max-w-full
            ${isOwn ? 'mr-1' : 'ml-1'}`}>
            <span className="font-medium text-nexus-400">{replySource.sender_name}</span>
            <p className="truncate">{replySource.content}</p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative px-3 py-2 rounded-2xl text-sm
            ${isOwn
              ? 'bg-gradient-to-br from-nexus-600 to-nexus-500 text-white rounded-br-sm'
              : 'bg-gray-800 border border-white/5 text-gray-100 rounded-bl-sm'
            }`}
        >
          {/* Content by type */}
          {msg.msg_type === 'text' || !msg.msg_type
            ? <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            : msg.msg_type === 'image'
            ? <ImageMessage url={msg.file_url} name={msg.file_name} />
            : msg.msg_type === 'audio'
            ? <AudioMessage url={msg.file_url} name={msg.file_name} />
            : msg.msg_type === 'video'
            ? <VideoMessage url={msg.file_url} name={msg.file_name} />
            : <FileMessage url={msg.file_url} name={msg.file_name} size={msg.file_size} />
          }

          {/* Timestamp */}
          <p className={`text-[10px] mt-1 ${isOwn ? 'text-nexus-200' : 'text-gray-500'} text-right`}>
            {time}
            {isOwn && (
              <span className="ml-1">{msg.is_read ? '✓✓' : '✓'}</span>
            )}
          </p>
        </div>

        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {msg.reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => sendReaction(msg.id, r.emoji)}
                className="reaction-btn flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800 border border-white/10 text-xs hover:border-nexus-500/50 transition-colors"
              >
                <span>{r.emoji}</span>
                <span className="text-gray-400">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity
          ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div className="relative">
            <button
              onClick={() => setShowEmojis(p => !p)}
              className="p-1.5 rounded-lg bg-gray-800 border border-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            {showEmojis && (
              <div className={`absolute bottom-full mb-1 flex gap-1 p-1.5 rounded-xl bg-gray-800 border border-white/10 shadow-xl z-50
                ${isOwn ? 'right-0' : 'left-0'}`}>
                {QUICK_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => { sendReaction(msg.id, e); setShowEmojis(false) }}
                    className="text-lg hover:scale-125 transition-transform leading-none"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onReply}
            className="p-1.5 rounded-lg bg-gray-800 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function ImageMessage({ url, name }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} alt={name} className="max-w-full rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
    </a>
  )
}

function AudioMessage({ url, name }) {
  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-2 mb-1">
        <Music className="w-4 h-4 text-nexus-300 flex-shrink-0" />
        <span className="text-xs text-gray-400 truncate">{name}</span>
      </div>
      <audio controls src={url} className="w-full h-8" style={{ filter: 'invert(0.9) hue-rotate(180deg)' }} />
    </div>
  )
}

function VideoMessage({ url, name }) {
  return (
    <div className="max-w-full">
      <video controls src={url} className="max-w-full rounded-xl max-h-48" />
    </div>
  )
}

function FileMessage({ url, name, size }) {
  const fmt = size
    ? size < 1024 ? `${size} B`
    : size < 1024 * 1024 ? `${(size/1024).toFixed(1)} KB`
    : `${(size/1024/1024).toFixed(1)} MB`
    : ''
  return (
    <a href={url} download={name} target="_blank" rel="noreferrer"
      className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors min-w-[180px]">
      <div className="w-9 h-9 rounded-lg bg-nexus-500/20 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-nexus-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-gray-400">{fmt}</p>
      </div>
      <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </a>
  )
}
