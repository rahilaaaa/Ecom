import { PriceInput } from '@payloadcms/plugin-ecommerce/rsc'
import type { NumberFieldServerComponent } from 'payload'

import { resolvePricingMode } from '@/lib/pricing'

function productIDFromData(data: unknown): string | number | null {
  if (!data || typeof data !== 'object' || !('product' in data)) return null
  const product = (data as { product?: unknown }).product
  if (product && typeof product === 'object' && 'id' in product) {
    return (product as { id: string | number }).id
  }
  if (typeof product === 'string' || typeof product === 'number') return product
  return null
}

/**
 * Variant price input that is only editable when the parent product uses
 * per-variant pricing. Product-mode variants keep any stored price but it is
 * not charged and is not shown as an override.
 */
export const VariantPriceField: NumberFieldServerComponent = async (props) => {
  const { data, req } = props
  const productID = productIDFromData(data)

  let mode: 'product' | 'variant' = 'product'
  if (productID) {
    try {
      const product = await req.payload.findByID({
        id: productID,
        collection: 'products',
        depth: 0,
        overrideAccess: true,
        req,
        select: {
          enableVariants: true,
          pricingMode: true,
        },
      })
      mode = resolvePricingMode(product)
    } catch {
      mode = 'product'
    }
  }

  if (mode !== 'variant') {
    return (
      <div className="field-type">
        <p className="field-description" style={{ margin: 0 }}>
          This product uses the same price for all variants. The product price is charged — this
          variant price is not used.
        </p>
      </div>
    )
  }

  return <PriceInput {...(props as Parameters<typeof PriceInput>[0])} />
}
