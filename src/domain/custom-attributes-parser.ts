/**
 * Custom Attributes Parser & Normalizer for Equipment Passports
 * Handles legacy transliterated Russian keys, base model property extraction,
 * and canonical schema normalization.
 */

export const DUPLICATE_TO_CANONICAL: Readonly<Record<string, string>> = Object.freeze({
  kod_okof_2: 'okof_code',
  kod_po_okof_ok_013_2014: 'okof_code',
  kod_po_okof: 'okof_code',
  okof: 'okof_code',
  kod_okpd_2: 'okpd2_code',
  kod_po_okpd2_ok_034_2014: 'okpd2_code',
  kod_po_okpd2: 'okpd2_code',
  okpd2: 'okpd2_code',
  kod_tehnologicheskogo_klassifikatora: 'process_classifier_code',
  klassifikator_tehprotsessa_kod: 'process_classifier_code',
  klassifikator_tehprotsessa: 'process_classifier_code',
  tehnologicheskiy_klassifikator: 'process_classifier_code',
  detsimalnyy_nomer: 'decimal_number',
  detsimalnyy_no: 'decimal_number',
  gruppa_oborudovaniya: 'equipment_group',
  kompleks_gruppa: 'equipment_group',
  kompleks: 'equipment_group',
  tip_oborudovaniya_ustanovka: 'equipment_type',
  tip_oborudovaniya: 'equipment_type',
  ustanovka: 'equipment_type',
  kategoriya_kritichnosti: 'criticality',
  kritichnost: 'criticality',
  fakticheskiy_protsent_iznosa: 'actual_wear_percentage',
  fakticheskiy_iznos: 'actual_wear_percentage',
  protsent_iznosa: 'actual_wear_percentage',
  iznos: 'actual_wear_percentage',
  klass_chistoty_pomescheniya_iso: 'clean_room_class',
  klass_chistoty_pomescheniya: 'clean_room_class',
  klass_chistoty_iso: 'clean_room_class',
  klass_chistoty: 'clean_room_class',
  unikalnoe_edinichnoe_oborudovanie: 'is_unique',
  unikalnoe_oborudovanie: 'is_unique',
  unikal_noe_oborudovanie: 'is_unique',
  priznak_unikalnosti: 'is_unique',
  importnoe_oborudovanie: 'is_imported',
  import_noe_oborudovanie: 'is_imported',
  priznak_importa: 'is_imported',
  strana_proizvoditel: 'country_origin',
  strana_proishozhdeniya: 'country_origin',
  strana: 'country_origin',
  god_vypuska: 'prod_year',
  god_proizvodstva: 'prod_year',
  god_vvoda: 'comm_year',
  god_vvoda_v_ekspluatatsiyu: 'comm_year',
  vozrast_oborudovaniya: 'equipment_age',
  vozrast: 'equipment_age',
  periodichnost_reglamentnogo_to: 'maintenance_periodicity',
  periodichnost_tehnicheskogo_obsluzhivaniya: 'maintenance_periodicity',
  periodichnost_to: 'maintenance_periodicity',
  reglament_to: 'maintenance_periodicity',
  utverzhdennyy_grafik_to_na_2026_god: 'maintenance_schedule_year',
  tehnicheskoe_obsluzhivanie_2026: 'maintenance_schedule_year',
  utverzhdennyy_grafik_to: 'maintenance_schedule_year',
  grafik_to_na_2026_god: 'maintenance_schedule_year',
  grafik_to: 'maintenance_schedule_year',
  kolichestvo_to_po_grafiku: 'to_count_scheduled',
  kol_vo_to_po_grafiku: 'to_count_scheduled',
  kolichestvo_to: 'to_count_scheduled',
  otvetstvennoe_litso_fio_dolzhnost: 'responsible_person_name',
  otvetstvennyy: 'responsible_person_name',
  otvetstvennoe_litso: 'responsible_person_name',
  fio_otvetstvennogo: 'responsible_person_name',
  identifikator_vo_vneshney_sisteme_1s_erp: 'external_system_id',
  identifikator_vo_vneshney_sisteme: 'external_system_id',
  kod_1s_erp: 'external_system_id',
  kod_1s: 'external_system_id',
  rabochee_napryazhenie: 'operating_voltage',
  napryazhenie_pitaniya: 'operating_voltage',
  napryazhenie: 'operating_voltage',
  nominalnaya_moschnost: 'power_kw',
  moschnost: 'power_kw',
  nominalnyy_tok: 'nominal_current',
  tok: 'nominal_current',
  kolichestvo_faz: 'phase_count',
  faznost: 'phase_count',
  trebovanie_k_nalichiyu_ibp: 'ups_required',
  nalichie_ibp: 'ups_required',
  ibp: 'ups_required',
  rabochee_davlenie: 'operating_pressure',
  davlenie: 'operating_pressure',
  tip_smazki_hladagenta: 'coolant_type',
  tip_smazki: 'coolant_type',
  hladagent: 'coolant_type',
  smazka: 'coolant_type',
  chastota_vrascheniya_vala: 'rotation_speed',
  chastota_vrascheniya: 'rotation_speed',
  skorost_vrascheniya: 'rotation_speed',
  oboroty: 'rotation_speed',
  vliyaet_na_nepreryvnost_protsessa: 'is_critical_path',
  nepreryvnost_protsessa: 'is_critical_path',
  periodichnost_poverki_datchikov: 'calibration_interval',
  poverka_datchikov: 'calibration_interval',
  interval_poverki: 'calibration_interval',
});

export const BASE_MODEL_DUPLICATE_KEYS: ReadonlySet<string> = new Set([
  'zavodskoy_nomer',
  'zavodskoy_no',
  'zavodskoy_num',
  'serial_number',
  'serialnumber',
  'raspolozhenie_ulitsa_korpus_etazh_uchastok',
  'raspolozhenie',
  'location',
  'mesto_ustanovki',
  'inventarnyy_nomer',
  'inventarnyy_no',
  'inventory_number',
  'inventorynumber',
  'naimenovanie_oborudovaniya',
  'naimenovanie',
  'name',
  'proizvoditel',
  'manufacturer',
  'model_modifikatsiya',
  'model',
  'data_vvoda_v_ekspluatatsiyu',
  'data_vvoda',
  'commission_date',
]);

const KNOWN_NUMBER_KEYS: ReadonlySet<string> = new Set([
  'prod_year',
  'comm_year',
  'equipment_age',
  'actual_wear_percentage',
  'to_count_scheduled',
  'power_kw',
  'nominal_current',
  'phase_count',
  'operating_pressure',
  'rotation_speed',
  'calibration_interval',
]);

const KNOWN_BOOLEAN_KEYS: ReadonlySet<string> = new Set([
  'is_unique',
  'is_imported',
  'is_critical_path',
]);

export interface ExtractedBaseFields {
  serialNumber?: string;
  location?: string;
  inventoryNumber?: string;
  name?: string;
  manufacturer?: string;
  model?: string;
  commissionDate?: string;
}

export interface ParsedCustomAttributesResult {
  readonly canonicalAttributes: Record<string, unknown>;
  readonly extractedBaseFields: ExtractedBaseFields;
  readonly ignoredKeys: readonly string[];
}

export interface ParseCustomAttributesOptions {
  readonly retainUnknownKeys?: boolean;
}

function coerceValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (KNOWN_BOOLEAN_KEYS.has(key)) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const lower = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'да'].includes(lower)) return true;
      if (['false', '0', 'no', 'нет'].includes(lower)) return false;
    }
  }

  if (KNOWN_NUMBER_KEYS.has(key)) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.trim().replace(',', '.').replace(/[^0-9.-]/g, '').trim();
      if (cleaned !== '') {
        const parsed = Number(cleaned);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
}

export function parseEquipmentCustomAttributes(
  rawInput: Record<string, unknown>,
  options: ParseCustomAttributesOptions = {}
): ParsedCustomAttributesResult {
  const retainUnknownKeys = options.retainUnknownKeys ?? true;
  const canonicalAttributes: Record<string, unknown> = {};
  const extractedBaseFields: ExtractedBaseFields = {};
  const ignoredKeys: string[] = [];

  for (const [rawKey, rawValue] of Object.entries(rawInput)) {
    const key = rawKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // 1. Check if key is a base model duplicate
    if (BASE_MODEL_DUPLICATE_KEYS.has(key)) {
      ignoredKeys.push(rawKey);

      const strVal = rawValue !== null && rawValue !== undefined ? String(rawValue).trim() : '';
      if (strVal) {
        if (['zavodskoy_nomer', 'zavodskoy_no', 'zavodskoy_num', 'serial_number', 'serialnumber'].includes(key)) {
          extractedBaseFields.serialNumber ??= strVal;
        } else if (['raspolozhenie_ulitsa_korpus_etazh_uchastok', 'raspolozhenie', 'location', 'mesto_ustanovki'].includes(key)) {
          extractedBaseFields.location ??= strVal;
        } else if (['inventarnyy_nomer', 'inventarnyy_no', 'inventory_number', 'inventorynumber'].includes(key)) {
          extractedBaseFields.inventoryNumber ??= strVal;
        } else if (['naimenovanie_oborudovaniya', 'naimenovanie', 'name'].includes(key)) {
          extractedBaseFields.name ??= strVal;
        } else if (['proizvoditel', 'manufacturer'].includes(key)) {
          extractedBaseFields.manufacturer ??= strVal;
        } else if (['model_modifikatsiya', 'model'].includes(key)) {
          extractedBaseFields.model ??= strVal;
        } else if (['data_vvoda_v_ekspluatatsiyu', 'data_vvoda', 'commission_date'].includes(key)) {
          extractedBaseFields.commissionDate ??= strVal;
        }
      }
      continue;
    }

    // 2. Map old/duplicate transliterated keys to canonical keys
    const canonicalKey = DUPLICATE_TO_CANONICAL[key] || key;

    const coerced = coerceValue(canonicalKey, rawValue);
    if (coerced === undefined) {
      continue;
    }

    // If canonicalKey is a known canonical key, or if retainUnknownKeys is true
    if (DUPLICATE_TO_CANONICAL[key] || retainUnknownKeys) {
      if (canonicalAttributes[canonicalKey] === undefined) {
        canonicalAttributes[canonicalKey] = coerced;
      }
    } else {
      ignoredKeys.push(rawKey);
    }
  }

  return {
    canonicalAttributes,
    extractedBaseFields,
    ignoredKeys,
  };
}

export function normalizeEquipmentAttributes(rawInput: Record<string, unknown>): Record<string, unknown> {
  const result = parseEquipmentCustomAttributes(rawInput);
  return result.canonicalAttributes;
}
