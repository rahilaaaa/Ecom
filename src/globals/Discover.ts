import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { revalidateDiscover } from './hooks/revalidateDiscover'

export const Discover: GlobalConfig = {
  slug: 'discover',
  label: 'Discover / Search',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'popularSearches',
      type: 'array',
      labels: {
        singular: 'Popular Search',
        plural: 'Popular Searches',
      },
      admin: {
        description: 'Shown as chips under “Popular Right Now”. Leave empty to use defaults.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'query',
          type: 'text',
          admin: {
            description: 'Optional. Defaults to the label when empty.',
          },
        },
      ],
    },
    {
      name: 'newArrivals',
      type: 'group',
      fields: [
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'New Arrivals',
        },
        {
          name: 'description',
          type: 'text',
          defaultValue: 'Explore the latest seasonal pieces.',
        },
        {
          name: 'href',
          type: 'text',
          defaultValue: '/shop?badge=new',
          admin: {
            description: 'Link to the new arrivals listing (e.g. /shop?badge=new).',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateDiscover],
  },
}
