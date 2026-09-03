import {
  CustomFieldDefinition,
  validateTechnicalSpecifications,
} from './technical-specifications.js';
import {
  parseEquipmentCustomAttributes,
} from './custom-attributes-parser.js';
import {
  formatEquipmentQrPayload,
  generateEquipmentQrSvg,
  generateEquipmentThermalLabelSvg,
  EquipmentQrSvgOptions,
} from './equipment-qr-generator.js';

export type EquipmentStatus = 'DRAFT' | 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export interface EquipmentProps {
  id: string;
  inventoryNumber: string;
  name: string;
  category: string;
  location: string;
  initialCost: number;
  lifespanYears: number;
  status: EquipmentStatus;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  commissionDate?: string | null;
  technicalSpecifications?: Record<string, unknown>;
}

export interface OutboxRecord {
  id: string;
  aggregateType: 'Equipment';
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
  published: boolean;
}

export class EquipmentAggregate {
  private _props: EquipmentProps;
  private _outbox: OutboxRecord[] = [];

  constructor(props: EquipmentProps) {
    this._props = {
      ...props,
      technicalSpecifications: { ...(props.technicalSpecifications || {}) },
    };
  }

  static create(props: Omit<EquipmentProps, 'status'>): EquipmentAggregate {
    const aggregate = new EquipmentAggregate({
      ...props,
      status: 'DRAFT',
    });

    aggregate.recordOutboxEvent('eps.equipment.created', {
      equipmentId: props.id,
      inventoryNumber: props.inventoryNumber,
      name: props.name,
      location: props.location,
    });

    return aggregate;
  }

  get props(): Readonly<EquipmentProps> {
    return Object.freeze({ ...this._props });
  }

  get outboxEvents(): readonly OutboxRecord[] {
    return this._outbox;
  }

  activate(): void {
    if (this._props.status === 'DECOMMISSIONED') {
      throw new Error('Cannot activate decommissioned equipment');
    }
    this._props.status = 'ACTIVE';
    this.recordOutboxEvent('eps.equipment.activated', {
      equipmentId: this._props.id,
      status: 'ACTIVE',
    });
  }

  sendToMaintenance(reason: string): void {
    if (this._props.status !== 'ACTIVE') {
      throw new Error('Equipment must be ACTIVE to enter MAINTENANCE');
    }
    this._props.status = 'MAINTENANCE';
    this.recordOutboxEvent('eps.equipment.maintenance_started', {
      equipmentId: this._props.id,
      reason,
    });
  }

  decommission(reason: string): void {
    this._props.status = 'DECOMMISSIONED';
    this.recordOutboxEvent('eps.equipment.decommissioned', {
      equipmentId: this._props.id,
      reason,
    });
  }

  updateDetails(details: Partial<Pick<EquipmentProps, 'name' | 'location' | 'category' | 'manufacturer' | 'model' | 'serialNumber' | 'commissionDate'>>): void {
    if (this._props.status === 'DECOMMISSIONED') {
      throw new Error('Cannot update decommissioned equipment');
    }

    Object.assign(this._props, details);
    this.recordOutboxEvent('eps.equipment.updated', {
      equipmentId: this._props.id,
      updatedFields: details,
    });
  }

  updateTechnicalSpecifications(
    specs: Record<string, unknown>,
    customDefs?: readonly CustomFieldDefinition[]
  ): void {
    if (this._props.status === 'DECOMMISSIONED') {
      throw new Error('Cannot update technical specifications for decommissioned equipment');
    }

    const validation = validateTechnicalSpecifications(specs, customDefs);
    if (!validation.isValid) {
      const errorMsg = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`Technical specifications validation failed: ${errorMsg}`);
    }

    this._props.technicalSpecifications = {
      ...(this._props.technicalSpecifications || {}),
      ...validation.validatedData,
    };

    this.recordOutboxEvent('eps.equipment.technical_specs_updated', {
      equipmentId: this._props.id,
      technicalSpecifications: this._props.technicalSpecifications,
    });
  }

  importCustomAttributes(rawInput: Record<string, unknown>): void {
    const parsed = parseEquipmentCustomAttributes(rawInput);

    if (parsed.extractedBaseFields.serialNumber && !this._props.serialNumber) {
      this._props.serialNumber = parsed.extractedBaseFields.serialNumber;
    }
    if (parsed.extractedBaseFields.location && !this._props.location) {
      this._props.location = parsed.extractedBaseFields.location;
    }
    if (parsed.extractedBaseFields.manufacturer && !this._props.manufacturer) {
      this._props.manufacturer = parsed.extractedBaseFields.manufacturer;
    }
    if (parsed.extractedBaseFields.model && !this._props.model) {
      this._props.model = parsed.extractedBaseFields.model;
    }
    if (parsed.extractedBaseFields.commissionDate && !this._props.commissionDate) {
      this._props.commissionDate = parsed.extractedBaseFields.commissionDate;
    }

    this.updateTechnicalSpecifications(parsed.canonicalAttributes);
  }

  generateQrPayload(baseUrl?: string, format: 'uri' | 'json' = 'uri'): string {
    return formatEquipmentQrPayload({
      equipmentId: this._props.id,
      inventoryNumber: this._props.inventoryNumber,
      serialNumber: this._props.serialNumber || undefined,
      name: this._props.name,
      baseUrl,
      format,
    });
  }

  generateQrSvg(options?: EquipmentQrSvgOptions): string {
    const payload = this.generateQrPayload();
    return generateEquipmentQrSvg(payload, options);
  }

  generateThermalLabelSvg(format: '58mm' | '80mm' = '58mm', baseUrl?: string): string {
    return generateEquipmentThermalLabelSvg({
      equipmentId: this._props.id,
      inventoryNumber: this._props.inventoryNumber,
      name: this._props.name,
      serialNumber: this._props.serialNumber || undefined,
      location: this._props.location,
      labelFormat: format,
      baseUrl,
    });
  }

  clearOutbox(): void {
    this._outbox = [];
  }

  private recordOutboxEvent(eventType: string, payload: Record<string, unknown>): void {
    this._outbox.push({
      id: crypto.randomUUID(),
      aggregateType: 'Equipment',
      aggregateId: this._props.id,
      eventType,
      payload,
      createdAt: new Date().toISOString(),
      published: false,
    });
  }
}
