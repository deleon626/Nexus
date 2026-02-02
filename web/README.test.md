# Testing Guide - Nexus Web

This document describes the testing setup and conventions for the Nexus web application.

## Test Framework

- **Vitest**: Fast, Vite-native test runner with ESM support
- **@testing-library/react**: Component testing utilities following best practices
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **@testing-library/user-event**: Advanced user interaction simulation
- **jsdom**: DOM implementation for Node.js

## Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
web/src/
├── test/
│   ├── setup.ts          # Global test setup and mocks
│   └── fixtures.ts       # Reusable test data
├── lib/
│   └── schemaConverter.test.ts
└── components/
    └── VisualSchemaEditor.test.tsx
```

## Test Fixtures

Reusable test data is centralized in `src/test/fixtures.ts`:

- `mockPerSampleField` - Number field with validation
- `mockTextField` - Text field with pattern validation
- `mockChoiceField` - Choice field with options
- `mockGradedChoiceField` - Graded choice field
- `mockDateField` - Date field
- `mockBooleanField` - Boolean field
- `mockSection` - Section with criteria
- `mockMinimalSchema` - Simple schema with one field
- `mockEmptySchema` - Empty schema
- `mockFullSchema` - Complete schema with all groups
- `mockAllFieldTypesSchema` - Schema with all field types

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MyComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should transform input correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBeNull();
  });
});
```

## Mocking

### Mocking Third-Party Libraries

The `jsonjoy-builder` component is mocked in `VisualSchemaEditor.test.tsx`:

```typescript
vi.mock('jsonjoy-builder', () => ({
  SchemaVisualEditor: vi.fn(({ schema, onChange, readOnly }) => {
    return (
      <div data-testid="mock-editor">
        {/* Mock implementation */}
      </div>
    );
  }),
}));
```

### Mocking CSS Imports

```typescript
vi.mock('@/styles/theme.css', () => ({}));
```

### Mocking Functions

```typescript
const mockOnChange = vi.fn();
const mockOnSave = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});
```

## Test Coverage

### Current Coverage

**schemaConverter.ts**: 100% coverage
- ✅ All field type conversions
- ✅ Validation rule preservation
- ✅ Roundtrip conversion
- ✅ Edge cases (empty schema, missing fields)

**VisualSchemaEditor.tsx**: 100% coverage
- ✅ Initial render with various schemas
- ✅ onChange callback
- ✅ onSave callback
- ✅ isLoading state
- ✅ readOnly mode
- ✅ isDirty indicator
- ✅ Error display
- ✅ Tab switching
- ✅ Footer counts
- ✅ Validation on save

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 80%
- **Functions**: > 80%
- **Lines**: > 80%

## Best Practices

### 1. Use Testing Library Queries

**Priority Order**:
1. `getByRole` - Accessible by default
2. `getByLabelText` - Forms and labels
3. `getByPlaceholderText` - Inputs
4. `getByText` - Non-interactive elements
5. `getByTestId` - Last resort

### 2. Prefer User Events

Use `@testing-library/user-event` instead of `fireEvent`:

```typescript
// ✅ Good
const user = userEvent.setup();
await user.click(button);

// ❌ Avoid
fireEvent.click(button);
```

### 3. Wait for Async Updates

```typescript
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### 4. Test Behavior, Not Implementation

```typescript
// ✅ Good - tests behavior
it('should show success message after save', async () => {
  await user.click(saveButton);
  expect(screen.getByText('Saved successfully')).toBeInTheDocument();
});

// ❌ Avoid - tests implementation
it('should call setState with new value', () => {
  expect(component.state.value).toBe('new');
});
```

### 5. Arrange-Act-Assert Pattern

```typescript
it('should update count when button is clicked', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Counter initialCount={0} />);

  // Act
  await user.click(screen.getByRole('button', { name: 'Increment' }));

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

## Debugging Tests

### 1. Use `screen.debug()`

```typescript
import { screen } from '@testing-library/react';

it('should render', () => {
  render(<MyComponent />);
  screen.debug(); // Prints current DOM
});
```

### 2. Use `screen.logTestingPlaygroundURL()`

```typescript
screen.logTestingPlaygroundURL();
// Opens browser with DOM and suggested queries
```

### 3. Run Single Test

```bash
# Run specific test file
npm test -- schemaConverter.test.ts

# Run tests matching pattern
npm test -- --grep "should convert"
```

### 4. Use Vitest UI

```bash
npm run test:ui
```

Opens interactive UI at `http://localhost:51204/__vitest__/`

## CI/CD Integration

Tests run automatically in CI:

```yaml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### "Cannot find module" errors

Ensure TypeScript path aliases are configured in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Tests timing out

Increase timeout for async operations:

```typescript
it('should load data', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Mock not working

Clear mocks between tests:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### DOM queries failing

Check element is in document:

```typescript
expect(screen.getByText('Hello')).toBeInTheDocument();
```

Use `queryBy*` for elements that may not exist:

```typescript
expect(screen.queryByText('Missing')).not.toBeInTheDocument();
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
