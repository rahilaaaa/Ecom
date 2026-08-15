import type { Footer as FooterType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React, { Suspense } from 'react'

const { COMPANY_NAME, SITE_NAME } = process.env
const brandName = SITE_NAME || COMPANY_NAME || 'ELIXIR'

export async function Footer() {
  const footer: FooterType = await getCachedGlobal('footer', 1)()
  const currentYear = new Date().getFullYear()
  const customerCare = footer.customerCare?.length ? footer.customerCare : null
  const legal = footer.legal?.length ? footer.legal : null
  const legacy = footer.navItems || []

  return (
    <footer className="bg-[var(--elixir-surface-container-high,#eae7e7)] text-sm text-[var(--elixir-on-surface-variant,#414848)]">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-14 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Link
              className="font-[family-name:var(--font-newsreader)] text-xl font-medium tracking-[0.08em] text-[var(--elixir-on-surface,#1c1b1b)]"
              href="/"
            >
              {brandName}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              {footer.description ||
                'Redefining modern minimalism through emotional design and uncompromising quality.'}
            </p>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)]">
              Customer Care
            </h3>
            <Suspense fallback={null}>
              <ul className="flex flex-col gap-3">
                {(customerCare || legacy.slice(0, 3)).map((item) => (
                  <li key={item.id}>
                    <CMSLink
                      appearance="link"
                      className="text-[var(--elixir-on-surface-variant,#414848)] hover:text-[var(--elixir-on-surface,#1c1b1b)]"
                      {...item.link}
                    />
                  </li>
                ))}
                {!customerCare && !legacy.length ? (
                  <>
                    <li>
                      <Link href="/shop">Shipping</Link>
                    </li>
                    <li>
                      <Link href="/shop">Returns</Link>
                    </li>
                    <li>
                      <Link href="/login">Contact Us</Link>
                    </li>
                  </>
                ) : null}
              </ul>
            </Suspense>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)]">
              Legal
            </h3>
            <ul className="flex flex-col gap-3">
              {(legal || legacy.slice(3)).map((item) => (
                <li key={item.id}>
                  <CMSLink
                    appearance="link"
                    className="text-[var(--elixir-on-surface-variant,#414848)] hover:text-[var(--elixir-on-surface,#1c1b1b)]"
                    {...item.link}
                  />
                </li>
              ))}
              {!legal && legacy.length <= 3 ? (
                <>
                  <li>
                    <Link href="/shop">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link href="/shop">Terms of Service</Link>
                  </li>
                </>
              ) : null}
            </ul>
          </div>

          <div className="lg:col-span-1 lg:justify-self-end">
            <ThemeSelector />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--elixir-outline-variant,#c1c8c7)] py-6">
        <div className="mx-auto w-full max-w-[1280px] px-5 text-center md:px-6 lg:px-8">
          <p>
            &copy; {currentYear} {brandName} Boutique. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
