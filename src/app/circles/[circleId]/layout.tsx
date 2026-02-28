import CircleLayoutClient from './CircleLayoutClient'

export async function generateStaticParams() {
  return [{ circleId: '_' }]
}

export default function CircleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CircleLayoutClient>{children}</CircleLayoutClient>
}
