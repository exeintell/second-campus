export async function generateStaticParams() {
  return [{ channelId: '_' }]
}

export default function ChannelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
