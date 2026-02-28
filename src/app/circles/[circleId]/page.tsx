import CircleOverviewClient from './CircleOverviewClient'

export async function generateStaticParams() {
  return [{ circleId: '_' }]
}

export default function CircleOverviewPage() {
  return <CircleOverviewClient />
}
