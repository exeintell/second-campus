export interface ChatMessage {
  id: string
  user_id: string
  content: string
  created_at: string
  users: { username: string | null; avatar_url: string | null } | null
}
