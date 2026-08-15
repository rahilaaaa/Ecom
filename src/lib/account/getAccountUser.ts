import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import type { User } from '@/payload-types'

export async function getAuthenticatedAccountUser(): Promise<User | null> {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) return null

  try {
    return await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 1,
      user,
      overrideAccess: false,
    })
  } catch {
    return user as User
  }
}
