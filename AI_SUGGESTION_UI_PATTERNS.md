# AI Suggestion UI Patterns: Implementation Guide
## Visual & Interaction Patterns for Hybrid AI + Visual Builder Systems

---

## Pattern 1: Inline Suggestion (Text/Code)

### Visual Design
```
Original UI:
┌──────────────────────────────┐
│ [Type here...]               │  ← User input area
└──────────────────────────────┘

With AI Suggestion:
┌──────────────────────────────────────────┐
│ Fix the bug in│ this component logic    │  ← Gray text = suggestion
│              └──────────────────────────┘
│ [TAB] Accept    [ESC] Dismiss            │  ← Keyboard shortcuts
│ or continue typing to override           │  ← Clear fallback
└──────────────────────────────────────────┘
```

### Color Scheme
- **Suggestion text**: #999999 (medium gray) on white background
- **Accepted suggestion**: #000000 (normal text)
- **Shortcut hint**: #666666 (subtle gray)
- **On focus**: Light blue highlight around entire suggestion box

### Interaction Flow
1. User starts typing
2. AI generates suggestion (within 200-300ms)
3. Suggestion appears as gray text to right of cursor
4. User can:
   - Press Tab: Accept entire suggestion
   - Press Escape: Dismiss
   - Continue typing: Override suggestion
   - Arrow keys: Cycle through alternatives (if available)

### Code Example (React)
```tsx
interface InlineSuggestionProps {
  suggestion: string;
  onAccept: () => void;
  onReject: () => void;
  userInput: string;
  confidence: number;
}

export const InlineSuggestion: React.FC<InlineSuggestionProps> = ({
  suggestion,
  onAccept,
  onReject,
  userInput,
  confidence
}) => {
  const completionText = suggestion.substring(userInput.length);

  return (
    <div className="inline-suggestion-container">
      <div className="input-wrapper">
        <input
          value={userInput}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              onAccept();
            }
            if (e.key === 'Escape') {
              onReject();
            }
          }}
        />
        {/* Gray suggestion text appears after cursor */}
        <span className="suggestion-text">{completionText}</span>
      </div>

      <div className="suggestion-metadata">
        <span className="confidence-badge">
          {(confidence * 100).toFixed(0)}%
        </span>
        <span className="hint-text">TAB to accept, ESC to dismiss</span>
      </div>
    </div>
  );
};
```

### Best For
- Text editors, code editors, search boxes
- Quick, simple suggestions (single token to few words)
- High-confidence suggestions (>85%)

### Avoid When
- Multiple suggestions needed
- Suggestion is complex/long
- User is unfamiliar with keyboard shortcuts

---

## Pattern 2: Suggestion Card (Sidebar Panel)

### Visual Design
```
┌─────────────────────────────────┐
│ AI Suggestions                  │  ← Header
├─────────────────────────────────┤
│ ┌───────────────────────────────┐ │
│ │ Suggestion 1                  │ │
│ │ "Update parameter to match..."│ │
│ │                               │ │
│ │ ⭐ 92% Confidence             │ │  ← Visual confidence
│ │ 💡 Follows best practices    │ │  ← Quick reason
│ │                               │ │
│ │ [Accept] [Edit] [Reject]     │ │
│ └───────────────────────────────┘ │
│                                    │
│ ┌───────────────────────────────┐ │
│ │ Suggestion 2  (Less likely)   │ │
│ │ "Alternative: Consider..."    │ │
│ │ ⭐ 68% Confidence             │ │
│ │ [Preview] [Accept]            │ │
│ └───────────────────────────────┘ │
│                                    │
│ 🔄 Generate more  📊 Show details │ │  ← Actions
└─────────────────────────────────┘
```

### Color Scheme
- **Selected card**: Light blue background (#E8F4FF)
- **Card border**: #CCCCCC (gray)
- **High confidence text**: Green accent (#4CAF50)
- **Medium confidence**: Yellow (#FFC107)
- **Low confidence**: Orange (#FF9800)
- **Button hover**: Slightly darker shade of card background

### Spacing
- Card padding: 16px
- Gap between cards: 12px
- Panel width: 320px (adjustable)
- Border radius: 8px

### Interaction States
```
DEFAULT (Top card)
┌─────────────────────────┐
│ Suggestion 1 [Primary]  │  ← Darker, prominent
│ ⭐ 92%                  │
│ [Accept] [Edit]         │
└─────────────────────────┘

INACTIVE (Ranked below)
┌─────────────────────────┐
│ Suggestion 2            │  ← Lighter, less prominent
│ ⭐ 68%                  │
│ [Preview] [Accept]      │
└─────────────────────────┘

ON HOVER
┌─────────────────────────┐
│ Suggestion 1 ✨         │  ← Highlight
│ ⭐ 92%                  │
│ [Accept] [Edit] [Copy]  │  ← More options appear
└─────────────────────────┘

LOADING
┌─────────────────────────┐
│ ⟳ Generating...        │  ← Spinner
│ This may take a moment  │
└─────────────────────────┘
```

### Code Example (React)
```tsx
interface SuggestionCardProps {
  suggestion: Suggestion;
  rank: number;
  totalSuggestions: number;
  isSelected: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onShowDetails: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  rank,
  totalSuggestions,
  isSelected,
  onAccept,
  onReject,
  onEdit,
  onShowDetails
}) => {
  return (
    <div
      className={`suggestion-card ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setShowFullActions(true)}
      onMouseLeave={() => setShowFullActions(false)}
    >
      {/* Header */}
      <div className="suggestion-header">
        <h4 className="suggestion-title">
          {rank === 1 ? 'Top Suggestion' : `Alternative ${rank}`}
        </h4>
        {rank === 1 && <span className="badge-primary">Recommended</span>}
      </div>

      {/* Content */}
      <div className="suggestion-content">
        <p className="suggestion-text">{suggestion.content}</p>
        {suggestion.preview && (
          <div className="preview-area">{suggestion.preview}</div>
        )}
      </div>

      {/* Confidence & Metadata */}
      <div className="suggestion-metadata">
        <div className="confidence-indicator">
          <ConfidenceBadge
            score={suggestion.confidence}
            size="small"
          />
        </div>

        {suggestion.reasoning && (
          <div className="reasoning">
            <span className="reasoning-icon">💡</span>
            <span className="reasoning-text">{suggestion.reasoning}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="suggestion-actions">
        <button
          className="btn btn-primary"
          onClick={onAccept}
        >
          Accept
        </button>

        {showFullActions && (
          <>
            <button
              className="btn btn-secondary"
              onClick={onEdit}
            >
              Edit
            </button>
            <button
              className="btn btn-ghost"
              onClick={onShowDetails}
            >
              Details
            </button>
          </>
        )}

        <button
          className="btn btn-ghost icon"
          onClick={onReject}
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Progress indicator */}
      {totalSuggestions > 1 && (
        <div className="suggestion-progress">
          {Array.from({ length: totalSuggestions }, (_, i) => (
            <div
              key={i}
              className={`dot ${i === rank - 1 ? 'active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Best For
- Multiple suggestions (3-5 options)
- Complex suggestions that need previewing
- Sidebar layouts with persistent UI
- Design tools, document editors

### Avoid When
- Space is extremely limited (mobile)
- Single suggestion needed
- Quick action without review

---

## Pattern 3: Floating Action Menu

### Visual Design
```
User selects element on canvas:

     ┌────────────┐
     │ Element    │
     └────────────┘
            ↓
   ┌─────────────────┐
   │ ⚡ AI Actions   │  ← Floating menu appears
   │ ─────────────── │
   │ ✨ Generate     │
   │ 🔄 Regenerate   │
   │ ✏️ Edit Style   │
   │ 🗑️ Remove       │
   └─────────────────┘
```

### Positioning
```
If selection near right edge:    If selection near center:
Position ABOVE/LEFT             Position BELOW/RIGHT

┌─────────────┐                 ┌──────────────┐
│ Selected    │                 │  Selected    │
│ Element     │       →         │  Element     │
└─────────────┘                 └──────────────┘
    ▲                               ▼
┌─────────────┐                 ┌──────────────┐
│ ⚡ AI Menu  │                 │ ⚡ AI Menu    │
└─────────────┘                 └──────────────┘
```

### Color Scheme
- **Background**: White or dark (theme-dependent) with shadow
- **Icon color**: Primary accent color (blue)
- **Text**: #333333
- **Hover state**: Light gray background on menu items
- **Shadow**: Elevation 2-3 (subtle depth)

### Interaction
```
1. User right-clicks OR clicks element
2. Menu appears near cursor/selection (smart positioning)
3. Menu items are:
   - Ranked by relevance to selection
   - Grouped by action type (Generate, Edit, Remove)
   - Show icons for quick recognition
4. User can:
   - Click action to trigger
   - Hover for tooltip with details
   - Click outside to dismiss
```

### Code Example (React)
```tsx
interface FloatingActionMenuProps {
  position: { x: number; y: number };
  actions: Action[];
  onAction: (actionId: string) => void;
  onDismiss: () => void;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  position,
  actions,
  onAction,
  onDismiss
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjusted, setAdjusted] = useState(position);

  useEffect(() => {
    // Smart positioning: avoid going off-screen
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const adjusted = { ...position };

    if (position.x + rect.width > window.innerWidth) {
      adjusted.x = window.innerWidth - rect.width - 16;
    }
    if (position.y + rect.height > window.innerHeight) {
      adjusted.y = window.innerHeight - rect.height - 16;
    }

    setAdjusted(adjusted);
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onDismiss();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onDismiss]);

  return (
    <div
      ref={menuRef}
      className="floating-action-menu"
      style={{
        position: 'fixed',
        left: `${adjusted.x}px`,
        top: `${adjusted.y}px`,
        zIndex: 1000
      }}
    >
      {actions.map(action => (
        <div
          key={action.id}
          className={`menu-item ${action.category}`}
          onClick={() => onAction(action.id)}
          title={action.description}
        >
          <span className="icon">{action.icon}</span>
          <span className="label">{action.label}</span>
          {action.confidence && (
            <span className="confidence-dot"
              style={{
                backgroundColor: action.confidence > 0.8 ? '#4CAF50' : '#FFC107'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
```

### Best For
- Canvas-based editors (design, flowchart, etc.)
- Context-specific actions
- Mobile-friendly (long-press to show)
- Quick access to 3-5 actions

### Avoid When
- Complex configuration needed
- Many actions available (use menu instead)
- No clear positioning anchor

---

## Pattern 4: Modal with Preview

### Visual Design
```
┌───────────────────────────────────────────────┐
│ Generate Design from Description      [X]     │
├───────────────────────────────────────────────┤
│                                                 │
│ INPUT SECTION          │  PREVIEW SECTION      │
│                        │                       │
│ Style Preference:      │  ┌───────────────┐   │
│ [Modern ▼]             │  │               │   │
│                        │  │   LIVE        │   │
│ Color Tone:            │  │   PREVIEW     │   │
│ [Neutral ▼]            │  │               │   │
│                        │  │ Updates as    │   │
│ Complexity:            │  │ user adjusts  │   │
│ [Medium ▼]             │  │ parameters    │   │
│                        │  │               │   │
│ [Randomize]            │  └───────────────┘   │
│                                                 │
├───────────────────────────────────────────────┤
│ [Cancel] [Back] [Generate] [Apply]            │
└───────────────────────────────────────────────┘
```

### Layout Variations

**Two-Column (Recommended for wide screens)**
```
Left: Form/Configuration
Right: Live Preview (updates in real-time)
Ratio: 40/60 or 50/50 depending on content
```

**Stacked (Mobile-friendly)**
```
Top: Form/Configuration
Bottom: Preview (scrollable)
Preview can be full-width or in collapsible section
```

### Color & Styling
- **Modal background**: White (#FFFFFF) or dark mode equivalent
- **Form labels**: #666666
- **Preview area**: Light gray background (#F5F5F5)
- **Input fields**: White with #CCCCCC border
- **Primary button**: Brand color (blue, green)
- **Secondary button**: Light gray
- **Overlay**: Semi-transparent black (rgba(0,0,0,0.5))

### Interaction Flow
```
1. User opens modal (via button, right-click, etc.)
2. Form shows default/previous values
3. As user adjusts parameters:
   - Live preview updates (debounced, 300ms)
   - Loading spinner during generation
4. User can:
   - Click "Generate" for fresh generation
   - Click "Preview" to see before applying
   - Click "Apply" to accept and close
   - Click "Cancel" to discard
```

### Code Example (React)
```tsx
interface GenerateModalProps {
  isOpen: boolean;
  selectedElement: unknown;
  onApply: (result: unknown) => void;
  onClose: () => void;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({
  isOpen,
  selectedElement,
  onApply,
  onClose
}) => {
  const [config, setConfig] = useState({
    style: 'modern',
    colorTone: 'neutral',
    complexity: 'medium'
  });

  const [preview, setPreview] = useState<unknown>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Debounced preview generation
  const debouncedGenerate = useMemo(
    () => debounce(async (cfg: typeof config) => {
      setIsGenerating(true);
      try {
        const result = await aiService.generateDesign(selectedElement, cfg);
        setPreview(result);
      } catch (error) {
        console.error('Generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    }, 300),
    [selectedElement]
  );

  const handleConfigChange = (key: string, value: unknown) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    debouncedGenerate(newConfig);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>Generate Design</ModalHeader>

      <ModalContent style={{ display: 'flex', gap: '24px' }}>
        {/* Left: Configuration */}
        <div style={{ flex: '0 0 40%' }}>
          <div className="form-group">
            <label>Style Preference</label>
            <select
              value={config.style}
              onChange={(e) => handleConfigChange('style', e.target.value)}
            >
              <option>Modern</option>
              <option>Classic</option>
              <option>Minimalist</option>
            </select>
          </div>

          <div className="form-group">
            <label>Color Tone</label>
            <select
              value={config.colorTone}
              onChange={(e) => handleConfigChange('colorTone', e.target.value)}
            >
              <option>Neutral</option>
              <option>Vibrant</option>
              <option>Pastel</option>
            </select>
          </div>

          <div className="form-group">
            <label>Complexity</label>
            <select
              value={config.complexity}
              onChange={(e) => handleConfigChange('complexity', e.target.value)}
            >
              <option>Simple</option>
              <option>Medium</option>
              <option>Complex</option>
            </select>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setConfig({
              style: 'modern',
              colorTone: 'neutral',
              complexity: 'medium'
            })}
          >
            Reset to Defaults
          </button>
        </div>

        {/* Right: Live Preview */}
        <div style={{ flex: '0 0 60%' }}>
          {isGenerating ? (
            <div className="preview-loading">
              <Spinner />
              <p>Generating preview...</p>
            </div>
          ) : preview ? (
            <div className="preview-container">
              <PreviewRenderer content={preview} />
            </div>
          ) : (
            <div className="preview-placeholder">
              Adjust settings to see preview
            </div>
          )}
        </div>
      </ModalContent>

      <ModalFooter>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => onApply(preview)}
          disabled={!preview}
        >
          Apply
        </button>
      </ModalFooter>
    </Modal>
  );
};
```

### Best For
- Complex suggestions with many parameters
- Major operations (redesign, refactor, generate)
- Multi-step workflows
- Requires live preview to decide

### Avoid When
- Simple, quick actions
- Mobile with small screen
- User wants minimal friction

---

## Pattern 5: Split Panel (Dual Window)

### Visual Design
```
┌──────────────────────────────────────────────┐
│              Document Editor                  │
├────────────────────┬────────────────────────┤
│                    │                        │
│   ORIGINAL         │   AI SUGGESTION        │
│   Content          │   (Alternative)        │
│                    │                        │
│   Lorem ipsum      │   Lorem ipsum is       │
│   dolor sit amet   │   simply dummy text    │
│                    │                        │
│   [Select All]     │   [Copy] [Accept]      │
│   [Clear]          │   [Edit] [Reject]      │
│                    │                        │
│ (Editable)         │ (Read-only preview)    │
│                    │                        │
├────────────────────┴────────────────────────┤
│ Show changes: [Highlights] [Side-by-side]   │
│                  [Unified diff]              │
└──────────────────────────────────────────────┘
```

### Panel Sizing
```
Default: 50/50 split

┌──────────────┬──────────────┐
│              │              │
│   Original   │   AI         │
│   (50%)      │   (50%)      │
│              │              │
└──────────────┴──────────────┘

User can drag divider to resize:

┌─────────────────────┬──────┐
│    Original (70%)   │ AI   │
└─────────────────────┴──────┘

Or collapse one side:

┌─────────────────────────────┐
│      Original (100%)        │  (AI hidden)
└─────────────────────────────┘
```

### Color Scheme
- **Divider**: #CCCCCC with hover effect (#999999)
- **Left panel**: White (#FFFFFF)
- **Right panel**: Light blue background (#F0F8FF) to differentiate
- **Highlighted changes**: Yellow background (#FFFFCC)
- **Deleted text**: Red strikethrough (#FF6B6B)
- **Added text**: Green highlight (#90EE90)

### Interaction
```
1. Show original on left
2. Show AI suggestion on right
3. Text shows differences:
   - Green: Added by AI
   - Red: Removed by AI
   - Normal: Unchanged
4. User can:
   - Accept entire right version
   - Copy sections from right to left
   - Click checkboxes to accept per-paragraph
   - Drag divider to resize
```

### Code Example (React)
```tsx
interface SplitPanelProps {
  original: string;
  suggestion: string;
  onAcceptSuggestion: () => void;
  onRejectSuggestion: () => void;
  onMergeSections: (sections: string[]) => void;
}

export const SplitPanel: React.FC<SplitPanelProps> = ({
  original,
  suggestion,
  onAcceptSuggestion,
  onRejectSuggestion,
  onMergeSections
}) => {
  const [dividerPos, setDividerPos] = useState(50); // percentage
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const containerWidth = document.querySelector('.split-panel')?.clientWidth || 100;
      const newPos = (dividerPos * containerWidth + delta) / containerWidth;
      setDividerPos(Math.min(Math.max(newPos, 20), 80));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="split-panel">
      {/* Left Panel */}
      <div
        className="panel original-panel"
        style={{ width: `${dividerPos}%` }}
      >
        <h3>Original</h3>
        <div className="content editable">
          {original}
        </div>
      </div>

      {/* Divider */}
      <div
        className="divider"
        onMouseDown={handleDividerMouseDown}
        style={{ left: `${dividerPos}%` }}
      >
        ⋮⋮
      </div>

      {/* Right Panel */}
      <div
        className="panel suggestion-panel"
        style={{ width: `${100 - dividerPos}%` }}
      >
        <h3>AI Suggestion</h3>

        <div className="content suggestion-content">
          <DiffViewer
            original={original}
            modified={suggestion}
            highlightChanges
          />
        </div>

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={onAcceptSuggestion}
          >
            Accept All
          </button>
          <button
            className="btn btn-secondary"
            onClick={onRejectSuggestion}
          >
            Reject
          </button>
          <button
            className="btn btn-tertiary"
            onClick={() => onMergeSections(selectedSections)}
            disabled={selectedSections.length === 0}
          >
            Merge Selected ({selectedSections.length})
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Best For
- Document editing (writers, technical writers)
- Code refactoring
- Detailed comparisons needed
- Iterative refinement with selective acceptance
- High-stakes changes where review is critical

### Avoid When
- Screen space is limited
- Quick action without detailed review
- Mobile devices

---

## Pattern 6: Confidence Badge Component

### Visual Variations

```
BADGE 1: Percentage + Bar
┌─────────────────────────┐
│ 85% Confidence          │
│ ████████░░ 85%          │  ← Visual bar
└─────────────────────────┘

BADGE 2: Verbal + Icon
┌──────────────────┐
│ ✓ High Confidence │  ← Color-coded
│ Likely accurate  │
└──────────────────┘

BADGE 3: Star Rating
┌──────────────────┐
│ ⭐⭐⭐⭐☆        │  ← 4 of 5 stars
│ 4/5 confidence   │
└──────────────────┘

BADGE 4: Color Dot
(With hover tooltip)
🟢 80%+ (High)
🟡 50-80% (Medium)
🔴 <50% (Low)

BADGE 5: Expandable Card
┌──────────────────────────┐
│ Confidence: 78%  [>]     │
│ ──────────────────────── │
│ Why this score:          │  ← Expanded
│ ✓ Similar pattern used   │
│ ✓ Within constraints      │
│ ? May need testing       │
└──────────────────────────┘
```

### Color Mapping

```
Confidence Range  Color      Hex Code    Interpretation
─────────────────────────────────────────────────────────
95-100%          Deep Green  #2E7D32    Highly confident
85-94%           Green       #4CAF50    Confident
75-84%           Light Green #81C784    Moderately confident
50-74%           Yellow      #FFC107    Less certain
30-49%           Orange      #FF9800    Low confidence
<30%             Red         #F44336    Very uncertain
```

### Usage Guidelines

```
When to Show    When to Hide         When to Use Verbal
─────────────────────────────────────────────────────
High stakes     Low-stakes tasks     Non-technical users
Complex data    Creative suggestions General audience
User requests   Brainstorming mode   Mobile interfaces
```

### Code Example (React)
```tsx
interface ConfidenceBadgeProps {
  score: number; // 0-1
  size?: 'small' | 'medium' | 'large';
  variant?: 'bar' | 'star' | 'dot' | 'expandable';
  showReasoning?: boolean;
  reasoning?: string[];
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  size = 'medium',
  variant = 'bar',
  showReasoning = false,
  reasoning = []
}) => {
  const percentage = Math.round(score * 100);

  const getColor = (score: number) => {
    if (score >= 0.95) return '#2E7D32'; // Deep green
    if (score >= 0.85) return '#4CAF50'; // Green
    if (score >= 0.75) return '#81C784'; // Light green
    if (score >= 0.5) return '#FFC107';  // Yellow
    if (score >= 0.3) return '#FF9800';  // Orange
    return '#F44336'; // Red
  };

  const getVerbalLabel = (score: number) => {
    if (score >= 0.85) return 'High confidence';
    if (score >= 0.75) return 'Moderately confident';
    if (score >= 0.5) return 'Less certain';
    return 'Low confidence';
  };

  switch (variant) {
    case 'bar':
      return (
        <div className={`confidence-badge badge-bar size-${size}`}>
          <div className="percentage-text">{percentage}%</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${percentage}%`,
                backgroundColor: getColor(score)
              }}
            />
          </div>
        </div>
      );

    case 'star':
      return (
        <div className={`confidence-badge badge-star size-${size}`}>
          <div className="stars">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`star ${i < Math.round(score * 5) ? 'filled' : 'empty'}`}
              >
                ⭐
              </span>
            ))}
          </div>
          <div className="label">{percentage}%</div>
        </div>
      );

    case 'dot':
      return (
        <div
          className={`confidence-badge badge-dot size-${size}`}
          title={getVerbalLabel(score)}
          style={{
            backgroundColor: getColor(score),
            borderRadius: '50%',
            width: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
            height: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px'
          }}
        />
      );

    case 'expandable':
      return (
        <details className={`confidence-badge badge-expandable size-${size}`}>
          <summary>
            <span className="label">Confidence: {percentage}%</span>
            <span className="icon">▸</span>
          </summary>

          {showReasoning && reasoning.length > 0 && (
            <div className="reasoning-list">
              {reasoning.map((reason, idx) => (
                <div key={idx} className="reasoning-item">
                  <span className="check">✓</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </details>
      );

    default:
      return null;
  }
};
```

---

## Pattern 7: Explanation Tooltip / Details Panel

### Visual Design

**Hover Tooltip**
```
User hovers over suggestion:
        ↓
┌────────────────────────────┐
│ 💡 Why this suggestion?    │
│                            │
│ ✓ Matches your style       │
│ ✓ Following design system  │
│ ? Untested on mobile       │
│                            │
│ Based on: 42 similar cases │
│ Confidence: 89%            │
└────────────────────────────┘
```

**Expandable Details Card**
```
Default State:
┌─────────────────────────┐
│ Generate new layout [>] │
└─────────────────────────┘

Expanded State:
┌─────────────────────────────────┐
│ Generate new layout         [v] │
│ ─────────────────────────────── │
│                                  │
│ Why: Improves spacing           │
│ Risk: May need mobile testing   │
│ Confidence: 78%                 │
│ Examples: 23 similar designs    │
│                                  │
│ [Learn More] [Show Examples]    │
└─────────────────────────────────┘
```

### Content Structure
```
Explanation should include:
1. WHAT: Simple description of suggestion
2. WHY: Reasoning (why is it suggested?)
3. CONFIDENCE: How certain is the AI?
4. EVIDENCE: What data supports this?
5. RISKS: What could go wrong?
6. EXAMPLES: See similar cases
```

### Code Example (React)
```tsx
interface ExplanationTooltipProps {
  suggestion: Suggestion;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const ExplanationTooltip: React.FC<ExplanationTooltipProps> = ({
  suggestion,
  position = 'top'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`explanation-tooltip position-${position}`}>
      {/* Compact view (hover) */}
      <div className="tooltip-compact">
        <h4>💡 Why this suggestion?</h4>
        {suggestion.reasoning && (
          <p className="reasoning">{suggestion.reasoning}</p>
        )}
        <div className="quick-stats">
          <span>Confidence: {(suggestion.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Detailed view (expand) */}
      {isExpanded && (
        <div className="tooltip-expanded">
          <div className="explanation-section">
            <h5>What</h5>
            <p>{suggestion.content}</p>
          </div>

          {suggestion.reasoning && (
            <div className="explanation-section">
              <h5>Why</h5>
              <p>{suggestion.reasoning}</p>
            </div>
          )}

          <div className="explanation-section">
            <h5>Confidence</h5>
            <ConfidenceBadge
              score={suggestion.confidence}
              variant="bar"
            />
          </div>

          {suggestion.metadata?.evidenceCount !== undefined && (
            <div className="explanation-section">
              <h5>Evidence</h5>
              <p>Based on {suggestion.metadata.evidenceCount} similar cases</p>
            </div>
          )}

          {suggestion.metadata?.risks && (
            <div className="explanation-section warning">
              <h5>⚠️ Risks to Consider</h5>
              <ul>
                {suggestion.metadata.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        className="expand-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▲ Less' : '▼ More'}
      </button>
    </div>
  );
};
```

---

## Summary: When to Use Each Pattern

| Pattern | Use Case | Complexity | Control |
|---------|----------|-----------|---------|
| **Inline** | Text completion, quick fixes | Low | Keyboard |
| **Card** | Multiple ranked options | Medium | Click/select |
| **Menu** | Canvas-based actions | Medium | Click/right-click |
| **Modal** | Complex generation with params | High | Form + preview |
| **Split** | Detailed comparison/merge | High | Selective acceptance |
| **Badge** | Show confidence | Low | Visual indicator |
| **Tooltip** | Explain reasoning | Medium | Hover/expand |

---

## Accessibility Considerations

1. **Keyboard Navigation**: All patterns must be fully keyboard accessible
2. **Screen Readers**: Announce confidence scores and suggestions clearly
3. **Color Blind**: Don't rely on color alone (use icons + text)
4. **Mobile**: Consider touch targets (minimum 44px × 44px)
5. **Contrast**: Maintain WCAG AA contrast ratios
6. **Focus**: Clear focus indicators for keyboard users

---

**Last Updated**: January 16, 2026
**Status**: Complete implementation guide for production use
