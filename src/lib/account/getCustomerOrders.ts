import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Order, User } from '@/payload-types'

type Args = {
  user: User
  limit?: number
}

export async function getCustomerOrders({ user, limit = 5 }: Args): Promise<{
  orders: Order[]
  error: boolean
}> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'orders',
      depth: 2,
      limit,
      pagination: false,
      user,
      overrideAccess: false,
      sort: '-createdAt',
      where: {
        customer: {
          equals: user.id,
        },
      },
    })

    return { orders: result.docs || [], error: false }
  } catch {
    return { orders: [], error: true }
  }
}
