import { describe, it, expect } from 'vitest';
import {
  parseEquipmentCustomAttributes,
  normalizeEquipmentAttributes,
  DUPLICATE_TO_CANONICAL,
  BASE_MODEL_DUPLICATE_KEYS,
} from './custom-attributes-parser.js';

describe('Custom Attributes Parser & Normalizer', () => {
  it('maps legacy transliterated Russian keys to canonical English keys', () => {
    const raw = {
      kod_po_okof_ok_013_2014: '330.28.29',
      kod_okpd_2: '28.29.39',
      detsimalnyy_nomer: 'ДЕЦ.994.001',
      gruppa_oborudovaniya: 'Станочный парк',
      tip_oborudovaniya: 'Фрезерный станок',
      kategoriya_kritichnosti: 'A',
      fakticheskiy_protsent_iznosa: '45%',
      klass_chistoty_pomescheniya_iso: 'ISO 7',
      unikalnoe_edinichnoe_oborudovanie: 'да',
      importnoe_oborudovanie: 'нет',
      strana_proizvoditel: 'Германия',
      god_vypuska: '2021',
      god_vvoda: '2022',
      vozrast_oborudovaniya: '4',
      periodichnost_reglamentnogo_to: 'Раз в месяц',
      utverzhdennyy_grafik_to_na_2026_god: 'График утвержден',
      kolichestvo_to_po_grafiku: '12',
      otvetstvennoe_litso_fio_dolzhnost: 'Иванов И.И., Главный механик',
      identifikator_vo_vneshney_sisteme_1s_erp: '1C-EQ-8832',
      rabochee_napryazhenie: '380 В',
      nominalnaya_moschnost: '18,5 кВт',
      nominalnyy_tok: '35 А',
      kolichestvo_faz: '3',
      trebovanie_k_nalichiyu_ibp: 'Да',
      rabochee_davlenie: '1,6 МПа',
      tip_smazki_hladagenta: 'Mobil DTE 25',
      chastota_vrascheniya_vala: '3000 об/мин',
      vliyaet_na_nepreryvnost_protsessa: '1',
      periodichnost_poverki_datchikov: '6',
    };

    const result = parseEquipmentCustomAttributes(raw);
    const attrs = result.canonicalAttributes;

    expect(attrs.okof_code).toBe('330.28.29');
    expect(attrs.okpd2_code).toBe('28.29.39');
    expect(attrs.decimal_number).toBe('ДЕЦ.994.001');
    expect(attrs.equipment_group).toBe('Станочный парк');
    expect(attrs.equipment_type).toBe('Фрезерный станок');
    expect(attrs.criticality).toBe('A');
    expect(attrs.actual_wear_percentage).toBe(45);
    expect(attrs.clean_room_class).toBe('ISO 7');
    expect(attrs.is_unique).toBe(true);
    expect(attrs.is_imported).toBe(false);
    expect(attrs.country_origin).toBe('Германия');
    expect(attrs.prod_year).toBe(2021);
    expect(attrs.comm_year).toBe(2022);
    expect(attrs.equipment_age).toBe(4);
    expect(attrs.to_count_scheduled).toBe(12);
    expect(attrs.power_kw).toBe(18.5);
    expect(attrs.nominal_current).toBe(35);
    expect(attrs.phase_count).toBe(3);
    expect(attrs.operating_pressure).toBe(1.6);
    expect(attrs.rotation_speed).toBe(3000);
    expect(attrs.is_critical_path).toBe(true);
    expect(attrs.calibration_interval).toBe(6);
  });

  it('extracts base model fields and strips them from custom attributes', () => {
    const raw = {
      naimenovanie_oborudovaniya: 'Насос высокого давления',
      inventarnyy_nomer: 'INV-PUMP-900',
      zavodskoy_nomer: 'SN-778811',
      proizvoditel: 'Grundfos',
      model_modifikatsiya: 'CR 15-7',
      raspolozhenie_ulitsa_korpus_etazh_uchastok: 'Корпус 2, Насосная станция',
      data_vvoda_v_ekspluatatsiyu: '2024-05-10',
      operating_pressure: 25,
    };

    const result = parseEquipmentCustomAttributes(raw);

    // Extracted base fields
    expect(result.extractedBaseFields.name).toBe('Насос высокого давления');
    expect(result.extractedBaseFields.inventoryNumber).toBe('INV-PUMP-900');
    expect(result.extractedBaseFields.serialNumber).toBe('SN-778811');
    expect(result.extractedBaseFields.manufacturer).toBe('Grundfos');
    expect(result.extractedBaseFields.model).toBe('CR 15-7');
    expect(result.extractedBaseFields.location).toBe('Корпус 2, Насосная станция');
    expect(result.extractedBaseFields.commissionDate).toBe('2024-05-10');

    // Stripped from custom attributes
    expect(result.canonicalAttributes.naimenovanie_oborudovaniya).toBeUndefined();
    expect(result.canonicalAttributes.zavodskoy_nomer).toBeUndefined();
    expect(result.canonicalAttributes.operating_pressure).toBe(25);
    expect(result.ignoredKeys.length).toBe(7);
  });

  it('normalizes boolean and number coercions across variations', () => {
    const input = {
      is_unique: 'yes',
      is_imported: 'false',
      is_critical_path: 0,
      power_kw: '75',
      actual_wear_percentage: '12.5',
    };

    const normalized = normalizeEquipmentAttributes(input);
    expect(normalized.is_unique).toBe(true);
    expect(normalized.is_imported).toBe(false);
    expect(normalized.is_critical_path).toBe(false);
    expect(normalized.power_kw).toBe(75);
    expect(normalized.actual_wear_percentage).toBe(12.5);
  });

  it('filters empty strings and nullish values', () => {
    const input = {
      decimal_number: '',
      okof_code: null,
      notes: undefined,
      power_kw: 15,
    };

    const normalized = normalizeEquipmentAttributes(input);
    expect(normalized.decimal_number).toBeUndefined();
    expect(normalized.okof_code).toBeUndefined();
    expect(normalized.power_kw).toBe(15);
  });
});
