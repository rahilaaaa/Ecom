import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Redefining modern minimalism through emotional design and uncompromising quality.',
    },
    {
      name: 'customerCare',
      type: 'array',
      labels: {
        singular: 'Customer Care Link',
        plural: 'Customer Care',
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
    {
      name: 'legal',
      type: 'array',
      labels: {
        singular: 'Legal Link',
        plural: 'Legal',
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
    {
      name: 'navItems',
      type: 'array',
      admin: {
        description: 'Legacy flat link list. Used as fallback when Customer Care / Legal are empty.',
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 8,
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
