import type { ComponentProps } from 'react'
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { DateField } from './DateField'

type FormDateFieldProps<T extends FieldValues> = Omit<ComponentProps<typeof DateField>, 'value' | 'onValueChange' | 'error'> & { control: Control<T>; name: Path<T> }

/** DateField bound to a react-hook-form field. */
export function FormDateField<T extends FieldValues>({ control, name, ...props }: FormDateFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  return <DateField {...props} value={String(field.value ?? '')} onValueChange={field.onChange} error={fieldState.error?.message}/>
}
