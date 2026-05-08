import { useState, useEffect } from 'react'
import { X, Gamepad2, RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import api from '../utils/api'
import toast from 'react-hot-toast'

/* ── Tic Tac Toe ─────────────────────────────────────────────────────────── */
function TicTacToe({ gameId, convId }) {
  const { user } = useStore()
  const [board, setBoard] = useState(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const [winner, setWinner] = useState(null)

  const checkWinner = (b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (const [a,b2,c] of lines) if (b[a] && b[a]===b[b2] && b[a]===b[c]) return b[a]
    return b.every(Boolean) ? 'Draw' : null
  }

  const click = async (i) => {
    if (board[i] || winner) return
    const newBoard = [...board]; newBoard[i] = xIsNext ? 'X' : 'O'
    setBoard(newBoard); setXIsNext(p => !p)
    const w = checkWinner(newBoard)
    if (w) setWinner(w)
    try {
      await api.post(`/games/${gameId}/move`, { move: { index: i, board: newBoard } })
    } catch {}
  }

  const reset = () => { setBoard(Array(9).fill(null)); setXIsNext(true); setWinner(null) }

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${xIsNext ? 'bg-nexus-500/20 text-nexus-300 ring-1 ring-nexus-500' : 'text-gray-500'}`}>X</span>
        <span className="text-gray-600 text-xs">vs</span>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${!xIsNext ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500' : 'text-gray-500'}`}>O</span>
      </div>

      {winner && (
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${winner === 'Draw' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
          {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins! 🎉`}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button key={i} onClick={() => click(i)}
            className={`w-20 h-20 rounded-xl text-3xl font-black transition-all flex items-center justify-center
              ${cell === 'X' ? 'bg-nexus-500/20 text-nexus-300 border border-nexus-500/40'
              : cell === 'O' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
            {cell}
          </button>
        ))}
      </div>

      <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">
        <RotateCcw className="w-4 h-4" /> New Game
      </button>
    </div>
  )
}

/* ── Trivia ──────────────────────────────────────────────────────────────── */
const TRIVIA_QUESTIONS = [
  { q: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol','High Tech Transfer Protocol','Home Tool Transfer Program','HyperText Transition Protocol'], ans: 0 },
  { q: 'Which language runs in a web browser?', options: ['Java','C++','Python','JavaScript'], ans: 3 },
  { q: 'What does CPU stand for?', options: ['Central Processing Unit','Computer Processing Unit','Central Program Utility','Core Processing Unit'], ans: 0 },
  { q: 'Which is the largest planet in our Solar System?', options: ['Saturn','Neptune','Jupiter','Uranus'], ans: 2 },
  { q: 'Who invented the World Wide Web?', options: ['Bill Gates','Tim Berners-Lee','Linus Torvalds','Dennis Ritchie'], ans: 1 },
  { q: 'What does AI stand for?', options: ['Automated Intelligence','Artificial Intelligence','Advanced Integration','Algorithmic Input'], ans: 1 },
  { q: 'In what year was Python created?', options: ['1989','1991','1995','2001'], ans: 1 },
  { q: 'What is the binary representation of 10?', options: ['1010','1000','1100','0110'], ans: 0 },
]

function TriviaGame() {
  const [qi, setQi]       = useState(() => Math.floor(Math.random() * TRIVIA_QUESTIONS.length))
  const [chosen, setChosen] = useState(null)
  const [score, setScore]  = useState(0)
  const [total, setTotal]  = useState(0)

  const q = TRIVIA_QUESTIONS[qi]

  const answer = (i) => {
    if (chosen !== null) return
    setChosen(i); setTotal(p => p+1)
    if (i === q.ans) setScore(p => p+1)
  }

  const next = () => {
    setQi(Math.floor(Math.random() * TRIVIA_QUESTIONS.length))
    setChosen(null)
  }

  return (
    <div className="p-2 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Score</span>
        <span className="text-sm font-bold text-nexus-400">{score}/{total}</span>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-white font-medium text-sm leading-relaxed">{q.q}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => answer(i)}
            className={`px-4 py-3 rounded-xl text-sm text-left font-medium transition-all
              ${chosen === null ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              : i === q.ans   ? 'bg-green-500/20 border border-green-500/40 text-green-300'
              : i === chosen  ? 'bg-red-500/20 border border-red-500/40 text-red-300'
              :                 'bg-white/3 border border-white/5 text-gray-600'}`}>
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center mr-2 inline-flex">
              {['A','B','C','D'][i]}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {chosen !== null && (
        <div className="flex items-center justify-between">
          <p className={`text-sm font-bold ${chosen === q.ans ? 'text-green-400' : 'text-red-400'}`}>
            {chosen === q.ans ? '✓ Correct!' : `✗ Answer: ${q.options[q.ans]}`}
          </p>
          <button onClick={next} className="px-4 py-2 rounded-xl bg-nexus-500/20 border border-nexus-500/30 text-nexus-300 text-sm hover:bg-nexus-500/30 transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Word Guess (Wordle-style) ───────────────────────────────────────────── */
const WORDS = ['REACT','NEXUS','CLOUD','BYTES','DEBUG','PIXEL','SWIFT','CODES','GRAPH','PROXY']

function WordGuess() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  const [target]          = useState(word)
  const [guesses, setGuesses] = useState([])
  const [current, setCurrent] = useState('')
  const [done, setDone]   = useState(false)

  const submit = () => {
    if (current.length !== 5) { toast.error('Word must be 5 letters'); return }
    const g = current.toUpperCase()
    const newGuesses = [...guesses, g]
    setGuesses(newGuesses); setCurrent('')
    if (g === target || newGuesses.length >= 6) setDone(true)
  }

  const colorFor = (guess, i) => {
    if (guess[i] === target[i]) return 'bg-green-500/30 border-green-500/60 text-green-300'
    if (target.includes(guess[i])) return 'bg-yellow-500/30 border-yellow-500/60 text-yellow-300'
    return 'bg-white/5 border-white/10 text-gray-500'
  }

  const won = guesses[guesses.length-1] === target

  return (
    <div className="p-2 space-y-3">
      {/* Grid */}
      <div className="space-y-1.5">
        {Array(6).fill(null).map((_, ri) => {
          const g = guesses[ri]
          return (
            <div key={ri} className="flex gap-1.5 justify-center">
              {Array(5).fill(null).map((_, ci) => (
                <div key={ci}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center text-sm font-bold uppercase transition-colors
                    ${g ? colorFor(g, ci) : ri === guesses.length ? 'bg-white/5 border-nexus-500/30 text-white' : 'bg-white/3 border-white/10 text-gray-600'}`}>
                  {g?.[ci] || (ri === guesses.length ? current[ci] || '' : '')}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {done ? (
        <div className={`text-center py-2 rounded-xl font-bold text-sm ${won ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
          {won ? `🎉 Brilliant!` : `Word was: ${target}`}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={current}
            onChange={e => setCurrent(e.target.value.toUpperCase().slice(0, 5))}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Type 5 letters…"
            className="nexus-input flex-1 rounded-xl px-3 py-2 text-sm uppercase font-mono tracking-widest"
            maxLength={5}
          />
          <button onClick={submit}
            className="px-4 py-2 rounded-xl bg-nexus-500 text-white text-sm font-semibold hover:bg-nexus-600 transition-colors">
            Guess
          </button>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center">
        🟩 Right spot  🟨 Wrong spot  ⬜ Not in word
      </p>
    </div>
  )
}

/* ── GameModal ───────────────────────────────────────────────────────────── */
const GAMES = [
  { id: 'tictactoe', label: 'Tic Tac Toe', emoji: '⭕',  desc: '2-player classic' },
  { id: 'trivia',    label: 'Trivia Quiz',  emoji: '🧠',  desc: 'Test your knowledge' },
  { id: 'wordguess', label: 'Word Guess',   emoji: '📝', desc: 'Wordle-style game' },
]

export default function GameModal({ conv, onClose }) {
  const { user } = useStore()
  const [selected, setSelected] = useState(null)
  const [gameId,   setGameId]   = useState(null)

  const startGame = async (type) => {
    try {
      const res = await api.post('/games/start', { game_type: type, conversation_id: conv.id })
      setGameId(res.data.game_id)
      setSelected(type)
    } catch {
      setSelected(type)
      setGameId('local-' + Date.now())
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            {selected && (
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white mr-1">←</button>
            )}
            <Gamepad2 className="w-5 h-5 text-nexus-400" />
            <h3 className="font-semibold text-white">{selected ? GAMES.find(g=>g.id===selected)?.label : 'Mini Games'}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5">
          {!selected ? (
            <div className="space-y-2">
              {GAMES.map(g => (
                <button key={g.id} onClick={() => startGame(g.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-nexus-500/30 transition-all text-left">
                  <span className="text-3xl">{g.emoji}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{g.label}</p>
                    <p className="text-gray-500 text-xs">{g.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {selected === 'tictactoe' && <TicTacToe gameId={gameId} convId={conv.id} />}
              {selected === 'trivia'    && <TriviaGame />}
              {selected === 'wordguess' && <WordGuess />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
