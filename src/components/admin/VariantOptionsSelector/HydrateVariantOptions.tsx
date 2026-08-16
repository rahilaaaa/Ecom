'use client'

import { useDocumentInfo, useField } from '@payloadcms/ui'
import { useEffect } from 'react'

import { hasPrimitiveOptionIDs, normalizeOptionIDs, type OptionID } from './optionIDs'

type Props = {
  path: string
  savedOptionIDs: OptionID[]
}

export const HydrateVariantOptions = ({ path, savedOptionIDs }: Props) => {
  const { setValue, value } = useField({
    potentiallyStalePath: path,
  })
  const { data } = useDocumentInfo()

  useEffect(() => {
    const formIDs = normalizeOptionIDs(value)
    if (formIDs.length > 0) {
      if (!hasPrimitiveOptionIDs(value, formIDs)) {
        setValue(formIDs, true)
      }
      return
    }

    const documentIDs = normalizeOptionIDs(
      data && typeof data === 'object' && 'options' in data ? data.options : undefined,
    )
    const fallbackIDs = documentIDs.length > 0 ? documentIDs : normalizeOptionIDs(savedOptionIDs)
    if (fallbackIDs.length > 0) {
      setValue(fallbackIDs, true)
    }
  }, [data, savedOptionIDs, setValue, value])

  return null
}
