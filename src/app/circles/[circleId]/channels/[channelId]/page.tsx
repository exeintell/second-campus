import ChannelPageClient from './ChannelPageClient'

export async function generateStaticParams() {
  return [{ channelId: '_' }]
}

export default function ChannelPage() {
  return <ChannelPageClient />
}
