/**
 * useFieldRegistry Hook
 *
 * Registry pattern mapping field types to their React components.
 * Enables type-safe field rendering in FormPreview and future form filling.
 */

import { TextFieldComponent } from '../components/fields/TextField';
import { NumberFieldComponent } from '../components/fields/NumberField';
import { DecimalFieldComponent } from '../components/fields/DecimalField';
import { DateFieldComponent } from '../components/fields/DateField';
import { TimeFieldComponent } from '../components/fields/TimeField';
import { SelectFieldComponent } from '../components/fields/SelectField';
import { CheckboxFieldComponent } from '../components/fields/CheckboxField';
import { PassFailFieldComponent } from '../components/fields/PassFailField';
import { TextareaFieldComponent } from '../components/fields/TextareaField';
import { PhotoFieldComponent } from '../components/fields/PhotoField';
import type { FormField } from '../types';
import type { ComponentType } from 'react';

// Field component props interface
export interface FieldComponentProps {
  field: FormField;
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

// Field registry mapping field types to components
const fieldRegistry: Record<
  FormField['type'],
  ComponentType<FieldComponentProps>
> = {
  text: TextFieldComponent,
  number: NumberFieldComponent,
  decimal: DecimalFieldComponent,
  date: DateFieldComponent,
  time: TimeFieldComponent,
  select: SelectFieldComponent,
  checkbox: CheckboxFieldComponent,
  passFail: PassFailFieldComponent,
  textarea: TextareaFieldComponent,
  photo: PhotoFieldComponent,
};

/**
 * Hook to access the field registry.
 *
 * @returns Object containing getComponent and getAllTypes functions
 */
export function useFieldRegistry() {
  /**
   * Get the component for a specific field type.
   *
   * @param type - The field type (e.g., 'text', 'number', 'select')
   * @returns The React component for rendering that field type
   */
  const getComponent = (type: FormField['type']) => {
    return fieldRegistry[type];
  };

  /**
   * Get all available field types.
   *
   * @returns Array of all field type literals
   */
  const getAllTypes = (): FormField['type'][] => {
    return Object.keys(fieldRegistry) as FormField['type'][];
  };

  return {
    getComponent,
    getAllTypes,
  };
}
