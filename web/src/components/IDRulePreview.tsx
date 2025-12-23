/**
 * IDRulePreview component for displaying parsed ID rule structure.
 * T065: Preview component showing parsed rule details
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IDRuleParseResponse, PatternComponent, SequenceResetPeriod } from '../types/idGeneration';

interface IDRulePreviewProps {
  parseResult: IDRuleParseResponse | null;
}

const COMPONENT_TYPE_COLORS: Record<string, string> = {
  literal: 'bg-gray-500',
  year: 'bg-blue-500',
  year_short: 'bg-blue-400',
  month: 'bg-green-500',
  day: 'bg-green-400',
  sequence: 'bg-purple-500',
  facility: 'bg-orange-500',
  uuid: 'bg-red-500',
};

const RESET_PERIOD_LABELS: Record<SequenceResetPeriod, string> = {
  never: 'Never resets',
  daily: 'Resets daily',
  monthly: 'Resets monthly',
  yearly: 'Resets yearly',
};

function ComponentBadge({ component }: { component: PatternComponent }) {
  const colorClass = COMPONENT_TYPE_COLORS[component.type] || 'bg-gray-400';

  let label: string = component.type;
  if (component.type === 'literal' && component.value) {
    label = `"${component.value}"`;
  } else if (component.type === 'sequence' && component.padding) {
    label = `SEQ:${component.padding}`;
  }

  return (
    <Badge className={`${colorClass} text-white`}>
      {label}
    </Badge>
  );
}

function ConfidenceIndicator({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  let colorClass = 'text-green-500';
  if (percentage < 70) colorClass = 'text-yellow-500';
  if (percentage < 50) colorClass = 'text-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass.replace('text-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-sm font-medium ${colorClass}`}>
        {percentage}%
      </span>
    </div>
  );
}

export function IDRulePreview({ parseResult }: IDRulePreviewProps) {
  if (!parseResult) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Parsed Rule Preview</CardTitle>
          <CardDescription>
            Enter a rule description and click "Parse Rule" to see the structured output.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No rule parsed yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const { parsed_rule, confidence_score, warnings } = parseResult;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Parsed Rule Preview</CardTitle>
        <CardDescription>
          Structured representation of your ID rule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confidence Score */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Confidence Score</h4>
          <ConfidenceIndicator score={confidence_score} />
        </div>

        {/* Pattern */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Pattern</h4>
          <code className="block p-3 bg-muted rounded-md font-mono text-sm">
            {parsed_rule.pattern}
          </code>
        </div>

        {/* Example ID */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Example ID</h4>
          <div className="p-3 bg-primary/10 rounded-md font-mono text-lg text-center">
            {parsed_rule.example_id}
          </div>
        </div>

        {/* Components */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Components</h4>
          <div className="flex flex-wrap gap-2">
            {parsed_rule.components.map((component, index) => (
              <ComponentBadge key={index} component={component} />
            ))}
          </div>
        </div>

        {/* Reset Period */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Sequence Reset</h4>
          <Badge variant="outline">
            {RESET_PERIOD_LABELS[parsed_rule.sequence_reset_period]}
          </Badge>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-yellow-600">Warnings</h4>
            <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
