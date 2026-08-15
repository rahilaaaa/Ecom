import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Image used for Curated For You and category cards.',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Short supporting line for Discover category cards.',
      },
    },
    {
      name: 'curated',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show this category in the homepage Curated For You row.',
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
