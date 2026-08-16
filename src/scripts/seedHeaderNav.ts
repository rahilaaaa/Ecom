/**
 * One-off: populate Header global nav with fashion commerce links.
 * Run: bunx tsx --env-file=.env src/scripts/seedHeaderNav.ts
 */
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: configPromise })

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
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
    context: {
      disableRevalidate: false,
    },
  })

  payload.logger.info('Header nav items updated.')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
