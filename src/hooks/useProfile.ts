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

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    console.log('[avatar] url:', supabaseUrl)
    console.log('[avatar] anon key:', anonKey?.slice(0, 20) + '...')
    console.log('[avatar] token:', token?.slice(0, 20) + '...')

    // Test: can user list buckets?
    const bucketsRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': anonKey },
    })
    console.log('[avatar] list buckets:', bucketsRes.status, await bucketsRes.text())

    // Test: can user list files in avatars bucket?
    const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/avatars`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: '', limit: 10 }),
    })
    console.log('[avatar] list files:', listRes.status, await listRes.text())

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    // Use signed upload URL to bypass potential JWT/upload endpoint issues
    const { data: signedData, error: signError } = await supabase.storage
      .from('avatars')
      .createSignedUploadUrl(path, { upsert: true })
    console.log('[avatar] signed url:', signError ? JSON.stringify(signError) : signedData?.signedUrl?.slice(0, 80) + '...')

    if (signError || !signedData) {
      throw new Error(signError?.message || 'Failed to create upload URL')
    }

    // Upload using the signed URL
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .uploadToSignedUrl(path, signedData.token, file, { upsert: true })
    console.log('[avatar] upload result:', uploadError ? JSON.stringify(uploadError) : 'ok')
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

    // List files in user's folder to find current avatar
    const { data: files } = await supabase.storage
      .from('avatars')
      .list(user.id)

    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`)
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
