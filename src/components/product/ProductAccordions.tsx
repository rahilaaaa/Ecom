'use client'

import type { Product } from '@/payload-types'
import React from 'react'

import { RichText } from '@/components/RichText'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { hasRichTextContent } from '@/lib/product/content'

type Props = {
  product: Product
}

const SHIPPING_COPY = `Complimentary shipping on orders over $150. Standard delivery arrives within 3–5 business days. Express options are available at checkout.

Returns are accepted within 30 days of delivery for unworn items in original condition with tags attached. Final sale items cannot be returned.`

export function ProductAccordions({ product }: Props) {
  const rating = typeof product.rating === 'number' ? product.rating : null
  const hasDescription = hasRichTextContent(product.description)
  const reviewLabel = rating != null ? `Reviews · ${rating.toFixed(1)}` : 'Reviews'

  return (
    <Accordion
      type="multiple"
      defaultValue={hasDescription ? ['description'] : []}
      className="w-full border-t border-[var(--elixir-surface-container-highest,#e5e2e1)]"
    >
      <AccordionItem value="description" className="border-[var(--elixir-surface-container-highest,#e5e2e1)]">
        <AccordionTrigger className="py-5 font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--elixir-on-surface,#1c1b1b)] hover:no-underline">
          Description
        </AccordionTrigger>
        <AccordionContent className="pb-6 font-[family-name:var(--font-newsreader)] text-base leading-relaxed text-[var(--elixir-on-surface-variant,#414848)]">
          {hasDescription && product.description ? (
            <RichText data={product.description} enableGutter={false} />
          ) : (
            <p>No description available.</p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="shipping"
        className="border-[var(--elixir-surface-container-highest,#e5e2e1)]"
      >
        <AccordionTrigger className="py-5 font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--elixir-on-surface,#1c1b1b)] hover:no-underline">
          Shipping & Returns
        </AccordionTrigger>
        <AccordionContent className="whitespace-pre-line pb-6 text-sm leading-relaxed text-[var(--elixir-on-surface-variant,#414848)]">
          {SHIPPING_COPY}
        </AccordionContent>
      </AccordionItem>

      {rating != null ? (
        <AccordionItem
          value="reviews"
          className="border-[var(--elixir-surface-container-highest,#e5e2e1)]"
        >
          <AccordionTrigger className="py-5 font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--elixir-on-surface,#1c1b1b)] hover:no-underline">
            {reviewLabel}
          </AccordionTrigger>
          <AccordionContent className="pb-6 text-sm leading-relaxed text-[var(--elixir-on-surface-variant,#414848)]">
            <p>
              Average rating:{' '}
              <span className="font-medium text-[var(--elixir-on-surface,#1c1b1b)]">
                {`${rating.toFixed(1)} / 5`}
              </span>
            </p>
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  )
}
