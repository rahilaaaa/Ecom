/**
 * One-off data repair: copy product.priceInINR onto variants missing a price,
 * then re-save carts so plugin beforeChange recalculates subtotal.
 *
 * Run: bun --env-file=.env run src/scripts/backfillVariantPrices.ts
 */
import { getPayload } from 'payload'

import config from '@payload-config'
import { getUnitPrice, PRICE_FIELD } from '@/lib/currency'

async function main() {
  const payload = await getPayload({ config })

  const variants = await payload.find({
    collection: 'variants',
    depth: 1,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })

  let missing = 0
  let updated = 0
  let preserved = 0
  let skippedNoProductPrice = 0

  for (const variant of variants.docs) {
    const existing = getUnitPrice(variant)
    if (typeof existing === 'number') {
      preserved += 1
      continue
    }

    missing += 1

    const product =
      typeof variant.product === 'object' && variant.product
        ? variant.product
        : await payload.findByID({
            collection: 'products',
            id: variant.product as number | string,
            depth: 0,
            overrideAccess: true,
          })

    const productPrice = getUnitPrice(product)
    if (typeof productPrice !== 'number') {
      payload.logger.warn(
        `Variant ${variant.id} (${variant.title}) has no price and parent product has no ${PRICE_FIELD}; skipped.`,
      )
      skippedNoProductPrice += 1
      continue
    }

    await payload.update({
      collection: 'variants',
      id: variant.id,
      data: {
        priceInINREnabled: true,
        priceInINR: productPrice,
        _status: 'published',
      },
      overrideAccess: true,
      context: {
        skipBackfillGuard: true,
      },
    })

    updated += 1
    payload.logger.info(
      `Updated variant ${variant.id} (${variant.title}) → ${PRICE_FIELD}=${productPrice}`,
    )
  }

  const carts = await payload.find({
    collection: 'carts',
    depth: 0,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })

  let cartsRecalculated = 0

  for (const cart of carts.docs) {
    const items = (cart.items || []).map((item) => ({
      id: item.id,
      product: typeof item.product === 'object' && item.product ? item.product.id : item.product,
      variant:
        item.variant == null
          ? undefined
          : typeof item.variant === 'object'
            ? item.variant.id
            : item.variant,
      quantity: item.quantity,
    }))

    if (!items.length) continue

    const updatedCart = await payload.update({
      collection: 'carts',
      id: cart.id,
      data: {
        currency: 'INR',
        items,
      },
      overrideAccess: true,
    })

    cartsRecalculated += 1
    payload.logger.info(
      `Recalculated cart ${cart.id}: subtotal ${cart.subtotal ?? 'null'} → ${updatedCart.subtotal ?? 'null'}`,
    )
  }

  payload.logger.info('--- Variant price backfill complete ---')
  payload.logger.info(`Variants missing price: ${missing}`)
  payload.logger.info(`Variants updated: ${updated}`)
  payload.logger.info(`Variants preserved (already priced): ${preserved}`)
  payload.logger.info(`Variants skipped (no product price): ${skippedNoProductPrice}`)
  payload.logger.info(`Carts recalculated: ${cartsRecalculated}`)

  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
