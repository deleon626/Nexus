/**
 * Indonesian translations for jsonjoy-builder
 * Based on Translation type from jsonjoy-builder
 */

export const indonesianTranslations = {
  // Property management
  addProperty: 'Tambah Field',
  removeProperty: 'Hapus Field',
  propertyName: 'Nama Field',
  propertyType: 'Tipe Data',
  
  // Required/Optional
  required: 'Wajib',
  optional: 'Opsional',
  makeRequired: 'Jadikan Wajib',
  makeOptional: 'Jadikan Opsional',
  
  // Data types
  string: 'Teks',
  number: 'Angka',
  integer: 'Bilangan Bulat',
  boolean: 'Ya/Tidak',
  array: 'Daftar',
  object: 'Objek',
  null: 'Kosong',
  
  // String formats
  date: 'Tanggal',
  time: 'Waktu',
  dateTime: 'Tanggal & Waktu',
  email: 'Email',
  uri: 'URL',
  
  // Validation
  minimum: 'Minimum',
  maximum: 'Maksimum',
  minLength: 'Panjang Minimum',
  maxLength: 'Panjang Maksimum',
  pattern: 'Pola (Regex)',
  enum: 'Pilihan',
  
  // Actions
  save: 'Simpan',
  cancel: 'Batal',
  delete: 'Hapus',
  edit: 'Edit',
  add: 'Tambah',
  remove: 'Hapus',
  duplicate: 'Duplikat',
  moveUp: 'Pindah Ke Atas',
  moveDown: 'Pindah Ke Bawah',
  
  // Schema structure
  properties: 'Properti',
  items: 'Item',
  additionalProperties: 'Properti Tambahan',
  
  // Descriptions
  title: 'Judul',
  description: 'Deskripsi',
  default: 'Nilai Default',
  
  // UI elements
  expand: 'Perluas',
  collapse: 'Ciutkan',
  showJson: 'Tampilkan JSON',
  hideJson: 'Sembunyikan JSON',
  
  // Validation messages
  invalidJson: 'JSON tidak valid',
  requiredField: 'Field ini wajib diisi',
  
  // Schema inference
  inferSchema: 'Deteksi Schema dari JSON',
  pasteJson: 'Tempel JSON di sini',
  
  // Tooltips and help
  typeHelp: 'Pilih tipe data untuk field ini',
  requiredHelp: 'Tandai field ini sebagai wajib diisi',
  validationHelp: 'Tambahkan aturan validasi untuk field ini',
};

/**
 * English translations (fallback)
 */
export const englishTranslations = {
  addProperty: 'Add Field',
  removeProperty: 'Remove Field',
  propertyName: 'Field Name',
  propertyType: 'Data Type',
  required: 'Required',
  optional: 'Optional',
  makeRequired: 'Make Required',
  makeOptional: 'Make Optional',
  string: 'Text',
  number: 'Number',
  integer: 'Integer',
  boolean: 'Yes/No',
  array: 'List',
  object: 'Object',
  null: 'Null',
  date: 'Date',
  time: 'Time',
  dateTime: 'Date & Time',
  email: 'Email',
  uri: 'URL',
  minimum: 'Minimum',
  maximum: 'Maximum',
  minLength: 'Min Length',
  maxLength: 'Max Length',
  pattern: 'Pattern (Regex)',
  enum: 'Options',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  remove: 'Remove',
  duplicate: 'Duplicate',
  moveUp: 'Move Up',
  moveDown: 'Move Down',
  properties: 'Properties',
  items: 'Items',
  additionalProperties: 'Additional Properties',
  title: 'Title',
  description: 'Description',
  default: 'Default Value',
  expand: 'Expand',
  collapse: 'Collapse',
  showJson: 'Show JSON',
  hideJson: 'Hide JSON',
  invalidJson: 'Invalid JSON',
  requiredField: 'This field is required',
  inferSchema: 'Infer Schema from JSON',
  pasteJson: 'Paste JSON here',
  typeHelp: 'Select the data type for this field',
  requiredHelp: 'Mark this field as required',
  validationHelp: 'Add validation rules for this field',
};

export type TranslationKey = keyof typeof indonesianTranslations;
