'use client'

import { useState, useEffect } from 'react'

interface Goal {
  id: string
  text: string
  category: string
  completed: boolean
  createdAt: number
  completedAt?: number
}

const CATEGORIES = [
  { id: 'growth', label: 'Personal Growth', emoji: '🌱', color: 'bg-[#8FAF8C]/20 border-[#8FAF8C]/40 text-[#8B6F5E]' },
  { id: 'creativity', label: 'Creativity', emoji: '🎨', color: 'bg-[#D4A5A5]/20 border-[#D4A5A5]/40 text-[#8B6F5E]' },
  { id: 'connection', label: 'Connection', emoji: '🤝', color: 'bg-[#8FAFC4]/20 border-[#8FAFC4]/40 text-[#8B6F5E]' },
  { id: 'purpose', label: 'Purpose', emoji: '✨', color: 'bg-[#C9A96E]/20 border-[#C9A96E]/40 text-[#8B6F5E]' },
]

const ENCOURAGEMENTS = [
  "Every small step is a step toward home. 🏡",
  "You're building something beautiful, one goal at a time. 🌱",
  "Growth isn't always visible, but it's always happening. 🌿",
  "Each completed goal is a reason to celebrate. 🌟",
  "You're doing better than you think. Keep going. 💛",
]

export default function ProgressPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoalText, setNewGoalText] = useState('')
  const [newGoalCategory, setNewGoalCategory] = useState('growth')
  const [streak, setStreak] = useState(0)
  const [encouragement, setEncouragement] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('progress-goals')
    const storedStreak = localStorage.getItem('progress-streak')
    const storedStreakDate = localStorage.getItem('progress-streak-date')
    if (stored) setGoals(JSON.parse(stored))
    if (storedStreak) {
      const today = new Date().toDateString()
      if (storedStreakDate === today || storedStreakDate === new Date(Date.now() - 86400000).toDateString()) {
        setStreak(parseInt(storedStreak))
      }
    }
    setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)])
  }, [])

  const saveGoals = (updated: Goal[]) => {
    setGoals(updated)
    localStorage.setItem('progress-goals', JSON.stringify(updated))
  }

  const addGoal = () => {
    if (!newGoalText.trim()) return
    const goal: Goal = {
      id: Date.now().toString(),
      text: newGoalText.trim(),
      category: newGoalCategory,
      completed: false,
      createdAt: Date.now(),
    }
    saveGoals([goal, ...goals])
    setNewGoalText('')
  }

  const toggleGoal = (id: string) => {
    const updated = goals.map((g) =>
      g.id === id
        ? { ...g, completed: !g.completed, completedAt: !g.completed ? Date.now() : undefined }
        : g
    )
    saveGoals(updated)

    const today = new Date().toDateString()
    const newStreak = streak + 1
    setStreak(newStreak)
    localStorage.setItem('progress-streak', newStreak.toString())
    localStorage.setItem('progress-streak-date', today)
  }

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter((g) => g.id !== id))
  }

  const getCategoryProgress = (categoryId: string) => {
    const catGoals = goals.filter((g) => g.category === categoryId)
    if (catGoals.length === 0) return 0
    return Math.round((catGoals.filter((g) => g.completed).length / catGoals.length) * 100)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[#8B6F5E]">🌱 Progress &amp; Growth</h1>
        <p className="text-[#8B6F5E]/60 mt-1">Track your journey, celebrate every step</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/60 rounded-2xl p-4 border border-[#D4A5A5]/30 text-center">
          <div className="text-3xl font-bold text-[#8B6F5E]">{goals.filter(g => g.completed).length}</div>
          <div className="text-xs text-[#8B6F5E]/60 mt-1">Completed</div>
        </div>
        <div className="bg-white/60 rounded-2xl p-4 border border-[#D4A5A5]/30 text-center">
          <div className="text-3xl font-bold text-[#8FAF8C]">{goals.filter(g => !g.completed).length}</div>
          <div className="text-xs text-[#8B6F5E]/60 mt-1">In Progress</div>
        </div>
        <div className="bg-white/60 rounded-2xl p-4 border border-[#D4A5A5]/30 text-center">
          <div className="text-3xl font-bold text-[#C9A96E]">{streak}</div>
          <div className="text-xs text-[#8B6F5E]/60 mt-1">Day Streak 🔥</div>
        </div>
        <div className="bg-white/60 rounded-2xl p-4 border border-[#D4A5A5]/30 text-center">
          <div className="text-3xl font-bold text-[#D4A5A5]">{goals.length}</div>
          <div className="text-xs text-[#8B6F5E]/60 mt-1">Total Goals</div>
        </div>
      </div>

      {/* Encouragement */}
      <div className="bg-[#8FAF8C]/10 rounded-2xl p-4 border border-[#8FAF8C]/30 mb-8 text-center">
        <p className="font-serif italic text-[#8B6F5E]/80 text-sm">{encouragement}</p>
      </div>

      {/* Category progress */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {CATEGORIES.map((cat) => {
          const progress = getCategoryProgress(cat.id)
          return (
            <div key={cat.id} className={`rounded-2xl p-4 border ${cat.color} bg-opacity-20`}>
              <div className="flex items-center gap-2 mb-2">
                <span>{cat.emoji}</span>
                <span className="text-sm font-medium text-[#8B6F5E]">{cat.label}</span>
                <span className="ml-auto text-xs text-[#8B6F5E]/60">{progress}%</span>
              </div>
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8B6F5E]/40 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Add goal */}
      <div className="bg-white/60 rounded-2xl border border-[#D4A5A5]/30 p-5 mb-8 shadow-sm">
        <h2 className="font-serif text-lg text-[#8B6F5E] mb-3">Add a New Goal</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="What do you want to grow toward?"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            className="flex-1 bg-[#FAF7F2] border border-[#D4A5A5]/40 rounded-xl px-4 py-2.5 text-sm text-[#8B6F5E] placeholder-[#8B6F5E]/40 focus:outline-none focus:border-[#D4A5A5]"
          />
          <button
            onClick={addGoal}
            className="bg-[#8B6F5E] text-[#FAF7F2] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#7a5f4e] transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setNewGoalCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-all ${
                newGoalCategory === cat.id
                  ? cat.color + ' shadow-sm'
                  : 'bg-transparent border-[#D4A5A5]/30 text-[#8B6F5E]/60 hover:border-[#D4A5A5]'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-12 text-[#8B6F5E]/50">
            <div className="text-5xl mb-3">🌱</div>
            <p className="font-serif text-lg mb-1">Start planting seeds</p>
            <p className="text-sm">Add your first goal to begin growing</p>
          </div>
        ) : (
          goals.map((goal) => {
            const cat = CATEGORIES.find((c) => c.id === goal.category) || CATEGORIES[0]
            return (
              <div
                key={goal.id}
                className={`flex items-center gap-3 bg-white/60 rounded-xl border border-[#D4A5A5]/30 p-4 shadow-sm transition-all ${
                  goal.completed ? 'opacity-60' : ''
                }`}
              >
                <button
                  onClick={() => toggleGoal(goal.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    goal.completed
                      ? 'bg-[#8FAF8C] border-[#8FAF8C] text-white'
                      : 'border-[#D4A5A5]/60 hover:border-[#8FAF8C]'
                  }`}
                >
                  {goal.completed && '✓'}
                </button>
                <span className="text-sm mr-1">{cat.emoji}</span>
                <span className={`flex-1 text-sm text-[#8B6F5E] ${goal.completed ? 'line-through opacity-70' : ''}`}>
                  {goal.text}
                </span>
                <span className="text-xs text-[#8B6F5E]/40 hidden md:block">{cat.label}</span>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-xs text-[#8B6F5E]/30 hover:text-red-400 transition-colors ml-2"
                >
                  ✕
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
