import Link from 'next/link'

const features = [
  {
    icon: '🌿',
    title: 'AI Companion',
    desc: 'Grow alongside Hearth, your gentle AI companion who listens, remembers, and grows with you.',
    href: '/companion',
    color: 'bg-[#8FAF8C]/20 border-[#8FAF8C]/40',
  },
  {
    icon: '📖',
    title: 'Stories & Journal',
    desc: 'Write freely. Capture moods, stories, and reflections that become a record of your inner world.',
    href: '/journal',
    color: 'bg-[#D4A5A5]/20 border-[#D4A5A5]/40',
  },
  {
    icon: '🌱',
    title: 'Growth Tracker',
    desc: 'Set meaningful goals across creativity, connection, and purpose. Watch yourself bloom.',
    href: '/progress',
    color: 'bg-[#8FAFC4]/20 border-[#8FAFC4]/40',
  },
  {
    icon: '🤝',
    title: 'Community',
    desc: 'Share soft moments with others on the same journey. You are not alone in this.',
    href: '/community',
    color: 'bg-[#C9A96E]/20 border-[#C9A96E]/40',
  },
  {
    icon: '✨',
    title: 'Challenges',
    desc: 'Join real-world challenges that connect you to something larger — kindness, nature, community.',
    href: '/challenges',
    color: 'bg-[#8B6F5E]/10 border-[#8B6F5E]/30',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] via-[#D4A5A5]/10 to-[#8FAF8C]/15 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-block bg-[#D4A5A5]/20 text-[#8B6F5E] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            🌸 A softer way to move forward
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#8B6F5E] leading-tight mb-6">
            Make a Home in Your<br />
            <span className="text-[#D4A5A5]">Everyday Life</span>
          </h1>
          <p className="text-lg text-[#8B6F5E]/70 max-w-xl mx-auto mb-10 leading-relaxed">
            A companion that grows with you. Stories that carry you forward.<br />
            <em>A place to belong.</em>
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/companion"
              className="bg-[#8B6F5E] text-[#FAF7F2] px-8 py-3 rounded-full font-medium hover:bg-[#7a5f4e] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Meet Hearth 🌿
            </Link>
            <Link
              href="/journal"
              className="bg-[#FAF7F2] text-[#8B6F5E] border border-[#D4A5A5] px-8 py-3 rounded-full font-medium hover:bg-[#D4A5A5]/20 transition-all duration-200"
            >
              Start Writing 📖
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="font-serif text-3xl text-[#8B6F5E] text-center mb-12">
          Everything you need to feel at home
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group p-6 rounded-2xl border ${f.color} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-serif text-lg font-semibold text-[#8B6F5E] mb-2">{f.title}</h3>
              <p className="text-sm text-[#8B6F5E]/70 leading-relaxed">{f.desc}</p>
              <div className="mt-4 text-xs text-[#8B6F5E]/50 group-hover:text-[#8B6F5E] transition-colors">
                Explore →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer quote */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-lg mx-auto bg-[#8FAF8C]/10 rounded-3xl p-10 border border-[#8FAF8C]/30">
          <p className="font-serif text-xl text-[#8B6F5E] italic leading-relaxed">
            &ldquo;Home is not a place — it&apos;s the feeling of being known, growing, and belonging.&rdquo;
          </p>
          <p className="text-sm text-[#8B6F5E]/50 mt-4">— ToMakeAHome</p>
        </div>
      </section>
    </div>
  )
}
