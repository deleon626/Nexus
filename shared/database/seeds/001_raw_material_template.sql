-- Seed Data: Raw Material Receiving Form Template
-- Based on FR/QC/II.03.01 - Penerimaan Bahan Baku (Revisi 02)
-- Standard: SNI 4110:2020

INSERT INTO form_templates (
    id,
    form_code,
    form_name,
    category,
    version,
    version_number,
    schema_definition,
    status,
    effective_from,
    created_at
) VALUES (
    uuid_generate_v4(),
    'FR/QC/II.03.01',
    'Penerimaan Bahan Baku (Raw Material Receiving)',
    'Receiving',
    'Revisi 02',
    2,
    '{
        "document_number": "FR/QC/II.03.01",
        "revision": "02",
        "date": "01/08/2024",
        "standard": "SNI 4110:2020",
        "validation_rules": {
            "min_grade": 7,
            "max_temperature": -15,
            "temperature_range": {
                "min": -21,
                "max": -15
            },
            "histamine_limit": 35
        },
        "sections": [
            {
                "id": "header",
                "name": "Form Header",
                "type": "header",
                "fields": [
                    {
                        "id": "raw_material_type",
                        "label": "Raw Material / Jenis Bahan Baku",
                        "type": "text",
                        "required": true
                    },
                    {
                        "id": "supplier_name",
                        "label": "Supplier Name / Nama Supplier",
                        "type": "text",
                        "required": true
                    },
                    {
                        "id": "license_plate",
                        "label": "License Plate / No. Kendaraan",
                        "type": "text",
                        "required": false
                    },
                    {
                        "id": "date",
                        "label": "Date / Tanggal",
                        "type": "date",
                        "required": true
                    },
                    {
                        "id": "lot_no",
                        "label": "Lot No. / NP Code / Kode NP",
                        "type": "text",
                        "required": true
                    }
                ]
            },
            {
                "id": "samples",
                "name": "Sample Evaluations",
                "type": "repeatable",
                "max_count": 18,
                "description": "Up to 18 samples can be evaluated per form",
                "subsections": [
                    {
                        "id": "frozen",
                        "name": "Frozen / Beku",
                        "description": "Evaluation of frozen state",
                        "criteria": [
                            {
                                "id": "appearance",
                                "label": "Appearance / Kenampakan",
                                "type": "grade",
                                "grades": [
                                    {
                                        "value": 9,
                                        "description_en": "Even and clear, with the entire surface covered in ice",
                                        "description_id": "Rata, bening pada seluruh permukaan dilapisi es"
                                    },
                                    {
                                        "value": 7,
                                        "description_en": "Not Even, clear, with approximately 30% of the product surface not covered in ice",
                                        "description_id": "Tidak rata, bening bagian permukaan produk yang tidak dilapisi es kurang lebih 30%"
                                    },
                                    {
                                        "value": 5,
                                        "description_en": "Not even clear, with approximately 50% of the product surface not covered in ice",
                                        "description_id": "Tidak rata, bening bagian permukaan produk yang tidak dilapisi es kurang lebih 50%"
                                    }
                                ]
                            },
                            {
                                "id": "dehydration",
                                "label": "Dehydration / Pengeringan",
                                "type": "grade",
                                "grades": [
                                    {
                                        "value": 9,
                                        "description_en": "No dehydration on the surface",
                                        "description_id": "Tidak ada pengeringan pada permukaan produk"
                                    },
                                    {
                                        "value": 7,
                                        "description_en": "Dehydration on the surface of approximately 30%",
                                        "description_id": "Pengeringan pada permukaan kurang lebih 30%"
                                    },
                                    {
                                        "value": 5,
                                        "description_en": "Dehydration on the surface of approximately 50%",
                                        "description_id": "Pengeringan pada permukaan kurang lebih 50%"
                                    }
                                ]
                            },
                            {
                                "id": "discoloration",
                                "label": "Discoloration / Perubahan Warna",
                                "type": "grade",
                                "grades": [
                                    {
                                        "value": 9,
                                        "description_en": "Has not any dicoloration on the surface",
                                        "description_id": "Belum mengalami perubahan warna pada permukaan produk"
                                    },
                                    {
                                        "value": 7,
                                        "description_en": "Dicoloration on the surface of approximately 30%",
                                        "description_id": "Perubahan warna pada permukaan kurang lebih 30%"
                                    },
                                    {
                                        "value": 5,
                                        "description_en": "Dicoloration on the surface of approximately 50%",
                                        "description_id": "Perubahan warna pada permukaan kurang lebih 50%"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": "thawing",
                        "name": "Thawing (sesudah pelelehan)",
                        "description": "Evaluation after thawing",
                        "criteria": [
                            {
                                "id": "appearance",
                                "label": "Appearance / Kenampakan",
                                "type": "grade",
                                "grades": [
                                    {
                                        "value": 9,
                                        "description_en": "Very bright specific to the type",
                                        "description_id": "Sangat cemerlang spesifik jenis"
                                    },
                                    {
                                        "value": 7,
                                        "description_en": "Bright",
                                        "description_id": "Cemerlang"
                                    },
                                    {
                                        "value": 5,
                                        "description_en": "Starting to look dull",
                                        "description_id": "Mulai kusam"
                                    }
                                ]
                            },
                            {
                                "id": "odor",
                                "label": "Odor / Bau",
                                "type": "grade",
                                "grades": [
                                    {
                                        "value": 9,
                                        "description_en": "Fresh, specific to the type",
                                        "description_id": "Segar, spesifik jenis"
                                    },
                                    {
                                        "value": 7,
                                        "description_en": "Fresh tend to neutral",
                                        "description_id": "Segar mengarah ke netral"
                                    },
                                    {
                                        "value": 5,
                                        "description_en": "Starting to smell of ammonia",
                                        "description_id": "Mulai tercium amonia"
                                    }
                                ]
                            },
                            {
                                "id": "meat",
                                "label": "Meat / Daging",
                                "type": "grade",
                                "grades": [
                                    {
                                        "value": 9,
                                        "description_en": "Very bright meat slice",
                                        "description_id": "Sayatan daging sangat cemerlang"
                                    },
                                    {
                                        "value": 7,
                                        "description_en": "Bright meat slice",
                                        "description_id": "Sayatan daging cemerlang"
                                    },
                                    {
                                        "value": 5,
                                        "description_en": "Meat slice are starting to get dull",
                                        "description_id": "Sayatan daging mulai kusam"
                                    }
                                ]
                            },
                            {
                                "id": "texture",
                                "label": "Texture / Tekstur",
                                "type": "grade",
                                "grades": [
                                    {
                                        "value": 9,
                                        "description_en": "Firm, compact, very elastic",
                                        "description_id": "Kompak, sangat elastis"
                                    },
                                    {
                                        "value": 7,
                                        "description_en": "Firm, compact, elastic",
                                        "description_id": "Kompak, elastis"
                                    },
                                    {
                                        "value": 5,
                                        "description_en": "Starting to soften",
                                        "description_id": "Mulai lunak"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "id": "summary",
                "name": "Summary",
                "type": "summary",
                "fields": [
                    {
                        "id": "total_kg",
                        "label": "Total (kg)",
                        "type": "number",
                        "required": false
                    },
                    {
                        "id": "grade",
                        "label": "Grade / Nilai",
                        "type": "calculated",
                        "calculation": "avg(samples.*.grade)",
                        "required": false
                    },
                    {
                        "id": "histamine_ppm",
                        "label": "Histamine (ppm)",
                        "type": "number",
                        "validation": {
                            "max": 35,
                            "message": "Histamine must be < 35 ppm"
                        },
                        "required": false
                    },
                    {
                        "id": "decision",
                        "label": "Release/Reject",
                        "type": "select",
                        "options": ["Release", "Reject"],
                        "required": true
                    },
                    {
                        "id": "corrective_action",
                        "label": "Corrective Action / Tindakan Koreksi",
                        "type": "textarea",
                        "required": false
                    },
                    {
                        "id": "report_by",
                        "label": "Report by / Dibuat oleh",
                        "type": "text",
                        "required": true
                    },
                    {
                        "id": "verification",
                        "label": "Verification / Verifikasi",
                        "type": "text",
                        "required": false
                    }
                ]
            }
        ],
        "notes": [
            "Check mark (√) at the selected grade according to the sample code / Beri tanda (√) pada nilai yang dipilih sesuai dengan kode contoh",
            "Minimum grade standard 7 (seven) / Standar minimal nilai 7 (tujuh)",
            "Maximum fish core temperature -15°C (-18°C±3°C) / Suhu pusat ikan maksimal -15°C (-18°C±3°C)",
            "Histamine standard < 35 ppm / Standar histamin < 35 ppm"
        ]
    }',
    'active',
    '2024-08-01 00:00:00+00',
    NOW()
)
ON CONFLICT (form_code, version) DO NOTHING;
