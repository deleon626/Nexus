/**
 * Admin Builder Route
 *
 * Complete drag-and-drop form builder with 3-panel layout:
 * - Left: Field sidebar (field palette)
 * - Center: Canvas (drop zone with sortable fields)
 * - Right: Field editor (properties panel)
 *
 * Also includes top bar with template name, save, and publish actions.
 */

import { useFormBuilderStore } from '../../features/formBuilder/store/formBuilderStore';
import { FieldSidebar } from '../../features/formBuilder/components/FieldSidebar';
import { FormBuilderCanvas } from '../../features/formBuilder/components/FormBuilderCanvas';
import { FieldEditor } from '../../features/formBuilder/components/FieldEditor';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Save, Eye, EyeOff } from 'lucide-react';

function BuilderContent() {
  const {
    templateName,
    setTemplateName,
    isDirty,
    selectedFieldId,
    fields,
    saveTemplate,
    reset,
    addField,
  } = useFormBuilderStore();

  const [showPreview, setShowPreview] = React.useState(false);
  const [isPublished, setIsPublished] = React.useState(false);

  // Handle save (console log for now - Convex integration in Plan 11)
  const handleSave = () => {
    const template = saveTemplate();
    console.log('Saving template:', template);
    // TODO: Call Convex mutation in Plan 11
  };

  // Handle publish toggle (console log for now)
  const handlePublish = () => {
    const newStatus = !isPublished;
    setIsPublished(newStatus);
    console.log(`Template ${newStatus ? 'published' : 'unpublished'}`);
    // TODO: Call Convex mutation in Plan 11
  };

  // Handle template name change
  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateName(e.target.value);
  };

  // Handle new form (reset)
  const handleNewForm = () => {
    if (confirm('Are you sure? This will clear all current fields.')) {
      reset();
      setShowPreview(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-bold whitespace-nowrap">Form Builder</h1>
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Template name"
                value={templateName}
                onChange={handleTemplateNameChange}
                className="bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-muted-foreground px-2">
                Unsaved changes
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewForm}
            >
              New Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!templateName || fields.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant={isPublished ? 'destructive' : 'default'}
              size="sm"
              onClick={handlePublish}
              disabled={!templateName || fields.length === 0}
            >
              {isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {showPreview ? (
          // Preview mode - simple placeholder for now
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Form Preview</h2>
              <p className="text-muted-foreground mb-4">
                Preview mode will render the actual form for workers to fill out.
              </p>
              <p className="text-sm text-muted-foreground">
                (Implemented in Phase 3)
              </p>
            </div>
          </div>
        ) : (
          // Edit mode - 3-panel layout
          <div className="h-full grid grid-cols-1 lg:grid-cols-[250px_1fr_320px]">
            {/* Left Panel - Field Sidebar */}
            <FieldSidebar onAddField={addField} />

            {/* Center Panel - Canvas */}
            <div className="border-l border-r overflow-y-auto">
              <div className="p-6">
                <FormBuilderCanvas onFieldSelect={(id) => console.log('Selected:', id)} />
              </div>
            </div>

            {/* Right Panel - Field Editor */}
            <FieldEditor fieldId={selectedFieldId} />
          </div>
        )}
      </main>
    </div>
  );
}

// Import React for JSX
import React from 'react';

export default function AdminBuilder() {
  return <BuilderContent />;
}
