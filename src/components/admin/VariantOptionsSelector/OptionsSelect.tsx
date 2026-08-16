'use client'

import { FieldLabel, ReactSelect, useField } from '@payloadcms/ui'
import { useCallback, useId, useMemo } from 'react'

import { extractOptionID, optionIDsEqual, replaceOptionInType, type OptionID } from './optionIDs'

type SelectOption = {
  label: string
  value: OptionID
}

type Props = {
  label: string
  options: SelectOption[]
  path: string
  required?: boolean
}

export const OptionsSelect = ({ label, options: optionsFromProps, path, required }: Props) => {
  const { setValue, value } = useField({
    potentiallyStalePath: path,
  })
  const id = useId()

  const selectedValue = useMemo(() => {
    if (!Array.isArray(value) || value.length === 0) return undefined

    return optionsFromProps.find((option) =>
      value.some((item) => optionIDsEqual(item, option.value)),
    )
  }, [optionsFromProps, value])

  const handleChange = useCallback(
    (option: unknown) => {
      const selected = Array.isArray(option) ? option[0] : option
      const nextSelectedID = extractOptionID(
        selected && typeof selected === 'object' && 'value' in selected
          ? selected.value
          : selected,
      )
      if (nextSelectedID == null) return

      setValue(
        replaceOptionInType({
          currentIDs: value,
          nextSelectedID,
          previousSelectedID: selectedValue?.value,
        }),
      )
    },
    [selectedValue, setValue, value],
  )

  return (
    <div className="variantOptionsSelectorItem">
      <FieldLabel htmlFor={id} label={label} required={required} />
      <ReactSelect
        getOptionValue={(option) => String((option as SelectOption).value)}
        inputId={id}
        isClearable={false}
        // Payload ReactSelect types a generic Option; this field always writes option IDs.
        onChange={handleChange as never}
        options={optionsFromProps}
        value={selectedValue}
      />
    </div>
  )
}
