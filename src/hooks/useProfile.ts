'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    if (data) {
      setUsername(data.username)
      setAvatarUrl(data.avatar_url)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateUsername = async (name: string) => {
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('users')
      .update({ username: name })
      .eq('id', user.id)
    if (error) throw error
    setUsername(name)
  }

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('Not authenticated')

    const ext = file.name.split('.').pop()
    // Use UUID without hyphens to avoid Supabase Storage issue with hyphens in filenames
    const safeId = user.id.replace(/-/g, '')
    const path = `avatar_${safeId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)
    if (updateError) throw updateError

    setAvatarUrl(publicUrl)
  }

  const removeAvatar = async () => {
    if (!user) throw new Error('Not authenticated')

    const safeId = user.id.replace(/-/g, '')
    const { data: files } = await supabase.storage
      .from('avatars')
      .list('', { search: `avatar_${safeId}` })

    if (files && files.length > 0) {
      const paths = files.map((f) => f.name)
      await supabase.storage.from('avatars').remove(paths)
    }

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', user.id)
    if (error) throw error

    setAvatarUrl(null)
  }

  return { username, avatarUrl, loading, updateUsername, uploadAvatar, removeAvatar, refetch: fetchProfile }
}
