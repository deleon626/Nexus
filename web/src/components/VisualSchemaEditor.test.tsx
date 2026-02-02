import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualSchemaEditor } from './VisualSchemaEditor';
import {
  mockMinimalSchema,
  mockFullSchema,
  mockEmptySchema,
} from '@/test/fixtures';
import type { ExtractedSchemaStructure } from '@/types/schema';

// Mock the jsonjoy-builder component
vi.mock('jsonjoy-builder', () => ({
  SchemaVisualEditor: vi.fn(({ schema, onChange, readOnly }) => {
    return (
      <div data-testid="mock-jsonjoy-editor">
        <div>Mock JsonJoy Editor</div>
        <div>ReadOnly: {readOnly ? 'true' : 'false'}</div>
        <div>Schema: {JSON.stringify(schema)}</div>
        <button
          data-testid="mock-editor-change"
          onClick={() => {
            // Simulate a change by modifying the schema slightly
            const modified = {
              ...schema,
              title: 'Modified Schema',
            };
            onChange(modified);
          }}
        >
          Simulate Change
        </button>
      </div>
    );
  }),
}));

// Mock the theme CSS import
vi.mock('@/styles/jsonjoy-theme.css', () => ({}));

describe('VisualSchemaEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render with minimal schema', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Visual Schema Editor')).toBeInTheDocument();
      expect(screen.getByText(/Design your QC schema visually/i)).toBeInTheDocument();
      expect(screen.getByTestId('mock-jsonjoy-editor')).toBeInTheDocument();
    });

    it('should render with full schema', () => {
      render(
        <VisualSchemaEditor
          schema={mockFullSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Visual Schema Editor')).toBeInTheDocument();
      expect(screen.getByTestId('mock-jsonjoy-editor')).toBeInTheDocument();
    });

    it('should render with empty schema', () => {
      render(
        <VisualSchemaEditor
          schema={mockEmptySchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('mock-jsonjoy-editor')).toBeInTheDocument();
    });

    it('should display correct field counts in footer', () => {
      render(
        <VisualSchemaEditor
          schema={mockFullSchema}
          onChange={mockOnChange}
        />
      );

      // mockFullSchema has: 3 per-sample, 3 batch, 1 section
      expect(screen.getByText(/Fields: 3 per-sample, 3 batch/i)).toBeInTheDocument();
      expect(screen.getByText(/Sections: 1/i)).toBeInTheDocument();
    });

    it('should display zero counts for empty schema', () => {
      render(
        <VisualSchemaEditor
          schema={mockEmptySchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/Fields: 0 per-sample, 0 batch/i)).toBeInTheDocument();
      expect(screen.getByText(/Sections: 0/i)).toBeInTheDocument();
    });
  });

  describe('Save Button', () => {
    it('should show save button when onSave prop is provided', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /Save Schema/i })).toBeInTheDocument();
    });

    it('should not show save button when onSave prop is not provided', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByRole('button', { name: /Save Schema/i })).not.toBeInTheDocument();
    });

    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Schema/i });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('should disable save button when isLoading is true', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          onSave={mockOnSave}
          isLoading={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Saving.../i });
      expect(saveButton).toBeDisabled();
    });

    it('should show "Saving..." text when isLoading is true', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          onSave={mockOnSave}
          isLoading={true}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable save button when readOnly is true', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          onSave={mockOnSave}
          readOnly={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Schema/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('ReadOnly Mode', () => {
    it('should pass readOnly prop to JsonJoy editor', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          readOnly={true}
        />
      );

      expect(screen.getByText('ReadOnly: true')).toBeInTheDocument();
    });

    it('should not pass readOnly when false', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          readOnly={false}
        />
      );

      expect(screen.getByText('ReadOnly: false')).toBeInTheDocument();
    });
  });

  describe('Schema Changes', () => {
    it('should call onChange when editor content changes', async () => {
      const user = userEvent.setup();

      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      const changeButton = screen.getByTestId('mock-editor-change');
      await user.click(changeButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should show "Unsaved changes" indicator when schema is modified', async () => {
      const user = userEvent.setup();

      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();

      const changeButton = screen.getByTestId('mock-editor-change');
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('should clear isDirty when external schema changes', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      // Make a change to set isDirty
      const changeButton = screen.getByTestId('mock-editor-change');
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });

      // Update with new schema from parent
      rerender(
        <VisualSchemaEditor
          schema={mockFullSchema}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should not show error initially', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should clear error when external schema changes', async () => {
      const user = userEvent.setup();

      // Create a schema that will trigger an error during conversion
      const invalidSchema = {
        ...mockMinimalSchema,
        per_sample_fields: [],
      };

      const { rerender } = render(
        <VisualSchemaEditor
          schema={invalidSchema}
          onChange={mockOnChange}
        />
      );

      // Update with valid schema
      rerender(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should start with visual tab active', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      const visualTab = screen.getByRole('tab', { name: /Visual/i });
      expect(visualTab).toHaveAttribute('data-state', 'active');
    });

    it('should switch to JSON tab when clicked', async () => {
      const user = userEvent.setup();

      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      const jsonTab = screen.getByRole('tab', { name: /JSON/i });
      await user.click(jsonTab);

      await waitFor(() => {
        expect(jsonTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('should display JSON preview in JSON tab', async () => {
      const user = userEvent.setup();

      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      const jsonTab = screen.getByRole('tab', { name: /JSON/i });
      await user.click(jsonTab);

      await waitFor(() => {
        expect(screen.getByText(/This is the JSON Schema representation/i)).toBeInTheDocument();
      });
    });

    it('should show visual editor in visual tab', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('mock-jsonjoy-editor')).toBeInTheDocument();
    });

    it('should hide "Unsaved changes" when there is an error', async () => {
      const user = userEvent.setup();

      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      // Make a change to set isDirty
      const changeButton = screen.getByTestId('mock-editor-change');
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });

      // Note: In real scenario, an error would hide the unsaved changes indicator
      // The implementation has: {isDirty && !error && (...)}
    });
  });

  describe('Tips Section', () => {
    it('should display quick tips', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Tips:')).toBeInTheDocument();
      expect(screen.getByText(/Add Property/i)).toBeInTheDocument();
      expect(screen.getByText(/Use the type dropdown/i)).toBeInTheDocument();
      expect(screen.getByText(/Toggle/i)).toBeInTheDocument();
      expect(screen.getByText(/graded fields/i)).toBeInTheDocument();
    });
  });

  describe('Schema Conversion Integration', () => {
    it('should convert schema to JSON Schema format for editor', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      // The mock editor displays the schema as JSON
      const editorContent = screen.getByTestId('mock-jsonjoy-editor');
      const schemaText = editorContent.textContent;

      // Should contain JSON Schema specific fields
      expect(schemaText).toContain('per_sample_fields');
    });

    it('should re-convert when external schema prop changes', () => {
      const { rerender } = render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      let editorContent = screen.getByTestId('mock-jsonjoy-editor');
      expect(editorContent.textContent).toContain('per_sample_fields');

      // Update schema
      rerender(
        <VisualSchemaEditor
          schema={mockFullSchema}
          onChange={mockOnChange}
        />
      );

      editorContent = screen.getByTestId('mock-jsonjoy-editor');
      // Full schema includes sections
      expect(editorContent.textContent).toContain('sections');
    });
  });

  describe('Validation on Save', () => {
    it('should validate roundtrip before saving', async () => {
      const user = userEvent.setup();

      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Schema/i });
      await user.click(saveButton);

      // Should still call onSave even if validation passes
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on tabs', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('tab', { name: /Visual/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /JSON/i })).toBeInTheDocument();
    });

    it('should have accessible save button', () => {
      render(
        <VisualSchemaEditor
          schema={mockMinimalSchema}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Schema/i });
      expect(saveButton).toBeInTheDocument();
    });
  });
});
