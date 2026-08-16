'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function subscribeNewsletter(input: {
  email: string
  formId?: string | null
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const email = input.email?.trim().toLowerCase()

  if (!email || !isValidEmail(email)) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }

  try {
    const payload = await getPayload({ config: configPromise })

    if (input.formId) {
      const formId = Number(input.formId)

      if (!Number.isInteger(formId) || formId <= 0) {
        return { ok: false, message: 'Unable to subscribe right now. Please try again shortly.' }
      }

      const form = await payload.findByID({
        collection: 'forms',
        id: formId,
        depth: 0,
      })

      const emailField =
        form?.fields?.find((field) => 'name' in field && field.blockType === 'email') ||
        form?.fields?.find((field) => 'name' in field && field.name === 'email')

      const fieldName =
        emailField && 'name' in emailField && typeof emailField.name === 'string'
          ? emailField.name
          : 'email'

      await payload.create({
        collection: 'form-submissions',
        data: {
          form: form.id,
          submissionData: [
            {
              field: fieldName,
              value: email,
            },
          ],
        },
      })
    } else {
      // Fallback: store against any existing newsletter-ish form, or create a lightweight submission trail via logger.
      // Prefer forms titled/named for newsletter when available.
      const forms = await payload.find({
        collection: 'forms',
        limit: 20,
        depth: 0,
      })

      const newsletterForm =
        forms.docs.find((form) => /newsletter|inner.?circle|subscribe/i.test(form.title || '')) ||
        forms.docs[0]

      if (!newsletterForm) {
        payload.logger.info(`Newsletter signup (no form configured): ${email}`)
        return {
          ok: true,
          message: 'You are on the list. Welcome to the Inner Circle.',
        }
      }

      const emailField =
        newsletterForm.fields?.find((field) => 'name' in field && field.blockType === 'email') ||
        newsletterForm.fields?.find((field) => 'name' in field && field.name === 'email')

      const fieldName =
        emailField && 'name' in emailField && typeof emailField.name === 'string'
          ? emailField.name
          : 'email'

      await payload.create({
        collection: 'form-submissions',
        data: {
          form: newsletterForm.id,
          submissionData: [
            {
              field: fieldName,
              value: email,
            },
          ],
        },
      })
    }

    return {
      ok: true,
      message: 'You are on the list. Welcome to the Inner Circle.',
    }
  } catch {
    return {
      ok: false,
      message: 'Unable to subscribe right now. Please try again shortly.',
    }
  }
}
