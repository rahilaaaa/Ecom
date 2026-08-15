import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { revalidateHomepage } from './hooks/revalidateHomepage'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
  },
  fields: [
    {
      type: 'group',
      name: 'hero',
      label: 'Hero',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'THE NEW STANDARD',
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
          defaultValue: 'Spring Collection 2024',
        },
        {
          name: 'ctaLabel',
          type: 'text',
          defaultValue: 'SHOP NOW',
        },
        {
          name: 'ctaUrl',
          type: 'text',
          defaultValue: '/shop',
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      type: 'group',
      name: 'curated',
      label: 'Curated For You',
      fields: [
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'Curated For You',
        },
      ],
    },
    {
      type: 'group',
      name: 'bestSellers',
      label: 'Best Sellers',
      fields: [
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'Best Sellers',
        },
        {
          name: 'viewAllLabel',
          type: 'text',
          defaultValue: 'View All Products',
        },
        {
          name: 'limit',
          type: 'number',
          defaultValue: 4,
          min: 1,
          max: 12,
          admin: {
            description:
              'Shows products marked Featured in the Products collection. Falls back to newest published products if none are featured.',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'testimonial',
      label: 'Editorial Quote',
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          defaultValue:
            'Elixir has completely redefined my wardrobe. The attention to detail and the quality of the fabrics are simply unmatched in today\'s market. It is quiet luxury at its finest.',
        },
        {
          name: 'attribution',
          type: 'text',
          defaultValue: 'SARAH JENKINS, VOGUE EDITOR',
        },
      ],
    },
    {
      type: 'group',
      name: 'newsletter',
      label: 'Inner Circle',
      fields: [
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'Join the Inner Circle',
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue:
            'Sign up to receive early access to new collections, exclusive events, and curated editorial content.',
        },
        {
          name: 'form',
          type: 'relationship',
          relationTo: 'forms',
          admin: {
            description:
              'Optional Payload form. If empty, submissions are stored via the built-in newsletter endpoint.',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateHomepage],
  },
}
