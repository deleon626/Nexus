"""Captured LLM responses for contract testing.

These fixtures represent realistic responses from the vision LLM
when extracting schemas from QC forms. They are used in contract
tests to verify parsing logic without making actual API calls.

To update: Run live extraction and capture the response.
"""

# Realistic extraction response for "FR-QC-II.03.01 - Penerimaan Bahan Baku"
# This is a raw material receiving QC form with temperature, weight, and grading
QC_FORM_EXTRACTION_RESPONSE = {
    "per_sample_fields": [
        {
            "id": "sample_number",
            "label": "Sample Number",
            "label_id": "No. Sampel",
            "field_type": "text",
            "required": True,
        },
        {
            "id": "temperature",
            "label": "Temperature",
            "label_id": "Suhu",
            "field_type": "number",
            "required": True,
            "unit": "°C",
            "validation_rules": {"min": -25, "max": -18},
        },
        {
            "id": "weight",
            "label": "Weight",
            "label_id": "Berat",
            "field_type": "number",
            "required": True,
            "unit": "kg",
        },
    ],
    "sections": [
        {
            "id": "organoleptic",
            "label": "Organoleptic Assessment",
            "label_id": "Penilaian Organoleptik",
            "criteria": [
                {
                    "id": "appearance",
                    "label": "Appearance",
                    "label_id": "Kenampakan",
                    "grades": [
                        {"value": 9, "label": "Excellent - No defects visible"},
                        {"value": 7, "label": "Good - Minor defects"},
                        {"value": 5, "label": "Acceptable - Some defects"},
                    ],
                },
                {
                    "id": "odor",
                    "label": "Odor",
                    "label_id": "Bau",
                    "grades": [
                        {"value": 9, "label": "Fresh, characteristic odor"},
                        {"value": 7, "label": "Neutral, no off-odors"},
                        {"value": 5, "label": "Slight off-odor"},
                    ],
                },
                {
                    "id": "texture",
                    "label": "Texture",
                    "label_id": "Tekstur",
                    "grades": [
                        {"value": 9, "label": "Firm, elastic"},
                        {"value": 7, "label": "Slightly soft"},
                        {"value": 5, "label": "Soft, less elastic"},
                    ],
                },
            ],
        }
    ],
    "batch_metadata_fields": [
        {
            "id": "supplier_name",
            "label": "Supplier Name",
            "label_id": "Nama Supplier",
            "field_type": "text",
            "required": True,
        },
        {
            "id": "lot_number",
            "label": "Lot Number",
            "label_id": "No. Lot",
            "field_type": "text",
            "required": True,
        },
        {
            "id": "receiving_date",
            "label": "Receiving Date",
            "label_id": "Tanggal Penerimaan",
            "field_type": "date",
            "required": True,
        },
        {
            "id": "vehicle_number",
            "label": "Vehicle Number",
            "label_id": "No. Kendaraan",
            "field_type": "text",
            "required": False,
        },
    ],
    "validation_rules": {
        "temperature_min": -25,
        "temperature_max": -18,
        "minimum_grade": 5,
        "passing_grade": 7,
    },
}

# Response wrapped in markdown code block (common LLM behavior)
QC_FORM_MARKDOWN_WRAPPED = f"""```json
{QC_FORM_EXTRACTION_RESPONSE}
```"""

# Malformed response for error handling tests
MALFORMED_JSON_RESPONSE = "{ invalid json without closing brace"

# Empty/minimal response
MINIMAL_VALID_RESPONSE = {
    "per_sample_fields": [],
    "sections": [],
    "batch_metadata_fields": [],
    "validation_rules": {},
}

# Response missing required structure
PARTIAL_RESPONSE = {
    "per_sample_fields": [
        {"id": "temp", "label": "Temperature", "field_type": "number"}
    ]
    # Missing: sections, batch_metadata_fields
}
