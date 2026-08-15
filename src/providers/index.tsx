import { AuthProvider } from '@/providers/Auth'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { WishlistProvider } from '@/providers/Wishlist'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <HeaderThemeProvider>
            <SonnerProvider />
            <EcommerceProvider
              enableVariants={true}
              currenciesConfig={{
                defaultCurrency: 'INR',
                supportedCurrencies: [
                  {
                    code: 'INR',
                    decimals: 2,
                    label: 'Indian Rupee',
                    symbol: '₹',
                  },
                ],
              }}
              api={{
                cartsFetchQuery: {
                  depth: 2,
                  populate: {
                    products: {
                      slug: true,
                      title: true,
                      gallery: true,
                      inventory: true,
                      priceInINR: true,
                    },
                    variants: {
                      title: true,
                      inventory: true,
                      priceInINR: true,
                    },
                  },
                },
              }}
              paymentMethods={[
                stripeAdapterClient({
                  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
                }),
              ]}
            >
              {children}
            </EcommerceProvider>
          </HeaderThemeProvider>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
