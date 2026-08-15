import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateDiscover: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context?.disableRevalidate) {
    payload.logger.info(`Revalidating discover`)
    revalidateTag('global_discover')
  }

  return doc
}
