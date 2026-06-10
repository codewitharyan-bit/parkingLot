/**
 * Repository pattern for data persistence
 * In production, this would connect to a database (MongoDB, PostgreSQL, etc.)
 */

import { ParkingLot, ParkingTicket } from "../models";
import { v4 as uuidv4 } from "uuid";

/**
 * Interface for parking lot repository
 */
export interface IParkingLotRepository {
  save(parkingLot: ParkingLot): Promise<void>;
  findById(id: string): Promise<ParkingLot | null>;
  findAll(): Promise<ParkingLot[]>;
  update(parkingLot: ParkingLot): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Interface for parking ticket repository
 */
export interface IParkingTicketRepository {
  save(ticket: ParkingTicket): Promise<void>;
  findById(id: string): Promise<ParkingTicket | null>;
  findByVehicleId(vehicleId: string): Promise<ParkingTicket[]>;
  findAll(): Promise<ParkingTicket[]>;
  update(ticket: ParkingTicket): Promise<void>;
}

/**
 * In-memory implementation of parking lot repository
 * For testing and demonstration purposes
 */
export class InMemoryParkingLotRepository implements IParkingLotRepository {
  private store: Map<string, ParkingLot> = new Map();

  async save(parkingLot: ParkingLot): Promise<void> {
    this.store.set(parkingLot.id, parkingLot);
  }

  async findById(id: string): Promise<ParkingLot | null> {
    return this.store.get(id) || null;
  }

  async findAll(): Promise<ParkingLot[]> {
    return Array.from(this.store.values());
  }

  async update(parkingLot: ParkingLot): Promise<void> {
    if (!this.store.has(parkingLot.id)) {
      throw new Error(`Parking lot with id ${parkingLot.id} not found`);
    }
    this.store.set(parkingLot.id, parkingLot);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

/**
 * In-memory implementation of parking ticket repository
 * For testing and demonstration purposes
 */
export class InMemoryParkingTicketRepository implements IParkingTicketRepository {
  private store: Map<string, ParkingTicket> = new Map();

  async save(ticket: ParkingTicket): Promise<void> {
    this.store.set(ticket.id, ticket);
  }

  async findById(id: string): Promise<ParkingTicket | null> {
    return this.store.get(id) || null;
  }

  async findByVehicleId(vehicleId: string): Promise<ParkingTicket[]> {
    return Array.from(this.store.values()).filter(
      (ticket) => ticket.vehicle.id === vehicleId
    );
  }

  async findAll(): Promise<ParkingTicket[]> {
    return Array.from(this.store.values());
  }

  async update(ticket: ParkingTicket): Promise<void> {
    if (!this.store.has(ticket.id)) {
      throw new Error(`Ticket with id ${ticket.id} not found`);
    }
    this.store.set(ticket.id, ticket);
  }
}

/**
 * Base repository with audit logging
 */
export abstract class AuditedRepository {
  protected auditLog: Array<{
    timestamp: Date;
    operation: string;
    entityId: string;
    details: any;
  }> = [];

  protected logAudit(
    operation: string,
    entityId: string,
    details: any = {}
  ): void {
    this.auditLog.push({
      timestamp: new Date(),
      operation,
      entityId,
      details
    });
  }

  getAuditLog(): any[] {
    return [...this.auditLog];
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }
}

/**
 * Audited parking ticket repository
 */
export class AuditedParkingTicketRepository
  extends AuditedRepository
  implements IParkingTicketRepository
{
  private store: Map<string, ParkingTicket> = new Map();

  async save(ticket: ParkingTicket): Promise<void> {
    this.store.set(ticket.id, ticket);
    this.logAudit("CREATE", ticket.id, {
      licensePlate: ticket.vehicle.licensePlate,
      spot: ticket.parkingSpot.spotNumber
    });
  }

  async findById(id: string): Promise<ParkingTicket | null> {
    return this.store.get(id) || null;
  }

  async findByVehicleId(vehicleId: string): Promise<ParkingTicket[]> {
    return Array.from(this.store.values()).filter(
      (ticket) => ticket.vehicle.id === vehicleId
    );
  }

  async findAll(): Promise<ParkingTicket[]> {
    return Array.from(this.store.values());
  }

  async update(ticket: ParkingTicket): Promise<void> {
    if (!this.store.has(ticket.id)) {
      throw new Error(`Ticket with id ${ticket.id} not found`);
    }
    this.store.set(ticket.id, ticket);
    this.logAudit("UPDATE", ticket.id, {
      status: ticket.status,
      fee: ticket.totalFee
    });
  }
}
