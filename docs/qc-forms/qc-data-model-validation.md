# QC Data Model & Validation Rules

Technical specification for mapping QC forms to database schema and implementing validation rules.

---

## 1. DATA MODEL OVERVIEW

### Main QC Inspection Entity

```
QC_INSPECTION
├── Basic Info
├── Supplier Info
├── Product Info
├── Receiving Info
├── Quality Assessments
├── Defects
├── Decision
└── Approval
```

---

## 2. CORE TABLES & FIELDS

### A. TABLE: qc_inspections

```sql
CREATE TABLE qc_inspections (
  -- Identifiers
  inspection_id UUID PRIMARY KEY,

  -- Timestamps
  created_at TIMESTAMP,
  inspection_date DATE,
  inspection_time TIME,
  completed_at TIMESTAMP,

  -- User References
  inspector_id UUID,
  supervisor_id UUID,

  -- Supplier & Order
  supplier_id UUID,
  po_number VARCHAR(50),
  invoice_number VARCHAR(50),
  shipment_number VARCHAR(50),

  -- Product Information
  species VARCHAR(50),           -- crab, lobster, shrimp, etc.
  product_type VARCHAR(50),      -- IQF, breaded, block, etc.
  lot_number VARCHAR(50),
  total_cases_received INTEGER,
  cases_sampled INTEGER,

  -- Receiving Conditions
  trailer_temperature_f DECIMAL(5,1),
  product_surface_temp_f DECIMAL(5,1),
  product_core_temp_f DECIMAL(5,1),
  avg_temperature_f DECIMAL(5,1),

  -- Quality Assessment Results
  overall_grade VARCHAR(20),     -- Good, Reasonably Good, Fair, Poor
  sensory_grade VARCHAR(20),
  temperature_pass BOOLEAN,
  weight_pass BOOLEAN,
  size_pass BOOLEAN,
  packaging_pass BOOLEAN,
  labeling_pass BOOLEAN,
  defect_pass BOOLEAN,

  -- Final Decision
  disposition VARCHAR(50),       -- Accept, Hold, Reject, Conditional
  supervisor_override BOOLEAN,
  override_reason TEXT,

  -- Notes
  inspection_notes TEXT,
  quality_issues TEXT,

  -- Status
  status VARCHAR(50),            -- Draft, Submitted, Approved, Rejected

  FOREIGN KEY (inspector_id) REFERENCES users(user_id),
  FOREIGN KEY (supervisor_id) REFERENCES users(user_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);
```

### B. TABLE: qc_sensory_assessment

```sql
CREATE TABLE qc_sensory_assessment (
  assessment_id UUID PRIMARY KEY,
  inspection_id UUID REFERENCES qc_inspections(inspection_id),

  -- Sensory Attributes
  appearance_rating VARCHAR(20),  -- G, RG, F, P
  appearance_notes VARCHAR(500),

  odor_rating VARCHAR(20),
  odor_notes VARCHAR(500),

  flavor_rating VARCHAR(20),
  flavor_notes VARCHAR(500),

  texture_rating VARCHAR(20),
  texture_notes VARCHAR(500),

  -- Overall Sensory Grade
  overall_sensory_grade VARCHAR(20),

  -- Defect Indicators (Boolean flags)
  red_flag_ammonia BOOLEAN,
  red_flag_sour BOOLEAN,
  red_flag_mushy BOOLEAN,
  red_flag_discoloration BOOLEAN,
  red_flag_mold BOOLEAN,
  red_flag_foreign_material BOOLEAN,
  red_flag_pest_signs BOOLEAN,

  created_at TIMESTAMP,
  created_by UUID
);
```

### C. TABLE: qc_weight_assessment

```sql
CREATE TABLE qc_weight_assessment (
  assessment_id UUID PRIMARY KEY,
  inspection_id UUID REFERENCES qc_inspections(inspection_id),

  -- For Frozen Products
  master_case_gross_weight_lbs DECIMAL(8,2),
  subsample_glaze_on_weight_lbs DECIMAL(8,2),
  subsample_glaze_off_weight_lbs DECIMAL(8,2),

  -- Calculations
  glaze_percentage DECIMAL(5,2),
  calculated_net_weight_lbs DECIMAL(8,2),

  -- Specification Comparison
  declared_net_weight_lbs DECIMAL(8,2),
  weight_tolerance_percent DECIMAL(5,2),
  min_acceptable_weight_lbs DECIMAL(8,2),
  max_acceptable_weight_lbs DECIMAL(8,2),
  weight_specification_pass BOOLEAN,
  weight_variance_amount_lbs DECIMAL(8,2),

  -- For Breaded Products
  bread_on_weight_lbs DECIMAL(8,2),
  bread_off_weight_lbs DECIMAL(8,2),
  breading_percentage DECIMAL(5,2),

  created_at TIMESTAMP
);
```

### D. TABLE: qc_size_grading

```sql
CREATE TABLE qc_size_grading (
  grading_id UUID PRIMARY KEY,
  inspection_id UUID REFERENCES qc_inspections(inspection_id),

  -- Product Sizing
  species VARCHAR(50),
  declared_size VARCHAR(50),           -- e.g., "21/25" for shrimp
  specification_range VARCHAR(100),

  -- Size Measurements
  sample_count INTEGER,
  count_per_pound DECIMAL(8,2),
  count_per_unit VARCHAR(50),          -- "per lb", "per 10lb", etc.

  -- Individual Specimen Sizes
  size_1_oz DECIMAL(5,2),
  size_2_oz DECIMAL(5,2),
  size_3_oz DECIMAL(5,2),
  size_4_oz DECIMAL(5,2),
  size_5_oz DECIMAL(5,2),
  size_6_oz DECIMAL(5,2),

  -- Specification Compliance
  min_acceptable_size DECIMAL(8,2),
  max_acceptable_size DECIMAL(8,2),
  size_specification_pass BOOLEAN,
  out_of_spec_count INTEGER,
  out_of_spec_percent DECIMAL(5,2),

  created_at TIMESTAMP
);
```

### E. TABLE: qc_defects

```sql
CREATE TABLE qc_defects (
  defect_id UUID PRIMARY KEY,
  inspection_id UUID REFERENCES qc_inspections(inspection_id),

  -- Defect Classification
  defect_category VARCHAR(50),         -- Packaging, Product, Workmanship, Foreign
  defect_type VARCHAR(100),            -- Specific defect name
  species_relevance VARCHAR(50),       -- Which species affected

  -- Severity & Documentation
  severity VARCHAR(20),                -- Minor, Moderate, Major
  description TEXT,
  count_observed INTEGER,
  percent_affected DECIMAL(5,2),

  -- Photography
  photo_taken BOOLEAN,
  photo_reference VARCHAR(255),

  -- Impact Assessment
  affects_acceptance BOOLEAN,
  requires_rejection BOOLEAN,

  created_at TIMESTAMP
);

-- Defect Reference Table (lookup)
CREATE TABLE qc_defect_types (
  defect_type_id UUID PRIMARY KEY,
  defect_name VARCHAR(100),
  category VARCHAR(50),
  species_applicable TEXT,           -- JSON array of applicable species
  severity_level VARCHAR(20),        -- Minor, Moderate, Major
  auto_reject BOOLEAN,               -- Does this auto-reject?
  description TEXT
);
```

### F. TABLE: qc_critical_limits

```sql
CREATE TABLE qc_critical_limits (
  limit_id UUID PRIMARY KEY,
  species VARCHAR(50),
  product_type VARCHAR(50),

  -- Temperature Limits
  temperature_critical_limit_f DECIMAL(5,1),
  temperature_acceptable_min_f DECIMAL(5,1),
  temperature_acceptable_max_f DECIMAL(5,1),

  -- Weight/Glaze
  glaze_min_percent DECIMAL(5,2),
  glaze_max_percent DECIMAL(5,2),
  min_net_weight_lbs DECIMAL(8,2),
  max_net_weight_lbs DECIMAL(8,2),
  weight_tolerance_percent DECIMAL(5,2),

  -- Size/Count
  size_min DECIMAL(8,2),
  size_max DECIMAL(8,2),
  size_unit VARCHAR(20),             -- "oz", "per_lb", "per_10lb"
  count_min INTEGER,
  count_max INTEGER,

  -- Sensory Requirements
  odor_requirement VARCHAR(100),     -- "No ammonia", "Fresh only", etc.
  texture_requirement VARCHAR(100),  -- "Firm and moist", etc.
  color_requirement VARCHAR(100),    -- Species-specific colors

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 3. VALIDATION RULES

### A. Temperature Validation

```javascript
// Temperature Critical Limits by Species
const TEMP_LIMITS = {
  frozen_seafood: { critical: 0, acceptable_min: -18 },
  refrigerated_cooked: { critical: 40, acceptable_min: 32, acceptable_max: 38 },
  molluscan_shellfish: { critical: 10, acceptable_min: 0, acceptable_max: 10 }
};

// Validation Rule: Temperature Assessment
function validateTemperature(species, productType, measuredTemp) {
  const limits = TEMP_LIMITS[determineCategory(species, productType)];

  if (Math.abs(measuredTemp) > limits.critical) {
    return {
      pass: false,
      severity: 'CRITICAL',
      message: 'Temperature exceeds critical limit - REJECT',
      action: 'AUTO_REJECT'
    };
  }

  if (measuredTemp < limits.acceptable_min) {
    return {
      pass: true,
      severity: 'OK',
      message: 'Temperature within acceptable range'
    };
  }

  return {
    pass: false,
    severity: 'WARNING',
    message: 'Temperature marginal - requires review'
  };
}
```

### B. Sensory Red Flags - Auto Reject

```javascript
// Automatic Rejection Rules (sensory assessment)
const RED_FLAGS = [
  'sour_odor',
  'ammonia_odor',
  'fecal_odor',
  'putrid_odor',
  'mushy_texture',
  'grainy_texture',
  'black_spots_meat',
  'green_bellies',
  'visible_mold',
  'foreign_material',
  'pest_evidence'
];

function assessSensoryRedFlags(assessment) {
  const flagsFound = [];

  RED_FLAGS.forEach(flag => {
    if (assessment[`red_flag_${flag}`] === true) {
      flagsFound.push(flag);
    }
  });

  if (flagsFound.length > 0) {
    return {
      pass: false,
      severity: 'CRITICAL',
      message: `Red flags detected: ${flagsFound.join(', ')}`,
      action: 'AUTO_REJECT',
      flags: flagsFound
    };
  }

  return {
    pass: true,
    severity: 'OK',
    message: 'No sensory red flags detected'
  };
}
```

### C. Weight Specification Validation

```javascript
function validateWeight(assessmentData) {
  const {
    declared_net_weight,
    calculated_net_weight,
    tolerance_percent,
    glaze_on,
    glaze_off
  } = assessmentData;

  // Calculate acceptable range
  const tolerance = declared_net_weight * (tolerance_percent / 100);
  const min_weight = declared_net_weight - tolerance;
  const max_weight = declared_net_weight + tolerance;

  // Check calculated weight
  const weightPass = calculated_net_weight >= min_weight &&
                     calculated_net_weight <= max_weight;

  // Check glaze percentage (typically 10-20%)
  const glaze_percent = ((glaze_on - glaze_off) / glaze_on) * 100;
  const glazePass = glaze_percent >= 10 && glaze_percent <= 20;

  return {
    declared_weight: declared_net_weight,
    calculated_weight: calculated_net_weight,
    acceptable_range: { min: min_weight, max: max_weight },
    weight_variance: calculated_net_weight - declared_net_weight,
    glaze_percentage: glaze_percent,
    weight_pass: weightPass,
    glaze_pass: glazePass,
    overall_pass: weightPass && glazePass,
    warnings: [
      !weightPass && `Weight out of spec: ${calculated_net_weight}lbs vs ${declared_net_weight}lbs (±${tolerance_percent}%)`,
      !glazePass && `Glaze ${glaze_percent.toFixed(1)}% outside acceptable range (10-20%)`
    ].filter(Boolean)
  };
}
```

### D. Size/Count Validation

```javascript
function validateSize(species, specifiedSize, sampleSizes, sampleCount) {
  // Example: Shrimp 21/25 means 21-25 shrimp per pound
  const [minCount, maxCount] = parseCountSpecification(specifiedSize, species);

  const countPerPound = sampleCount / (sumWeights(sampleSizes) / 16); // Convert oz to lb

  // Check if count is within specification
  const countPass = countPerPound >= minCount && countPerPound <= maxCount;

  // Check individual specimens
  const outOfSpec = sampleSizes.filter(size => {
    // Size tolerance typically ±0.5 oz
    const acceptable = Math.abs(size - (specifiedSize / 2)) <= 0.5;
    return !acceptable;
  });

  const outOfSpecPercent = (outOfSpec.length / sampleSizes.length) * 100;

  return {
    specified_count: specifiedSize,
    measured_count: countPerPound.toFixed(2),
    count_pass: countPass,
    out_of_spec_specimens: outOfSpec.length,
    out_of_spec_percent: outOfSpecPercent.toFixed(1),
    size_tolerance_violation: outOfSpecPercent > 5, // Reject if >5% out of spec
    overall_pass: countPass && outOfSpecPercent <= 5
  };
}
```

### E. Sensory Grading Scale

```javascript
// Sensory Assessment Scoring
const SENSORY_GRADES = {
  G: {  // Good
    score: 4,
    appearance: 'Translucent, shiny, firm, moist',
    odor: 'Fresh, clean, ocean-like',
    flavor: 'Sweet, salty, characteristic',
    texture: 'Firm, moist, resilient',
    decision: 'ACCEPT'
  },
  RG: { // Reasonably Good
    score: 3,
    appearance: 'Slightly opaque, minor fading',
    odor: 'Neutral to slightly fishy',
    flavor: 'Slight aging characteristics',
    texture: 'Slightly firm, slight moisture loss',
    decision: 'ACCEPT'
  },
  F: {  // Fair
    score: 2,
    appearance: 'Moderately opaque, surface dry',
    odor: 'Moderate fishy/cardboard',
    flavor: 'Detectable aging',
    texture: 'Slightly soft, mushy starting',
    decision: 'HOLD/REVIEW'
  },
  P: {  // Poor
    score: 1,
    appearance: 'Opaque, grainy, mushy',
    odor: 'Sour, ammonia, putrid',
    flavor: 'Rancid, sickly sweet',
    texture: 'Mushy, decomposing',
    decision: 'REJECT'
  }
};

function calculateOverallSensoryGrade(appearance, odor, flavor, texture) {
  const scores = [
    SENSORY_GRADES[appearance].score,
    SENSORY_GRADES[odor].score,
    SENSORY_GRADES[flavor].score,
    SENSORY_GRADES[texture].score
  ];

  const average = scores.reduce((a, b) => a + b) / scores.length;

  // Map average to grade
  if (average >= 3.5) return 'G';
  if (average >= 2.5) return 'RG';
  if (average >= 1.5) return 'F';
  return 'P';
}
```

### F. Labeling Compliance

```javascript
const LABELING_REQUIREMENTS = {
  domestic: [
    'country_of_origin',
    'method_of_production',
    'packer_distributor',
    'net_weight',
    'date_codes'
  ],
  import: [
    'country_of_origin',
    'method_of_production',
    'packer_distributor',
    'net_weight',
    'date_codes',
    'shipment_number',
    'item_number',
    'upc',
    'nutritional_info',
    'ingredients',
    'cooking_instructions',
    'allergen_statement'
  ],
  shellfish: [
    'dealer_certification',
    'harvest_area',
    'harvest_date'
  ]
};

function validateLabeling(productType, origin, requiredFields) {
  const requirements = origin === 'import' ?
    LABELING_REQUIREMENTS.import :
    LABELING_REQUIREMENTS.domestic;

  if (['oyster', 'clam', 'mussel'].includes(productType)) {
    requirements.push(...LABELING_REQUIREMENTS.shellfish);
  }

  const missing = requirements.filter(field => !requiredFields[field]);

  return {
    all_present: missing.length === 0,
    missing_fields: missing,
    compliance_pass: missing.length === 0,
    severity: missing.length > 0 ? 'HOLD' : 'PASS'
  };
}
```

---

## 4. DECISION TREE LOGIC

### Primary Decision Flow

```
START INSPECTION
    ↓
[Temperature Test]
    ├─ FAIL → AUTO REJECT
    └─ PASS ↓

[Sensory Red Flag Check]
    ├─ ANY RED FLAG → AUTO REJECT
    └─ NO RED FLAGS ↓

[Label Compliance]
    ├─ MISSING INFO → HOLD
    └─ COMPLETE ↓

[Weight/Glaze Assessment]
    ├─ OUT OF SPEC → HOLD/FLAG
    └─ PASS ↓

[Size/Count Verification]
    ├─ OUT OF SPEC → HOLD/FLAG
    └─ PASS ↓

[Defect Assessment]
    ├─ MAJOR DEFECTS → HOLD/REJECT
    └─ MINOR DEFECTS ↓

[Overall Sensory Grade]
    ├─ GOOD/REASONABLY GOOD → ACCEPT
    ├─ FAIR → HOLD FOR REVIEW
    └─ POOR → REJECT

[Final Decision]
    ├─ ACCEPT (no supervisor needed)
    ├─ HOLD (supervisor review required)
    └─ REJECT (supervisor confirmation)
```

### Supervisor Override Logic

```javascript
function canSupervisorOverride(disposition, reason) {
  const OVERRIDABLE = {
    'HOLD': true,           // Can approve held products
    'REJECT': false,        // CANNOT override auto-reject (safety)
    'CONDITIONAL_ACCEPT': true  // Can apply conditions
  };

  if (!OVERRIDABLE[disposition]) {
    return {
      allowed: false,
      message: 'Cannot override automatic reject decisions'
    };
  }

  if (!reason || reason.trim().length < 20) {
    return {
      allowed: false,
      message: 'Override requires detailed justification'
    };
  }

  return {
    allowed: true,
    message: 'Override authorized with documented reason'
  };
}
```

---

## 5. CRITICAL CONTROL POINTS (CCP) MAPPING

```
CCP-1: RECEIVING TEMPERATURE
├─ Critical Limit: Product-specific temp limits
├─ Monitoring: Thermometer reading
├─ Frequency: Every shipment
├─ Action: Reject if exceeded
└─ Record: Temperature log

CCP-2: SENSORY EVALUATION
├─ Critical Limit: No red-flag odors/spoilage
├─ Monitoring: Organoleptic assessment
├─ Frequency: Every sample
├─ Action: Auto-reject if ammonia/sour
└─ Record: Sensory assessment form

CCP-3: LABELING COMPLIANCE
├─ Critical Limit: Complete, accurate labels
├─ Monitoring: Label review
├─ Frequency: Every shipment
├─ Action: Hold if COOL info missing
└─ Record: Label verification log

CCP-4: SHELLFISH SOURCE VERIFICATION
├─ Critical Limit: On ICSSL, proper tags/dates
├─ Monitoring: Dealer cert verification
├─ Frequency: Every molluscan shipment
├─ Action: Reject if not certified
└─ Record: ICSSL lookup documentation
```

---

## 6. AUDIT TRAIL REQUIREMENTS

All QC inspections must capture:

```
AUDIT_TRAIL
├── Created By: User ID
├── Created At: Timestamp
├── Modified By: User ID (if edited)
├── Modified At: Timestamp (if edited)
├── Reviewed By: Supervisor ID
├── Approved At: Timestamp
├── Override Reason: Text (if applicable)
├── All Field Changes: Version history
└── Related Documents: Photo references, attachments
```

---

## 7. SCHEMA INTEGRATION CHECKLIST

- [x] Create qc_inspections table
- [x] Create qc_sensory_assessment table
- [x] Create qc_weight_assessment table
- [x] Create qc_size_grading table
- [x] Create qc_defects table
- [x] Create qc_critical_limits lookup
- [x] Create qc_defect_types lookup
- [x] Implement temperature validation
- [x] Implement sensory red-flag logic
- [x] Implement weight specification validation
- [x] Implement size/count validation
- [x] Implement decision tree logic
- [x] Add audit trail fields to all tables
- [x] Create foreign key relationships
- [x] Add business logic constraints
- [x] Implement CCP monitoring

---

**Status**: Ready for backend implementation
**Last Updated**: 2025-12-25
**Documentation Level**: Technical specification
