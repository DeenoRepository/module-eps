import { z } from 'zod';

export type CustomFieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN';

export interface CustomFieldDefinition {
  id?: string;
  key: string;
  name: string;
  fieldType: CustomFieldType;
  unit?: string | null;
  isRequired?: boolean;
  defaultValue?: string | null;
  options?: string[] | null;
  sectionCode?: string | null;
  sortOrder?: number;
}

export interface CustomSectionDefinition {
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  fields?: CustomFieldDefinition[];
}

export const STANDARD_SECTIONS: readonly CustomSectionDefinition[] = [
  { code: 'classifiers', name: 'Общероссийские и отраслевые классификаторы', description: 'Коды ОКОФ (ОК 013-2014), ОКПД2, классификаторы техпроцесса и децимальные номера', icon: 'Category', sortOrder: 1 },
  { code: 'condition_wear', name: 'Техническое состояние, износ и критичность', description: 'Процент износа, критичность для производства, класс чистоты ISO, признаки уникальности и импорта', icon: 'Speed', sortOrder: 2 },
  { code: 'maintenance_regulations', name: 'Регламент ТОиР и график обслуживания', description: 'Периодичность ТО, график на текущий год, ответственные лица и связь с 1С', icon: 'Shield', sortOrder: 3 },
  { code: 'electrical', name: 'Электротехнические параметры', description: 'Характеристики электропитания, мощности, напряжения и фазности', icon: 'Bolt', sortOrder: 4 },
  { code: 'mechanics', name: 'Механика, гидравлика и среда', description: 'Рабочие среды, давление, обороты и смазочные материалы', icon: 'WaterDrop', sortOrder: 5 },
  { code: 'operational', name: 'Эксплуатационные требования и метрология', description: 'Непрерывность процесса, поверки датчиков и регламентные условия', icon: 'Straighten', sortOrder: 6 },
] as const;

export const CANONICAL_SPECS: readonly CustomFieldDefinition[] = [
  // 1. Classifiers
  { key: 'decimal_number', name: 'Децимальный номер', sectionCode: 'classifiers', fieldType: 'TEXT', sortOrder: 1 },
  { key: 'okof_code', name: 'Код по ОКОФ (ОК 013-2014)', sectionCode: 'classifiers', fieldType: 'TEXT', sortOrder: 2 },
  { key: 'okpd2_code', name: 'Код по ОКПД2 (ОК 034-2014)', sectionCode: 'classifiers', fieldType: 'TEXT', sortOrder: 3 },
  { key: 'process_classifier_code', name: 'Код технологического классификатора', sectionCode: 'classifiers', fieldType: 'TEXT', sortOrder: 4 },
  { key: 'equipment_group', name: 'Группа оборудования', sectionCode: 'classifiers', fieldType: 'TEXT', sortOrder: 5 },
  { key: 'equipment_type', name: 'Тип оборудования (Установка)', sectionCode: 'classifiers', fieldType: 'TEXT', sortOrder: 6 },

  // 2. Condition, wear & criticality
  { key: 'country_origin', name: 'Страна производитель', sectionCode: 'condition_wear', fieldType: 'TEXT', sortOrder: 1 },
  { key: 'prod_year', name: 'Год выпуска', sectionCode: 'condition_wear', fieldType: 'NUMBER', sortOrder: 2 },
  { key: 'comm_year', name: 'Год ввода', sectionCode: 'condition_wear', fieldType: 'NUMBER', sortOrder: 3 },
  { key: 'equipment_age', name: 'Возраст оборудования', sectionCode: 'condition_wear', fieldType: 'NUMBER', unit: 'лет', sortOrder: 4 },
  { key: 'actual_wear_percentage', name: 'Фактический процент износа', sectionCode: 'condition_wear', fieldType: 'NUMBER', unit: '%', sortOrder: 5 },
  { key: 'criticality', name: 'Категория критичности', sectionCode: 'condition_wear', fieldType: 'TEXT', sortOrder: 6 },
  { key: 'clean_room_class', name: 'Класс чистоты помещения (ISO)', sectionCode: 'condition_wear', fieldType: 'TEXT', sortOrder: 7 },
  { key: 'is_unique', name: 'Уникальное / единичное оборудование', sectionCode: 'condition_wear', fieldType: 'BOOLEAN', sortOrder: 8 },
  { key: 'is_imported', name: 'Импортное оборудование', sectionCode: 'condition_wear', fieldType: 'BOOLEAN', sortOrder: 9 },

  // 3. Maintenance regulations & schedule
  { key: 'maintenance_periodicity', name: 'Периодичность регламентного ТО', sectionCode: 'maintenance_regulations', fieldType: 'TEXT', sortOrder: 1 },
  { key: 'maintenance_schedule_year', name: 'Утвержденный график ТО на 2026 год', sectionCode: 'maintenance_regulations', fieldType: 'TEXT', sortOrder: 2 },
  { key: 'to_count_scheduled', name: 'Количество ТО по графику', sectionCode: 'maintenance_regulations', fieldType: 'NUMBER', sortOrder: 3 },
  { key: 'responsible_person_name', name: 'Ответственное лицо (ФИО / Должность)', sectionCode: 'maintenance_regulations', fieldType: 'TEXT', sortOrder: 4 },
  { key: 'external_system_id', name: 'Идентификатор во внешней системе (1С / ERP)', sectionCode: 'maintenance_regulations', fieldType: 'TEXT', sortOrder: 5 },

  // 4. Electrical parameters
  { key: 'operating_voltage', name: 'Рабочее напряжение', sectionCode: 'electrical', fieldType: 'TEXT', sortOrder: 1 },
  { key: 'power_kw', name: 'Номинальная мощность', sectionCode: 'electrical', fieldType: 'NUMBER', unit: 'кВт', sortOrder: 2 },
  { key: 'nominal_current', name: 'Номинальный ток', sectionCode: 'electrical', fieldType: 'NUMBER', unit: 'А', sortOrder: 3 },
  { key: 'phase_count', name: 'Количество фаз', sectionCode: 'electrical', fieldType: 'NUMBER', sortOrder: 4 },
  { key: 'ups_required', name: 'Требование к наличию ИБП', sectionCode: 'electrical', fieldType: 'TEXT', sortOrder: 5 },

  // 5. Mechanics, hydraulics & medium
  { key: 'operating_pressure', name: 'Рабочее давление', sectionCode: 'mechanics', fieldType: 'NUMBER', unit: 'МПа', sortOrder: 1 },
  { key: 'coolant_type', name: 'Тип смазки / хладагента', sectionCode: 'mechanics', fieldType: 'TEXT', sortOrder: 2 },
  { key: 'rotation_speed', name: 'Частота вращения вала', sectionCode: 'mechanics', fieldType: 'NUMBER', unit: 'об/мин', sortOrder: 3 },

  // 6. Operational requirements & metrology
  { key: 'is_critical_path', name: 'Влияет на непрерывность процесса', sectionCode: 'operational', fieldType: 'BOOLEAN', sortOrder: 1 },
  { key: 'calibration_interval', name: 'Периодичность поверки датчиков', sectionCode: 'operational', fieldType: 'NUMBER', unit: 'мес.', sortOrder: 2 },
] as const;

export const CustomFieldTypeSchema = z.enum([
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'SELECT',
  'BOOLEAN'
]);

export const CustomFieldDefinitionSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9_]+$/, 'Key must be snake_case alphanumeric'),
  name: z.string().min(1, 'Name is required'),
  fieldType: CustomFieldTypeSchema,
  unit: z.string().nullable().optional(),
  isRequired: z.boolean().optional().default(false),
  defaultValue: z.string().nullable().optional(),
  options: z.array(z.string()).nullable().optional(),
  sectionCode: z.string().nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export const CustomSectionDefinitionSchema = z.object({
  code: z.string().min(1, 'Code is required').regex(/^[a-z0-9_]+$/, 'Code must be snake_case alphanumeric'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  fields: z.array(CustomFieldDefinitionSchema).optional(),
});

export const CanonicalTechnicalSpecsSchema = z.object({
  // Classifiers
  decimal_number: z.string().optional().nullable(),
  okof_code: z.string().optional().nullable(),
  okpd2_code: z.string().optional().nullable(),
  process_classifier_code: z.string().optional().nullable(),
  equipment_group: z.string().optional().nullable(),
  equipment_type: z.string().optional().nullable(),

  // Condition & wear
  country_origin: z.string().optional().nullable(),
  prod_year: z.number().int().min(1900, 'Production year must be >= 1900').max(2100, 'Production year must be <= 2100').optional().nullable(),
  comm_year: z.number().int().min(1900, 'Commission year must be >= 1900').max(2100, 'Commission year must be <= 2100').optional().nullable(),
  equipment_age: z.number().nonnegative('Equipment age cannot be negative').optional().nullable(),
  actual_wear_percentage: z.number().min(0, 'Wear % must be >= 0').max(100, 'Wear % must be <= 100').optional().nullable(),
  criticality: z.enum(['A', 'B', 'C']).or(z.string()).optional().nullable(),
  clean_room_class: z.string().optional().nullable(),
  is_unique: z.boolean().optional().nullable(),
  is_imported: z.boolean().optional().nullable(),

  // Maintenance regulations
  maintenance_periodicity: z.string().optional().nullable(),
  maintenance_schedule_year: z.string().optional().nullable(),
  to_count_scheduled: z.number().int().nonnegative('TO count cannot be negative').optional().nullable(),
  responsible_person_name: z.string().optional().nullable(),
  external_system_id: z.string().optional().nullable(),

  // Electrical
  operating_voltage: z.string().optional().nullable(),
  power_kw: z.number().nonnegative('Power (kW) cannot be negative').optional().nullable(),
  nominal_current: z.number().nonnegative('Nominal current (A) cannot be negative').optional().nullable(),
  phase_count: z.number().int().positive('Phase count must be positive').optional().nullable(),
  ups_required: z.union([z.boolean(), z.string()]).optional().nullable(),

  // Mechanics
  operating_pressure: z.number().nonnegative('Operating pressure cannot be negative').optional().nullable(),
  coolant_type: z.string().optional().nullable(),
  rotation_speed: z.number().nonnegative('Rotation speed cannot be negative').optional().nullable(),

  // Operational
  is_critical_path: z.boolean().optional().nullable(),
  calibration_interval: z.number().nonnegative('Calibration interval cannot be negative').optional().nullable(),
}).passthrough().refine(
  (data) => {
    if (data.prod_year && data.comm_year) {
      return data.comm_year >= data.prod_year;
    }
    return true;
  },
  {
    message: 'Commission year cannot precede production year',
    path: ['comm_year'],
  }
);

export type CanonicalTechnicalSpecs = z.infer<typeof CanonicalTechnicalSpecsSchema>;

export const EquipmentPassportSchema = z.object({
  id: z.string().min(1, 'Equipment ID is required'),
  inventoryNumber: z.string().min(1, 'Inventory number is required'),
  name: z.string().min(1, 'Equipment name is required'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  initialCost: z.number().nonnegative('Initial cost cannot be negative'),
  lifespanYears: z.number().positive('Lifespan years must be strictly positive'),
  status: z.enum(['DRAFT', 'ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED']),
  serialNumber: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  commissionDate: z.union([z.string(), z.date()]).nullable().optional(),
  technicalSpecifications: z.record(z.string(), z.unknown()).optional().default({}),
});

export type EquipmentPassport = z.infer<typeof EquipmentPassportSchema>;

export interface TechnicalValidationResult {
  readonly isValid: boolean;
  readonly errors: { readonly field: string; readonly message: string }[];
  readonly validatedData: Record<string, unknown>;
}

export function validateTechnicalSpecifications(
  specs: Record<string, unknown>,
  definitions: readonly CustomFieldDefinition[] = CANONICAL_SPECS
): TechnicalValidationResult {
  const errors: { field: string; message: string }[] = [];
  const validatedData: Record<string, unknown> = {};

  const defMap = new Map<string, CustomFieldDefinition>(definitions.map((d) => [d.key, d]));

  for (const [key, value] of Object.entries(specs)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    const def = defMap.get(key);
    if (!def) {
      validatedData[key] = value;
      continue;
    }

    switch (def.fieldType) {
      case 'NUMBER': {
        const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.').replace(/[^0-9.-]/g, ''));
        if (Number.isNaN(num)) {
          errors.push({ field: key, message: `Field "${def.name}" must be a valid number` });
        } else {
          validatedData[key] = num;
        }
        break;
      }
      case 'BOOLEAN': {
        if (typeof value === 'boolean') {
          validatedData[key] = value;
        } else if (typeof value === 'string') {
          const lower = value.trim().toLowerCase();
          if (['true', '1', 'yes', 'да'].includes(lower)) {
            validatedData[key] = true;
          } else if (['false', '0', 'no', 'нет'].includes(lower)) {
            validatedData[key] = false;
          } else {
            errors.push({ field: key, message: `Field "${def.name}" must be a boolean` });
          }
        } else if (typeof value === 'number') {
          validatedData[key] = value !== 0;
        } else {
          errors.push({ field: key, message: `Field "${def.name}" must be a boolean` });
        }
        break;
      }
      case 'DATE': {
        const d = new Date(String(value));
        if (Number.isNaN(d.getTime())) {
          errors.push({ field: key, message: `Field "${def.name}" must be a valid date` });
        } else {
          validatedData[key] = d.toISOString();
        }
        break;
      }
      case 'SELECT': {
        const strVal = String(value);
        if (def.options && def.options.length > 0 && !def.options.includes(strVal)) {
          errors.push({ field: key, message: `Field "${def.name}" value must be one of: ${def.options.join(', ')}` });
        } else {
          validatedData[key] = strVal;
        }
        break;
      }
      case 'TEXT':
      case 'TEXTAREA':
      default: {
        validatedData[key] = String(value).trim();
        break;
      }
    }
  }

  // Check required fields
  for (const def of definitions) {
    if (def.isRequired) {
      const val = validatedData[def.key];
      if (val === undefined || val === null || val === '') {
        errors.push({ field: def.key, message: `Required field "${def.name}" is missing` });
      }
    }
  }

  // Canonical schema validation
  const parseResult = CanonicalTechnicalSpecsSchema.safeParse(validatedData);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      const field = issue.path.join('.') || 'technicalSpecifications';
      errors.push({ field, message: issue.message });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedData: parseResult.success ? parseResult.data : validatedData,
  };
}
