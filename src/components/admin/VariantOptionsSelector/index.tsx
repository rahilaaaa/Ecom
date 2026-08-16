import type { CollectionSlug, RelationshipFieldServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'

import { ErrorBox } from './ErrorBox'
import { HydrateVariantOptions } from './HydrateVariantOptions'
import './index.css'
import { normalizeOptionIDs } from './optionIDs'
import { OptionsSelect } from './OptionsSelect'

type VariantTypeDoc = {
  id: number | string
  label?: string | null
  name?: string | null
  options?: {
    docs?: Array<{
      id: number | string
      label?: string | null
    } | null> | null
  } | null
}

export const VariantOptionsSelector: RelationshipFieldServerComponent = async (props) => {
  const { clientField, data, field, path, req, user } = props
  const { label, required } = clientField

  const productsSlug = (field.custom?.productsSlug as string) || 'products'
  const variantTypesSlug = (field.custom?.variantTypesSlug as string) || 'variantTypes'
  const productID =
    data && typeof data === 'object' && 'product' in data
      ? typeof data.product === 'object' && data.product && 'id' in data.product
        ? data.product.id
        : data.product
      : undefined

  const variantTypes: VariantTypeDoc[] = []

  if (productID) {
    const product = await req.payload.findByID({
      id: productID as number | string,
      collection: productsSlug as CollectionSlug,
      depth: 0,
      draft: true,
      select: {
        variantTypes: true,
      },
      user,
    })

    const variantTypeIDs = Array.isArray(
      (product as { variantTypes?: unknown }).variantTypes,
    )
      ? ((product as { variantTypes: unknown[] }).variantTypes)
      : []

    for (const variantTypeID of variantTypeIDs) {
      const id =
        typeof variantTypeID === 'object' && variantTypeID && 'id' in variantTypeID
          ? (variantTypeID as { id: number | string }).id
          : variantTypeID

      const variantType = await req.payload.findByID({
        id: id as number | string,
        collection: variantTypesSlug as CollectionSlug,
        depth: 1,
        // @ts-expect-error variantTypes.options is a join not present on generated findByID types
        joins: {
          options: {
            sort: 'value',
          },
        },
      })

      if (variantType) {
        variantTypes.push(variantType as VariantTypeDoc)
      }
    }
  }

  const savedOptionIDs = normalizeOptionIDs(
    data && typeof data === 'object' && 'options' in data ? data.options : undefined,
  )

  return (
    <div className="variantOptionsSelector">
      <div className="variantOptionsSelectorHeading">
        <FieldLabel as="span" label={label} />
      </div>
      <HydrateVariantOptions path={path} savedOptionIDs={savedOptionIDs} />
      <ErrorBox path={path}>
        <div className="variantOptionsSelectorList">
          {variantTypes.map((type) => {
            const options = (type.options?.docs || []).flatMap((option) => {
              if (!option || typeof option !== 'object' || !('id' in option)) return []
              return [
                {
                  label: option.label || String(option.id),
                  value: option.id,
                },
              ]
            })

            return (
              <OptionsSelect
                key={String(type.id)}
                label={type.label || type.name || 'Option'}
                options={options}
                path={path}
                required={required}
              />
            )
          })}
        </div>
      </ErrorBox>
    </div>
  )
}
