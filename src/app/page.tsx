import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-accent-600 dark:text-accent-400">
            SECOCAM
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
            サークル管理プラットフォーム。チャット、DM、日程調整をワンプラットフォームで。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
            <Link
              href="/register"
              className="px-8 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-xl transition-colors text-center"
            >
              無料で始める
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-surface-300 dark:border-surface-700 text-neutral-700 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-surface-900 font-semibold rounded-xl transition-colors text-center"
            >
              ログイン
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface-50 dark:bg-surface-950 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-neutral-900 dark:text-neutral-100">
            主な機能
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="💬"
              title="チャンネルチャット"
              description="複数のトピックをチャンネルで管理。リアルタイムでメンバーと会話できます。"
              accent="accent"
            />
            <FeatureCard
              icon="💌"
              title="ダイレクトメッセージ"
              description="メンバー同士でプライベートなメッセージを送受信。"
              accent="cyan"
            />
            <FeatureCard
              icon="📅"
              title="日程調整"
              description="イベント企画と出欠確認を効率的に。最適な日時を見つけるのが簡単に。"
              accent="accent"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            今すぐ始めましょう
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            SECOCAM でサークル活動をもっと楽しく、もっと効率的に。
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-xl transition-colors"
          >
            アカウントを作成
          </Link>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description, accent }: {
  icon: string
  title: string
  description: string
  accent: 'accent' | 'cyan'
}) {
  const borderHover = accent === 'accent'
    ? 'hover:border-accent-500'
    : 'hover:border-cyan-500'

  return (
    <div className={`p-6 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 ${borderHover} transition-colors`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
    </div>
  )
}
