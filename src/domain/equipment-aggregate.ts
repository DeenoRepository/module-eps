import { DomainEventEnvelope } from '@deenorepository/contracts';

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
    this._props = { ...props };
  }

  static create(props: Omit<EquipmentProps, 'status'>): EquipmentAggregate {
    const aggregate = new EquipmentAggregate({
      ...props,
      status: 'DRAFT'
    });

    aggregate.recordOutboxEvent('eps.equipment.created', {
      equipmentId: props.id,
      inventoryNumber: props.inventoryNumber,
      name: props.name,
      location: props.location
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
      status: 'ACTIVE'
    });
  }

  sendToMaintenance(reason: string): void {
    if (this._props.status !== 'ACTIVE') {
      throw new Error('Equipment must be ACTIVE to enter MAINTENANCE');
    }
    this._props.status = 'MAINTENANCE';
    this.recordOutboxEvent('eps.equipment.maintenance_started', {
      equipmentId: this._props.id,
      reason
    });
  }

  decommission(reason: string): void {
    this._props.status = 'DECOMMISSIONED';
    this.recordOutboxEvent('eps.equipment.decommissioned', {
      equipmentId: this._props.id,
      reason
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
      published: false
    });
  }
}
