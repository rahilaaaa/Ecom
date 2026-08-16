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
      defaultValue: [
        {
          link: {
            type: 'custom',
            label: 'New Arrivals',
            url: '/shop?badge=new',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Women',
            url: '/shop?category=women',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Men',
            url: '/shop?category=men',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Collections',
            url: '/shop',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Sale',
            url: '/shop?sale=true',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
