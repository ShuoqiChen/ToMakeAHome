'use client'

import { useState, useEffect } from 'react'

interface JournalEntry {
  id: string
  title: string
  content: string
  mood: string
  tags: string[]
  createdAt: number
}

const MOODS = [
  { label: 'Happy', emoji: '😊', color: 'bg-[#C9A96E]/20 text-[#8B6F5E] border-[#C9A96E]/40' },
  { label: 'Reflective', emoji: '🌙', color: 'bg-[#8FAFC4]/20 text-[#8B6F5E] border-[#8FAFC4]/40' },
  { label: 'Creative', emoji: '🎨', color: 'bg-[#D4A5A5]/20 text-[#8B6F5E] border-[#D4A5A5]/40' },
  { label: 'Struggling', emoji: '🌧️', color: 'bg-[#8B6F5E]/10 text-[#8B6F5E] border-[#8B6F5E]/20' },
  { label: 'Growing', emoji: '🌱', color: 'bg-[#8FAF8C]/20 text-[#8B6F5E] border-[#8FAF8C]/40' },
]

const getMoodStyle = (moodLabel: string) =>
  MOODS.find((m) => m.label === moodLabel) || MOODS[0]

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedMood, setSelectedMood] = useState('Happy')
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('journal-entries')
    if (stored) setEntries(JSON.parse(stored))
  }, [])

  const saveEntry = () => {
    if (!title.trim() || !content.trim()) return
    const entry: JournalEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      mood: selectedMood,
      tags: [],
      createdAt: Date.now(),
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    localStorage.setItem('journal-entries', JSON.stringify(updated))
    setTitle('')
    setContent('')
    setSelectedMood('Happy')
    setShowForm(false)
  }

  const deleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id)
    setEntries(updated)
    localStorage.setItem('journal-entries', JSON.stringify(updated))
    if (viewEntry?.id === id) setViewEntry(null)
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#8B6F5E]">📖 Journal</h1>
          <p className="text-[#8B6F5E]/60 mt-1">Your stories, your growth, your world</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#8B6F5E] text-[#FAF7F2] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#7a5f4e] transition-colors shadow-sm"
        >
          + New Entry
        </button>
      </div>

      {/* New entry form */}
      {showForm && (
        <div className="bg-white/70 rounded-2xl border border-[#D4A5A5]/30 p-6 mb-8 shadow-sm">
          <h2 className="font-serif text-xl text-[#8B6F5E] mb-4">New Journal Entry</h2>
          <input
            type="text"
            placeholder="Give your entry a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#D4A5A5]/40 rounded-xl px-4 py-2.5 text-sm text-[#8B6F5E] placeholder-[#8B6F5E]/40 focus:outline-none focus:border-[#D4A5A5] mb-3"
          />
          <textarea
            placeholder="Write freely... What's on your mind? What story do you want to tell?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full bg-[#FAF7F2] border border-[#D4A5A5]/40 rounded-xl px-4 py-3 text-sm text-[#8B6F5E] placeholder-[#8B6F5E]/40 focus:outline-none focus:border-[#D4A5A5] resize-none mb-4"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-[#8B6F5E]/70 mr-1 self-center">Mood:</span>
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => setSelectedMood(m.label)}
                className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-all ${
                  selectedMood === m.label
                    ? m.color + ' shadow-sm scale-105'
                    : 'bg-transparent border-[#D4A5A5]/30 text-[#8B6F5E]/60 hover:border-[#D4A5A5]/60'
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveEntry}
              disabled={!title.trim() || !content.trim()}
              className="bg-[#8B6F5E] text-[#FAF7F2] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#7a5f4e] transition-colors disabled:opacity-40"
            >
              Save Entry ✨
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-[#8B6F5E]/60 hover:text-[#8B6F5E] text-sm transition-colors px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View entry modal */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-2xl max-w-xl w-full p-8 shadow-xl border border-[#D4A5A5]/30 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full border ${getMoodStyle(viewEntry.mood).color}`}>
                  {getMoodStyle(viewEntry.mood).emoji} {viewEntry.mood}
                </span>
                <p className="text-xs text-[#8B6F5E]/50 mt-1">{formatDate(viewEntry.createdAt)}</p>
              </div>
              <button
                onClick={() => setViewEntry(null)}
                className="text-[#8B6F5E]/40 hover:text-[#8B6F5E] text-lg"
              >
                ✕
              </button>
            </div>
            <h2 className="font-serif text-2xl text-[#8B6F5E] mb-4">{viewEntry.title}</h2>
            <p className="text-[#8B6F5E]/80 leading-relaxed whitespace-pre-wrap">{viewEntry.content}</p>
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="text-center py-20 text-[#8B6F5E]/50">
          <div className="text-6xl mb-4">📖</div>
          <p className="font-serif text-xl mb-2">Your journal awaits</p>
          <p className="text-sm">Write your first entry to begin your story</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {entries.map((entry) => {
            const moodStyle = getMoodStyle(entry.mood)
            return (
              <div
                key={entry.id}
                className="bg-white/60 rounded-2xl border border-[#D4A5A5]/30 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                onClick={() => setViewEntry(entry)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${moodStyle.color}`}>
                    {moodStyle.emoji} {entry.mood}
                  </span>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-xs text-[#8B6F5E]/30 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#8B6F5E] mb-2">{entry.title}</h3>
                <p className="text-sm text-[#8B6F5E]/70 line-clamp-3 leading-relaxed">{entry.content}</p>
                <p className="text-xs text-[#8B6F5E]/40 mt-3">{formatDate(entry.createdAt)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
