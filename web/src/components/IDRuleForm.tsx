/**
 * IDRuleForm component for natural language ID rule input.
 * T064: Form for entering ID rule descriptions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { EntityType, IDRuleParseResponse, IDRuleDefinition } from '../types/idGeneration';

interface IDRuleFormProps {
  onParse: (rule: string, entityType: EntityType) => Promise<IDRuleParseResponse>;
  onSave: (ruleName: string, entityType: EntityType, definition: IDRuleDefinition, source: string) => Promise<void>;
  isLoading?: boolean;
  parseResult?: IDRuleParseResponse | null;
  error?: string | null;
}

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'batch', label: 'Batch' },
  { value: 'sample', label: 'Sample' },
  { value: 'report', label: 'Report' },
  { value: 'schema', label: 'Schema' },
];

const EXAMPLE_RULES = [
  'Batch IDs should be NAB-YYYY-MM-NNNN where YYYY is year, MM is month, and NNNN is a 4-digit sequence starting at 0001, resetting monthly',
  'Sample IDs should be SMP-NNNNNN where NNNNNN is a 6-digit sequence that never resets',
  'Report IDs should be RPT-YY-NNNNN where YY is 2-digit year and NNNNN is 5-digit sequence resetting yearly',
];

export function IDRuleForm({
  onParse,
  onSave,
  isLoading = false,
  parseResult,
  error,
}: IDRuleFormProps) {
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('batch');
  const [ruleName, setRuleName] = useState('');

  const handleParse = async () => {
    if (!naturalLanguageRule.trim()) return;
    await onParse(naturalLanguageRule, entityType);
  };

  const handleSave = async () => {
    if (!parseResult || !ruleName.trim()) return;
    await onSave(ruleName, entityType, parseResult.parsed_rule, naturalLanguageRule);
  };

  const handleExampleClick = (example: string) => {
    setNaturalLanguageRule(example);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ID Rule Configuration</CardTitle>
        <CardDescription>
          Describe your ID format in natural language and the AI will parse it into a structured rule.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entity Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="entity-type">Entity Type</Label>
          <div className="flex gap-2">
            {ENTITY_TYPES.map((type) => (
              <Button
                key={type.value}
                type="button"
                variant={entityType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntityType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Natural Language Input */}
        <div className="space-y-2">
          <Label htmlFor="rule-description">ID Format Description</Label>
          <Textarea
            id="rule-description"
            placeholder="Describe how IDs should be formatted..."
            value={naturalLanguageRule}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNaturalLanguageRule(e.target.value)}
            rows={4}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 10 characters. Be specific about format, sequence, and reset rules.
          </p>
        </div>

        {/* Example Templates */}
        <div className="space-y-2">
          <Label>Example Templates</Label>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_RULES.map((example, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1 px-2 text-left"
                onClick={() => handleExampleClick(example)}
              >
                {example.substring(0, 50)}...
              </Button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Parse Button */}
        <Button
          onClick={handleParse}
          disabled={isLoading || naturalLanguageRule.length < 10}
          className="w-full"
        >
          {isLoading ? 'Parsing...' : 'Parse Rule'}
        </Button>

        {/* Save Section (shown after successful parse) */}
        {parseResult && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Monthly Batch ID Rule"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={isLoading || !ruleName.trim()}
              variant="secondary"
              className="w-full"
            >
              Save Rule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
