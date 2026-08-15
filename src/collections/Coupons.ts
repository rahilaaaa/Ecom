import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  admin: {
    useAsTitle: 'code',
    group: 'Ecommerce',
    defaultColumns: ['code', 'type', 'value', 'active', 'expiresAt'],
    description: 'Promotional codes that can be applied on the cart page.',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Customer-facing code (case-insensitive), e.g. WELCOME10',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'percent',
      options: [
        { label: 'Percentage', value: 'percent' },
        { label: 'Fixed amount (cents)', value: 'fixed' },
      ],
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Percent (e.g. 10) or fixed amount in cents (e.g. 1500 = $15).',
      },
    },
    {
      name: 'minSubtotal',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Minimum cart subtotal in cents required to use this coupon.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
