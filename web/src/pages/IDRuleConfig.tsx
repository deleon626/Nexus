/**
 * IDRuleConfig page for managing ID generation rules.
 * T066: Page integrating ID rule form and preview
 */

import { useState, useEffect } from 'react';
import { IDRuleForm } from '@/components/IDRuleForm';
import { IDRulePreview } from '@/components/IDRulePreview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { parseIDRule, saveIDRule, listIDRules, deleteIDRule } from '@/services/idService';
import type {
  EntityType,
  IDRuleParseResponse,
  IDRuleDefinition,
  IDRuleListItem,
} from '@/types/idGeneration';

export function IDRuleConfig() {
  const [parseResult, setParseResult] = useState<IDRuleParseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRules, setExistingRules] = useState<IDRuleListItem[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing rules on mount
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await listIDRules();
      setExistingRules(response.rules);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  };

  const handleParse = async (rule: string, entityType: EntityType): Promise<IDRuleParseResponse> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await parseIDRule({
        natural_language_rule: rule,
        entity_type: entityType,
      });
      setParseResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse rule';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (
    ruleName: string,
    entityType: EntityType,
    definition: IDRuleDefinition,
    source: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await saveIDRule({
        rule_name: ruleName,
        entity_type: entityType,
        rule_definition: definition,
        natural_language_source: source,
      });

      setSuccessMessage(`Rule "${ruleName}" saved successfully!`);
      setParseResult(null);
      await loadRules();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save rule';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await deleteIDRule(ruleId);
      await loadRules();
      setSuccessMessage('Rule deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete rule';
      setError(message);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ID Rule Configuration</h1>
        <p className="text-muted-foreground">
          Configure how unique IDs are generated for batches, samples, reports, and schemas.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <IDRuleForm
          onParse={handleParse}
          onSave={handleSave}
          isLoading={isLoading}
          parseResult={parseResult}
          error={error}
        />

        {/* Right: Preview */}
        <IDRulePreview parseResult={parseResult} />
      </div>

      {/* Existing Rules Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Existing Rules</CardTitle>
            <CardDescription>
              Currently configured ID generation rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingRules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No ID rules configured yet. Create your first rule above.
              </p>
            ) : (
              <div className="space-y-3">
                {existingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rule.rule_name}</span>
                        <Badge variant="outline">{rule.entity_type}</Badge>
                        {!rule.active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <code className="text-sm text-muted-foreground">
                        {rule.pattern}
                      </code>
                      <div className="text-xs text-muted-foreground">
                        Last sequence: {rule.last_sequence}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
