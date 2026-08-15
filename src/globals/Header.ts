import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'announcement',
      type: 'text',
      admin: {
        description: 'Optional top announcement bar. Leave empty to hide.',
      },
      defaultValue: 'FREE SHIPPING ON ORDERS OVER $150',
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 8,
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
