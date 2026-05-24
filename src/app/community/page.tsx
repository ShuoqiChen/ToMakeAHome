'use client'

import { useState, useEffect } from 'react'

interface Post {
  id: string
  author: string
  content: string
  mood: string
  hearts: number
  createdAt: number
  isSeeded?: boolean
}

const SEEDED_POSTS: Post[] = [
  {
    id: 'seed-1',
    author: 'Luna',
    content: "I finally started that sketchbook I've been putting off for months. The first page is always the hardest, but I drew my morning coffee and it felt like coming home. 🎨",
    mood: '🌸 Creative',
    hearts: 24,
    createdAt: Date.now() - 86400000 * 2,
    isSeeded: true,
  },
  {
    id: 'seed-2',
    author: 'Anonymous',
    content: "Took a walk today and said hello to a neighbor I've been too shy to talk to. Small moment, big feeling. Loneliness is less loud today.",
    mood: '🌿 Growing',
    hearts: 38,
    createdAt: Date.now() - 86400000 * 3,
    isSeeded: true,
  },
  {
    id: 'seed-3',
    author: 'River',
    content: "I've been struggling lately — but I cooked a real meal tonight for the first time in weeks. It smelled like something my grandmother used to make. Healing is strange and beautiful.",
    mood: '🌙 Reflective',
    hearts: 51,
    createdAt: Date.now() - 86400000 * 4,
    isSeeded: true,
  },
  {
    id: 'seed-4',
    author: 'Wren',
    content: "Day 7 of the 30 Days of Kindness challenge — I left a note of encouragement on a stranger's car. Didn't see their reaction, but I felt lighter walking away. ✨",
    mood: '💛 Warm',
    hearts: 19,
    createdAt: Date.now() - 86400000 * 1,
    isSeeded: true,
  },
  {
    id: 'seed-5',
    author: 'Soleil',
    content: "Wrote a poem for the first time since high school. It wasn't good but it was mine. Posted it in the journal here. This app is becoming a little sanctuary.",
    mood: '🌸 Creative',
    hearts: 42,
    createdAt: Date.now() - 86400000 * 5,
    isSeeded: true,
  },
  {
    id: 'seed-6',
    author: 'Anonymous',
    content: "I joined the Local Nature Restoration challenge and spent Saturday morning picking up litter at the park. Eight people showed up. None of us knew each other. Now we have a group chat. 🌿",
    mood: '🌿 Growing',
    hearts: 67,
    createdAt: Date.now() - 86400000 * 6,
    isSeeded: true,
  },
  {
    id: 'seed-7',
    author: 'Marsh',
    content: "My companion Hearth asked me what 'home' feels like today. I didn't know the answer. But I'm thinking about it now, and somehow that feels important.",
    mood: '🌙 Reflective',
    hearts: 33,
    createdAt: Date.now() - 86400000 * 7,
    isSeeded: true,
  },
  {
    id: 'seed-8',
    author: 'Fern',
    content: "Three goals completed this week: called my mom, finished one chapter of my novel, and went to bed before midnight twice. Progress isn't perfect but it's real. 🌱",
    mood: '💛 Warm',
    hearts: 29,
    createdAt: Date.now() - 86400000 * 1.5,
    isSeeded: true,
  },
]

const MOOD_OPTIONS = ['🌸 Creative', '🌿 Growing', '🌙 Reflective', '💛 Warm', '✨ Inspired', '🌧️ Processing']

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [showForm, setShowForm] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [postAuthor, setPostAuthor] = useState('')
  const [postMood, setPostMood] = useState('💛 Warm')
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem('community-posts')
    const storedLikes = localStorage.getItem('community-likes')
    if (stored) {
      setPosts([...SEEDED_POSTS, ...JSON.parse(stored)])
    } else {
      setPosts(SEEDED_POSTS)
    }
    if (storedLikes) setLikedPosts(new Set(JSON.parse(storedLikes)))
  }, [])

  const addPost = () => {
    if (!postContent.trim()) return
    const post: Post = {
      id: Date.now().toString(),
      author: postAuthor.trim() || 'Anonymous',
      content: postContent.trim(),
      mood: postMood,
      hearts: 0,
      createdAt: Date.now(),
    }
    const userPosts = posts.filter((p) => !p.isSeeded)
    const updated = [post, ...userPosts]
    setPosts([...SEEDED_POSTS, ...updated])
    localStorage.setItem('community-posts', JSON.stringify(updated))
    setPostContent('')
    setPostAuthor('')
    setShowForm(false)
  }

  const toggleHeart = (id: string) => {
    const newLikes = new Set(likedPosts)
    const post = posts.find((p) => p.id === id)
    if (!post) return
    let delta = 0
    if (newLikes.has(id)) {
      newLikes.delete(id)
      delta = -1
    } else {
      newLikes.add(id)
      delta = 1
    }
    setLikedPosts(newLikes)
    localStorage.setItem('community-likes', JSON.stringify(Array.from(newLikes)))
    setPosts(posts.map((p) => (p.id === id ? { ...p, hearts: p.hearts + delta } : p)))
  }

  const formatDate = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const sortedPosts = [...posts].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#8B6F5E]">🤝 Community</h1>
          <p className="text-[#8B6F5E]/60 mt-1">Soft moments, shared hearts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#8B6F5E] text-[#FAF7F2] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#7a5f4e] transition-colors shadow-sm"
        >
          + Share a Moment
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="bg-white/70 rounded-2xl border border-[#D4A5A5]/30 p-6 mb-8 shadow-sm">
          <h2 className="font-serif text-lg text-[#8B6F5E] mb-4">Share a soft moment</h2>
          <input
            type="text"
            placeholder="Your name (or leave blank for anonymous)"
            value={postAuthor}
            onChange={(e) => setPostAuthor(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#D4A5A5]/40 rounded-xl px-4 py-2.5 text-sm text-[#8B6F5E] placeholder-[#8B6F5E]/40 focus:outline-none focus:border-[#D4A5A5] mb-3"
          />
          <textarea
            placeholder="What moment do you want to share? A small victory, a feeling, a discovery..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={3}
            className="w-full bg-[#FAF7F2] border border-[#D4A5A5]/40 rounded-xl px-4 py-3 text-sm text-[#8B6F5E] placeholder-[#8B6F5E]/40 focus:outline-none focus:border-[#D4A5A5] resize-none mb-3"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setPostMood(m)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  postMood === m
                    ? 'bg-[#D4A5A5]/30 border-[#D4A5A5] text-[#8B6F5E] font-medium'
                    : 'border-[#D4A5A5]/30 text-[#8B6F5E]/60 hover:border-[#D4A5A5]/60'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={addPost}
              disabled={!postContent.trim()}
              className="bg-[#8B6F5E] text-[#FAF7F2] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#7a5f4e] transition-colors disabled:opacity-40"
            >
              Share 🌸
            </button>
            <button onClick={() => setShowForm(false)} className="text-[#8B6F5E]/60 hover:text-[#8B6F5E] text-sm px-4 py-2.5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Masonry-style grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {sortedPosts.map((post) => (
          <div
            key={post.id}
            className="break-inside-avoid bg-white/60 rounded-2xl border border-[#D4A5A5]/30 p-5 shadow-sm hover:shadow-md transition-all duration-200 inline-block w-full"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#D4A5A5]/30 flex items-center justify-center text-xs font-semibold text-[#8B6F5E]">
                  {post.author[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-[#8B6F5E]">{post.author}</span>
              </div>
              <span className="text-xs text-[#8B6F5E]/40">{formatDate(post.createdAt)}</span>
            </div>
            <p className="text-sm text-[#8B6F5E]/80 leading-relaxed mb-3">{post.content}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs bg-[#D4A5A5]/20 text-[#8B6F5E]/70 px-2 py-1 rounded-full border border-[#D4A5A5]/30">
                {post.mood}
              </span>
              <button
                onClick={() => toggleHeart(post.id)}
                className={`flex items-center gap-1 text-xs transition-all ${
                  likedPosts.has(post.id) ? 'text-red-400' : 'text-[#8B6F5E]/40 hover:text-red-400'
                }`}
              >
                <span>{likedPosts.has(post.id) ? '❤️' : '🤍'}</span>
                <span>{post.hearts}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
