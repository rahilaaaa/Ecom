'use client'

import { FieldError, useField } from '@payloadcms/ui'
import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
  path: string
}

export const ErrorBox = ({ children, path }: Props) => {
  const { errorMessage, showError } = useField({
    potentiallyStalePath: path,
  })

  return (
    <div className="variantOptionsSelectorError">
      <FieldError message={errorMessage} path={path} showError={showError} />
      <div
        className={['variantOptionsSelectorErrorWrapper', showError && 'showError']
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  )
}
