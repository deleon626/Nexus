import type { SchemaField } from "../types/schema";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface DynamicFieldProps {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
  disabled,
}: DynamicFieldProps) {
  const renderInput = () => {
    switch (field.field_type) {
      case "text":
        return (
          <Input
            id={field.id}
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={field.default_value}
          />
        );

      case "number": {
        const min = field.validation_rules?.min as number | undefined;
        const max = field.validation_rules?.max as number | undefined;
        return (
          <div className="flex items-center gap-2">
            <Input
              id={field.id}
              type="number"
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              disabled={disabled}
              min={min}
              max={max}
              placeholder={field.default_value}
            />
            {field.unit && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {field.unit}
              </span>
            )}
          </div>
        );
      }

      case "date":
        return (
          <Input
            id={field.id}
            type="date"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={disabled}
            />
            <label
              htmlFor={field.id}
              className="text-sm font-normal cursor-pointer"
            >
              {field.label}
            </label>
          </div>
        );

      case "choice":
        return (
          <Select
            value={String(value ?? "")}
            onValueChange={(val) => onChange(val)}
            disabled={disabled}
          >
            <SelectTrigger id={field.id}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                  {option.label_id && (
                    <span className="text-muted-foreground ml-1">
                      ({option.label_id})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "graded_choice":
        return (
          <Select
            value={String(value ?? "")}
            onValueChange={(val) => onChange(Number(val))}
            disabled={disabled}
          >
            <SelectTrigger id={field.id}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0">
                      {option.value}
                    </Badge>
                    <span>
                      {option.label}
                      {option.label_id && (
                        <span className="text-muted-foreground ml-1">
                          ({option.label_id})
                        </span>
                      )}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Unsupported field type: {field.field_type}
          </div>
        );
    }
  };

  // Boolean fields have their label inside the checkbox area
  if (field.field_type === "boolean") {
    return (
      <div className="space-y-2">
        {renderInput()}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.label_id && (
          <span className="text-muted-foreground"> ({field.label_id})</span>
        )}
        {field.required && (
          <Badge variant="destructive" className="ml-2">
            Required
          </Badge>
        )}
      </Label>

      {renderInput()}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
