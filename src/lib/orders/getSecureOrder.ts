import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import type { Order, User } from '@/payload-types'

type Args = {
  id: string
  email?: string
  accessToken?: string
}

export type SecureOrderResult = {
  order: Order
  user: User | null
}

/**
 * Load an order only when the requester is authorized.
 * Authenticated customers must own the order. Guests need email + accessToken.
 * Unauthorized / missing orders return null (caller should 404 without leaking existence).
 */
export async function getSecureOrder({
  id,
  email = '',
  accessToken = '',
}: Args): Promise<SecureOrderResult | null> {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user: user || undefined,
      overrideAccess: !Boolean(user),
      depth: 2,
      limit: 1,
      where: {
        and: [
          { id: { equals: id } },
          ...(user
            ? [{ customer: { equals: user.id } }]
            : [
                { accessToken: { equals: accessToken } },
                ...(email ? [{ customerEmail: { equals: email } }] : []),
              ]),
        ],
      },
    })

    if (!orderResult) return null

    const canAccessAsGuest =
      !user &&
      Boolean(email) &&
      Boolean(accessToken) &&
      Boolean(orderResult.customerEmail) &&
      orderResult.customerEmail === email &&
      orderResult.accessToken === accessToken

    const customerID =
      orderResult.customer && typeof orderResult.customer === 'object'
        ? orderResult.customer.id
        : orderResult.customer

    const canAccessAsUser = Boolean(user && customerID === user.id)

    if (!canAccessAsGuest && !canAccessAsUser) {
      return null
    }

    return { order: orderResult, user: (user as User) || null }
  } catch {
    return null
  }
}
