import { expect, test } from '@playwright/test'

const baseURL = 'http://localhost:3000'

test.describe('PDP variant selection', () => {
  test('clicking color and size updates selection, inventory, and gallery', async ({
    page,
    request,
  }) => {
    const productsRes = await request.get(
      `${baseURL}/api/products?limit=20&depth=2&where[_status][equals]=published`,
    )
    expect(productsRes.ok()).toBeTruthy()
    const productsBody = (await productsRes.json()) as {
      docs?: Array<{ id: number; slug?: string; enableVariants?: boolean; title?: string }>
    }
    const product = productsBody.docs?.find((doc) => doc.enableVariants && doc.slug)
    test.skip(!product?.slug, 'No published variant product in the catalog')
    if (!product?.slug) return

    const variantsRes = await request.get(
      `${baseURL}/api/variants?limit=100&depth=1&where[product][equals]=${product.id}&where[_status][equals]=published`,
    )
    expect(variantsRes.ok()).toBeTruthy()
    const variantsBody = (await variantsRes.json()) as {
      docs?: Array<{
        id: number
        inventory?: number | null
        options?: Array<number | { id?: number; label?: string | null; value?: string | null }>
      }>
    }
    const variants = variantsBody.docs || []
    test.skip(variants.length === 0, 'Product has no published variants')

    await page.goto(`${baseURL}/products/${product.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const colorButtons = page.locator('button[data-selected]:not([aria-label^="Size "])')
    const sizeButtons = page.locator('button[data-selected][aria-label^="Size "]')

    const colorCount = await colorButtons.count()
    const sizeCount = await sizeButtons.count()
    test.skip(colorCount === 0 || sizeCount === 0, 'PDP did not render color and size controls')

    const firstEnabledColor = colorButtons.filter({ hasNot: page.locator('[disabled]') }).first()
    await expect(firstEnabledColor).toBeEnabled()
    await firstEnabledColor.click()
    await expect(firstEnabledColor).toHaveAttribute('aria-pressed', 'true')

    const enabledSizes = sizeButtons.filter({ hasNot: page.locator('[disabled]') })
    const enabledSizeCount = await enabledSizes.count()
    expect(enabledSizeCount).toBeGreaterThan(0)

    const firstSize = enabledSizes.first()
    await firstSize.click()
    await expect(firstSize).toHaveAttribute('aria-pressed', 'true')

    const stock = page.getByText(/left in stock|In stock|Out of stock/i).first()
    await expect(stock).toBeVisible()

    const addToCart = page.getByRole('button', { name: 'Add to Cart' }).first()
    const buyNow = page.getByRole('button', { name: 'Buy Now' }).first()
    await expect(addToCart).toBeVisible()
    await expect(buyNow).toBeVisible()

    const toast = page.getByText('Please select your options before continuing.')
    await addToCart.click()
    await expect(toast).toHaveCount(0)

    const thumbs = page.getByRole('tab')
    const thumbCount = await thumbs.count()
    if (thumbCount > 0) {
      expect(thumbCount).toBeGreaterThan(1)
      await thumbs.nth(Math.min(1, thumbCount - 1)).click()
    }

    const images = page.locator('img[src]:not([src=""])')
    expect(await images.count()).toBeGreaterThan(0)
  })
})
