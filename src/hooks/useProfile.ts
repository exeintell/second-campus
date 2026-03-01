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

    const blob = new Blob([file], { type: file.type })
    const uid = user.id
    const uidNoHyphens = uid.replace(/-/g, '')
    const shortId = uid.slice(0, 8)
    const ext = file.name.split('.').pop()

    // Test 1: full UUID with hyphens
    const { error: e1 } = await supabase.storage.from('avatars').upload(`t1_${uid}.${ext}`, blob, { upsert: true })
    console.log('[test] full UUID:', e1 ? e1.message : 'ok')

    // Test 2: UUID without hyphens
    const { error: e2 } = await supabase.storage.from('avatars').upload(`t2_${uidNoHyphens}.${ext}`, blob, { upsert: true })
    console.log('[test] no hyphens:', e2 ? e2.message : 'ok')

    // Test 3: short ID (8 chars)
    const { error: e3 } = await supabase.storage.from('avatars').upload(`t3_${shortId}.${ext}`, blob, { upsert: true })
    console.log('[test] short ID:', e3 ? e3.message : 'ok')

    // Test 4: just simple name
    const { error: e4 } = await supabase.storage.from('avatars').upload(`t4_simple.${ext}`, blob, { upsert: true })
    console.log('[test] simple:', e4 ? e4.message : 'ok')

    // Use whichever works
    const path = `t4_simple.${ext}`
    // Placeholder - will fix after test results
    const { error: uploadError } = e4 ? { error: e4 } : { error: null }
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

    // Find avatar files for this user
    const { data: files } = await supabase.storage
      .from('avatars')
      .list('', { search: `avatar_${user.id}` })

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
