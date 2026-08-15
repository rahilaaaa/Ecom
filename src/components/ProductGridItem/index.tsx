import type { Product } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { getLineUnitPrice } from '@/lib/currency'

type Props = {
  product: Partial<Product>
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, title } = product

  const variants = product.variants?.docs
  const firstVariant =
    variants && variants.length > 0 && typeof variants[0] === 'object' ? variants[0] : null

  const price = getLineUnitPrice({
    product,
    variant: firstVariant,
    enableVariants: Boolean(product.enableVariants && firstVariant),
  })

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${product.slug}`}>
      {image ? (
        <Media
          className={clsx(
            'relative aspect-square object-cover border rounded-2xl p-8 bg-primary-foreground',
          )}
          height={80}
          imgClassName={clsx('h-full w-full object-cover rounded-2xl', {
            'transition duration-300 ease-in-out group-hover:scale-102': true,
          })}
          resource={image}
          width={80}
        />
      ) : null}

      <div className="font-mono text-primary/50 group-hover:text-primary flex justify-between items-center mt-4">
        <div>{title}</div>

        {typeof price === 'number' && (
          <div className="">
            <Price amount={price} />
          </div>
        )}
      </div>
    </Link>
  )
}
