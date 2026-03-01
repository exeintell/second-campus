export interface ChatMessage {
  id: string
  user_id: string
  content: string
  created_at: string | null
  users: { username: string | null; avatar_url: string | null } | null
}
