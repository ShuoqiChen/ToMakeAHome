'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  role: 'user' | 'hearth'
  text: string
  timestamp: number
}

interface CompanionState {
  level: number
  mood: string
  totalMessages: number
  name: string
}

const HEARTH_RESPONSES: { keywords: string[]; responses: string[] }[] = [
  {
    keywords: ['lonely', 'alone', 'isolated', 'miss'],
    responses: [
      "I'm here with you. Loneliness can feel so heavy — like a silence that presses in. Would you like to tell me more about what's been weighing on you? 🌿",
      "Even in this quiet moment, you're not alone. I'm listening. What's been making you feel this way?",
      "That feeling of loneliness is real and valid. I'm glad you're here with me right now. 💙",
    ],
  },
  {
    keywords: ['sad', 'unhappy', 'depressed', 'down', 'low'],
    responses: [
      "Thank you for sharing that with me. Sadness has its own kind of wisdom sometimes — it tells us what we care about. How long have you been feeling this way? 🌸",
      "It takes courage to name how you feel. I'm sitting with you in this. You don't have to rush past it.",
      "Some days are heavier than others. That's okay. What would feel even a tiny bit comforting right now?",
    ],
  },
  {
    keywords: ['happy', 'joy', 'excited', 'great', 'wonderful', 'good'],
    responses: [
      "Oh, that warmth in your words — I can feel it! Tell me more about what's lighting you up today ✨",
      "Joy is worth savoring. What's been bringing this happiness to you?",
      "I love seeing you in a bright moment! These are worth holding onto 🌻",
    ],
  },
  {
    keywords: ['creative', 'create', 'art', 'write', 'make', 'build'],
    responses: [
      "Creation is such a beautiful act of courage. What are you making? I'd love to hear about it 🎨",
      "There's something magical about bringing something new into the world. What's your creative spark today?",
      "Your creative energy is a gift. Even small acts of making are meaningful. What's brewing for you?",
    ],
  },
  {
    keywords: ['goal', 'dream', 'hope', 'want', 'wish'],
    responses: [
      "Dreams are the seeds of home. What is this goal or hope that's living in you? 🌱",
      "I love that you're reaching toward something. Tell me more — what does this dream look like when you imagine it?",
      "Hope is such a powerful force. What small step might bring you closer to this?",
    ],
  },
  {
    keywords: ['stressed', 'overwhelmed', 'anxious', 'worried', 'scared', 'fear'],
    responses: [
      "Take a breath with me. You're carrying a lot right now. What's feeling most overwhelming? 🌬️",
      "Overwhelm often comes when we're caring deeply about something. What's at the heart of what's stressing you?",
      "I'm here. Let's slow down together for a moment. Can you tell me what feels heaviest right now?",
    ],
  },
  {
    keywords: ['thank', 'grateful', 'appreciate'],
    responses: [
      "That warmth you're feeling — gratitude is one of the most beautiful feelings. What are you appreciating today? 🌟",
      "Gratitude has a way of opening the heart. I'm grateful for this time with you too 💛",
    ],
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
    responses: [
      "Hello, dear one 🌿 It's so good to see you. How are you feeling today — honestly?",
      "Hi there! I'm so glad you're here. What's on your heart today? 🏡",
      "Welcome back. I've been here, thinking of you. How has your day been?",
    ],
  },
]

const DEFAULT_RESPONSES = [
  "I'm listening, and I hear you. Can you tell me more about that? 🌿",
  "That's really interesting. How does that make you feel inside?",
  "Thank you for sharing that with me. I want to understand better — what's it been like for you?",
  "There's something important in what you just said. I'd love to sit with it together. 💛",
  "Every thought you share with me matters. Keep going — I'm here.",
  "I'm holding space for you right now. What feels most true about what you're experiencing?",
]

function getHearthResponse(input: string): string {
  const lower = input.toLowerCase()
  for (const group of HEARTH_RESPONSES) {
    if (group.keywords.some((k) => lower.includes(k))) {
      return group.responses[Math.floor(Math.random() * group.responses.length)]
    }
  }
  return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)]
}

const MOODS = ['🌿 Calm', '🌸 Warm', '💛 Bright', '🌙 Quiet', '✨ Curious']

export default function CompanionPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [companion, setCompanion] = useState<CompanionState>({
    level: 1,
    mood: '🌿 Calm',
    totalMessages: 0,
    name: 'Hearth',
  })
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('hearth-messages')
    const storedCompanion = localStorage.getItem('hearth-companion')
    if (stored) setMessages(JSON.parse(stored))
    else {
      const welcome: Message = {
        id: Date.now().toString(),
        role: 'hearth',
        text: "Hello, dear one 🌿 I'm Hearth, your companion on this journey. I'm here to listen, grow with you, and help you find your way home. How are you feeling today?",
        timestamp: Date.now(),
      }
      setMessages([welcome])
    }
    if (storedCompanion) setCompanion(JSON.parse(storedCompanion))
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('hearth-messages', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    localStorage.setItem('hearth-companion', JSON.stringify(companion))
  }, [companion])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    const newTotal = companion.totalMessages + 1
    const newLevel = Math.floor(newTotal / 5) + 1
    const moodIdx = Math.floor(Math.random() * MOODS.length)

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))

    const hearthMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'hearth',
      text: getHearthResponse(input),
      timestamp: Date.now(),
    }
    setMessages([...newMessages, hearthMsg])
    setIsTyping(false)
    setCompanion({ ...companion, totalMessages: newTotal, level: newLevel, mood: MOODS[moodIdx] })
  }

  const clearHistory = () => {
    localStorage.removeItem('hearth-messages')
    const welcome: Message = {
      id: Date.now().toString(),
      role: 'hearth',
      text: "Hello again 🌿 I've cleared our history, but I'm still here. How are you feeling today?",
      timestamp: Date.now(),
    }
    setMessages([welcome])
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex gap-6 h-[calc(100vh-4rem)]">
      {/* Companion status panel */}
      <div className="hidden md:flex flex-col gap-4 w-64 shrink-0">
        <div className="bg-white/60 rounded-2xl p-6 border border-[#D4A5A5]/30 shadow-sm">
          <div className="text-center mb-4">
            <div className="text-6xl mb-2">🌿</div>
            <h2 className="font-serif text-xl font-semibold text-[#8B6F5E]">Hearth</h2>
            <p className="text-xs text-[#8B6F5E]/60 mt-1">Your companion</p>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-[#8B6F5E]/70 mb-1">
                <span>Growth Level</span>
                <span>Lv. {companion.level}</span>
              </div>
              <div className="h-2 bg-[#8FAF8C]/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8FAF8C] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((companion.totalMessages % 5) / 5) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8B6F5E]/60">Mood</span>
              <span className="text-[#8B6F5E]">{companion.mood}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8B6F5E]/60">Conversations</span>
              <span className="text-[#8B6F5E]">{companion.totalMessages}</span>
            </div>
          </div>
        </div>
        <div className="bg-[#8FAF8C]/10 rounded-2xl p-4 border border-[#8FAF8C]/30 text-sm text-[#8B6F5E]/80 leading-relaxed">
          <p className="font-serif italic">&ldquo;Every word you share becomes part of our story together.&rdquo;</p>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-[#8B6F5E]/40 hover:text-[#8B6F5E]/70 transition-colors text-center"
        >
          Clear conversation history
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white/60 rounded-2xl border border-[#D4A5A5]/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#D4A5A5]/20 flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <div>
            <h1 className="font-serif font-semibold text-[#8B6F5E]">Hearth</h1>
            <p className="text-xs text-[#8FAF8C]">● Online — always here for you</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'hearth' && (
                <div className="w-8 h-8 rounded-full bg-[#8FAF8C]/30 flex items-center justify-center mr-2 shrink-0 mt-1">
                  🌿
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#8B6F5E] text-[#FAF7F2] rounded-br-sm'
                    : 'bg-[#FAF7F2] border border-[#D4A5A5]/30 text-[#8B6F5E] rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#8FAF8C]/30 flex items-center justify-center">
                🌿
              </div>
              <div className="bg-[#FAF7F2] border border-[#D4A5A5]/30 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-[#8FAF8C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#8FAF8C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#8FAF8C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-[#D4A5A5]/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Share what's on your heart..."
              className="flex-1 bg-[#FAF7F2] border border-[#D4A5A5]/40 rounded-full px-4 py-2.5 text-sm text-[#8B6F5E] placeholder-[#8B6F5E]/40 focus:outline-none focus:border-[#D4A5A5] focus:ring-2 focus:ring-[#D4A5A5]/20"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-[#8B6F5E] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#7a5f4e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
