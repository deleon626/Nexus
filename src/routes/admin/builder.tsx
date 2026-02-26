/**
 * Admin Builder Route
 *
 * Complete drag-and-drop form builder with 3-panel layout:
 * - Left: Field sidebar (field palette) OR templates list
 * - Center: Canvas (drop zone with sortable fields)
 * - Right: Field editor (properties panel)
 *
 * Also includes top bar with template name, save, and publish actions.
 * Integrates with Convex backend for template persistence (Plan 11).
 */

import { useFormBuilderStore } from '../../features/formBuilder/store/formBuilderStore';
import { FieldSidebar } from '../../features/formBuilder/components/FieldSidebar';
import { FormBuilderCanvas } from '../../features/formBuilder/components/FormBuilderCanvas';
import { FieldEditor } from '../../features/formBuilder/components/FieldEditor';
import { FormTemplatesList } from '../../features/formBuilder/components/FormTemplatesList';
import { useTemplatePersistence } from '../../features/formBuilder/hooks/useTemplatePersistence';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Save, Eye, EyeOff, LayoutGrid, FolderOpen } from 'lucide-react';

function BuilderContent() {
  const {
    templateName,
    setTemplateName,
    isDirty,
    selectedFieldId,
    fields,
    saveTemplate: saveTemplateToStore,
    reset,
    addField,
    selectField,
  } = useFormBuilderStore();

  const { user } = useAuth();
  const orgId = user?.orgId || 'default'; // TODO: Get from user profile

  // Template persistence hook
  const {
    templates,
    templatesLoading,
    saveTemplate,
    loadTemplate,
    publishTemplate,
    unpublishTemplate,
    deleteTemplate,
    currentTemplateId,
    setCurrentTemplateId,
  } = useTemplatePersistence({ orgId });

  const [showPreview, setShowPreview] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Check if current template is published
  const currentTemplate = templates?.find((t) => t._id.id === currentTemplateId);
  const isPublished = currentTemplate?.published || false;
  const currentVersion = currentTemplate?.version || 1;

  // Show toast message
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle save to Convex
  const handleSave = async () => {
    if (!templateName || fields.length === 0) {
      setSaveError('Template name and at least one field are required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const templateId = await saveTemplate();
      if (templateId) {
        showToast('Template saved successfully');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      setSaveError('Failed to save template. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle publish/unpublish
  const handlePublish = async () => {
    if (!currentTemplateId) {
      setSaveError('Please save the template first');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (isPublished) {
        await unpublishTemplate(currentTemplateId);
        showToast('Template unpublished');
      } else {
        await publishTemplate(currentTemplateId);
        showToast(`Template published as v${currentVersion + 1}`);
      }
    } catch (error) {
      console.error('Failed to publish/unpublish template:', error);
      setSaveError('Failed to update publish status. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle load template
  const handleLoadTemplate = async (id: string) => {
    try {
      await loadTemplate(id);
      setShowTemplates(false); // Switch back to field sidebar
      showToast('Template loaded');
    } catch (error) {
      console.error('Failed to load template:', error);
      setSaveError('Failed to load template. Check console for details.');
    }
  };

  // Handle delete template
  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
      showToast('Template deleted');
    } catch (error) {
      console.error('Failed to delete template:', error);
      setSaveError('Failed to delete template. Check console for details.');
    }
  };

  // Handle new form (reset)
  const handleNewForm = () => {
    if (confirm('Are you sure? This will clear all current fields.')) {
      reset();
      setCurrentTemplateId(null);
      setShowTemplates(false);
    }
  };

  // Handle template name change
  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateName(e.target.value);
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
            {currentTemplateId && (
              <span className="text-xs text-muted-foreground font-mono">
                v{currentVersion}
                {isPublished && ' • Published'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-muted-foreground px-2">
                Unsaved changes
              </span>
            )}
            {saveError && (
              <span className="text-xs text-destructive px-2">
                {saveError}
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
              onClick={() => setShowTemplates(!showTemplates)}
            >
              {showTemplates ? <LayoutGrid className="h-4 w-4 mr-2" /> : <FolderOpen className="h-4 w-4 mr-2" />}
              {showTemplates ? 'Fields' : 'Templates'}
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
              disabled={!templateName || fields.length === 0 || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {currentTemplateId && (
              <Button
                variant={isPublished ? 'destructive' : 'default'}
                size="sm"
                onClick={handlePublish}
                disabled={isSaving}
              >
                {isPublished ? 'Unpublish' : `Publish v${currentVersion + (isPublished ? 0 : 1)}`}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {toastMessage}
        </div>
      )}

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
        ) : showTemplates ? (
          // Templates mode - show saved templates
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <FormTemplatesList
                templates={templates}
                loading={templatesLoading}
                onLoadTemplate={handleLoadTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onCreateNew={handleNewForm}
                currentTemplateId={currentTemplateId}
              />
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
                <FormBuilderCanvas onFieldSelect={selectField} />
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
