'use client'

import { useState, useEffect } from 'react'

interface Challenge {
  id: string
  title: string
  description: string
  duration: string
  participants: number
  category: string
  emoji: string
  color: string
}

interface UserChallenge {
  challengeId: string
  joinedAt: number
  progress: number
  notes: string[]
}

const CHALLENGES: Challenge[] = [
  {
    id: 'kindness-30',
    title: '30 Days of Kindness',
    description: 'One intentional act of kindness per day for 30 days. Leave notes, hold doors, listen deeply. Watch the world soften.',
    duration: '30 days',
    participants: 1247,
    category: 'Connection',
    emoji: '💛',
    color: 'bg-[#C9A96E]/15 border-[#C9A96E]/40',
  },
  {
    id: 'nature-restore',
    title: 'Local Nature Restoration',
    description: 'Spend 2 hours per week on local restoration: park cleanups, planting, or simply documenting nature in your area.',
    duration: '8 weeks',
    participants: 834,
    category: 'Purpose',
    emoji: '🌿',
    color: 'bg-[#8FAF8C]/15 border-[#8FAF8C]/40',
  },
  {
    id: 'story-archive',
    title: 'Community Story Archive',
    description: 'Interview an elder or neighbor and capture their story in writing. Preserve a piece of living history.',
    duration: 'Ongoing',
    participants: 392,
    category: 'Creativity',
    emoji: '📚',
    color: 'bg-[#8FAFC4]/15 border-[#8FAFC4]/40',
  },
  {
    id: 'offline-week',
    title: 'One Week Analog',
    description: 'For one week, replace evening screen time with analog activities: drawing, reading, cooking, walking, talking.',
    duration: '7 days',
    participants: 2103,
    category: 'Growth',
    emoji: '🕯️',
    color: 'bg-[#D4A5A5]/15 border-[#D4A5A5]/40',
  },
  {
    id: 'letters',
    title: 'Letters to Strangers',
    description: "Write one letter of encouragement per week to someone you don't know well — a neighbor, a colleague, a stranger online.",
    duration: '4 weeks',
    participants: 678,
    category: 'Connection',
    emoji: '✉️',
    color: 'bg-[#C9A96E]/15 border-[#C9A96E]/40',
  },
  {
    id: 'create-daily',
    title: 'Create Something Daily',
    description: "Make something every day for 21 days: a drawing, a poem, a recipe, a photo, a song — anything that didn't exist before.",
    duration: '21 days',
    participants: 1561,
    category: 'Creativity',
    emoji: '🎨',
    color: 'bg-[#D4A5A5]/15 border-[#D4A5A5]/40',
  },
]

export default function ChallengesPage() {
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState<Record<string, string>>({})

  useEffect(() => {
    const stored = localStorage.getItem('user-challenges')
    if (stored) setUserChallenges(JSON.parse(stored))
  }, [])

  const save = (updated: UserChallenge[]) => {
    setUserChallenges(updated)
    localStorage.setItem('user-challenges', JSON.stringify(updated))
  }

  const getUserChallenge = (id: string) => userChallenges.find((uc) => uc.challengeId === id)

  const joinChallenge = (id: string) => {
    if (getUserChallenge(id)) return
    save([...userChallenges, { challengeId: id, joinedAt: Date.now(), progress: 0, notes: [] }])
  }

  const leaveChallenge = (id: string) => {
    save(userChallenges.filter((uc) => uc.challengeId !== id))
  }

  const updateProgress = (id: string, delta: number) => {
    save(
      userChallenges.map((uc) =>
        uc.challengeId === id
          ? { ...uc, progress: Math.min(100, Math.max(0, uc.progress + delta)) }
          : uc
      )
    )
  }

  const addNote = (id: string) => {
    const note = noteInput[id]?.trim()
    if (!note) return
    save(
      userChallenges.map((uc) =>
        uc.challengeId === id ? { ...uc, notes: [...uc.notes, note] } : uc
      )
    )
    setNoteInput({ ...noteInput, [id]: '' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[#8B6F5E]">✨ Challenges</h1>
        <p className="text-[#8B6F5E]/60 mt-1">Real-world actions that connect you to something larger</p>
      </div>

      {userChallenges.length > 0 && (
        <div className="bg-[#8FAF8C]/10 rounded-2xl p-4 border border-[#8FAF8C]/30 mb-8">
          <p className="text-sm text-[#8B6F5E] font-medium">
            🌱 You&apos;re on {userChallenges.length} challenge{userChallenges.length > 1 ? 's' : ''}. Keep going — you&apos;re making a difference.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {CHALLENGES.map((challenge) => {
          const uc = getUserChallenge(challenge.id)
          const isJoined = !!uc
          const isExpanded = expandedId === challenge.id

          return (
            <div
              key={challenge.id}
              className={`rounded-2xl border ${challenge.color} overflow-hidden transition-all duration-200`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0">{challenge.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-serif text-lg font-semibold text-[#8B6F5E]">{challenge.title}</h2>
                      <span className="text-xs bg-white/60 text-[#8B6F5E]/60 px-2 py-0.5 rounded-full border border-[#8B6F5E]/10">
                        {challenge.category}
                      </span>
                      {isJoined && (
                        <span className="text-xs bg-[#8FAF8C]/30 text-[#8B6F5E] px-2 py-0.5 rounded-full border border-[#8FAF8C]/40 font-medium">
                          ✓ Joined
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#8B6F5E]/70 leading-relaxed mb-3">{challenge.description}</p>
                    <div className="flex items-center gap-4 text-xs text-[#8B6F5E]/50">
                      <span>⏱ {challenge.duration}</span>
                      <span>👥 {challenge.participants.toLocaleString()} participants</span>
                    </div>
                  </div>
                </div>

                {isJoined && uc && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[#8B6F5E]/70 mb-1">
                      <span>Your progress</span>
                      <span>{uc.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/50 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-[#8B6F5E]/40 rounded-full transition-all duration-500"
                        style={{ width: `${uc.progress}%` }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateProgress(challenge.id, 10)}
                        className="text-xs bg-white/60 text-[#8B6F5E] px-3 py-1.5 rounded-full border border-[#8B6F5E]/20 hover:bg-[#8FAF8C]/20 transition-colors"
                      >
                        +10% Progress
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
                        className="text-xs bg-white/60 text-[#8B6F5E] px-3 py-1.5 rounded-full border border-[#8B6F5E]/20 hover:bg-[#D4A5A5]/20 transition-colors"
                      >
                        {isExpanded ? 'Hide Notes' : 'Add Note'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {!isJoined ? (
                    <button
                      onClick={() => joinChallenge(challenge.id)}
                      className="bg-[#8B6F5E] text-[#FAF7F2] px-5 py-2 rounded-full text-sm font-medium hover:bg-[#7a5f4e] transition-colors shadow-sm"
                    >
                      Join Challenge ✨
                    </button>
                  ) : (
                    <button
                      onClick={() => leaveChallenge(challenge.id)}
                      className="text-xs text-[#8B6F5E]/40 hover:text-[#8B6F5E]/70 transition-colors px-2 py-1"
                    >
                      Leave challenge
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && isJoined && uc && (
                <div className="border-t border-white/40 p-5 bg-white/30">
                  <h3 className="text-sm font-medium text-[#8B6F5E] mb-3">Your notes &amp; reflections</h3>
                  {uc.notes.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {uc.notes.map((note, i) => (
                        <div key={i} className="bg-white/60 rounded-xl px-3 py-2 text-sm text-[#8B6F5E]/80 border border-[#D4A5A5]/20">
                          {note}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Reflect on today's action..."
                      value={noteInput[challenge.id] || ''}
                      onChange={(e) => setNoteInput({ ...noteInput, [challenge.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addNote(challenge.id)}
                      className="flex-1 bg-white/60 border border-[#D4A5A5]/40 rounded-xl px-3 py-2 text-sm text-[#8B6F5E] placeholder-[#8B6F5E]/40 focus:outline-none focus:border-[#D4A5A5]"
                    />
                    <button
                      onClick={() => addNote(challenge.id)}
                      className="bg-[#8B6F5E] text-[#FAF7F2] px-4 py-2 rounded-xl text-sm hover:bg-[#7a5f4e] transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
