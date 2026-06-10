/**
 * Main ParkingLotManager service for managing parking operations
 */

import {
  ParkingLot,
  ParkingFloor,
  ParkingSpot,
  Vehicle,
  ParkingTicket
} from "../models";
import {
  VehicleSize,
  VehicleType,
  ParkingLotLevel,
  TicketStatus
} from "../enums";
import { ParkingRateManager } from "../config/ParkingRateManager";
import { SpotAllocationStrategy, NearestSpotStrategy } from "./SpotAllocationStrategy";
import { ReadWriteLock, Mutex } from "../utils/ConcurrencyUtils";

/**
 * Main service for managing parking lot operations
 * Handles vehicle entry, exit, fee calculation, and spot management
 */
export class ParkingLotManager {
  private parkingLot: ParkingLot;
  private rateManager: ParkingRateManager;
  private allocationStrategy: SpotAllocationStrategy;
  private activeTickets: Map<string, ParkingTicket>; // vehicleId -> Ticket
  private completedTickets: ParkingTicket[];

  // Concurrency control
  private spotsLock: ReadWriteLock;
  private ticketsLock: Mutex;
  private spotAllocationLock: Mutex;

  constructor(
    parkingLot: ParkingLot,
    allocationStrategy: SpotAllocationStrategy = new NearestSpotStrategy()
  ) {
    this.parkingLot = parkingLot;
    this.rateManager = new ParkingRateManager();
    this.allocationStrategy = allocationStrategy;
    this.activeTickets = new Map();
    this.completedTickets = [];

    this.spotsLock = new ReadWriteLock();
    this.ticketsLock = new Mutex();
    this.spotAllocationLock = new Mutex();
  }

  /**
   * Initialize parking lot with floors and spots
   */
  initializeParkingLot(floorCount: number = 6, spotsPerFloor: number = 100): void {
    for (let i = 0; i < floorCount; i++) {
      const floor = new ParkingFloor(i as ParkingLotLevel, spotsPerFloor);

      // Add spots with varied sizes
      this.addSpotsToFloor(floor, spotsPerFloor);
      this.parkingLot.addFloor(floor);
    }
  }

  private addSpotsToFloor(floor: ParkingFloor, count: number): void {
    const sizeDistribution: Record<VehicleSize, number> = {
      [VehicleSize.MOTORCYCLE]: Math.floor(count * 0.15),
      [VehicleSize.COMPACT]: Math.floor(count * 0.25),
      [VehicleSize.SEDAN]: Math.floor(count * 0.35),
      [VehicleSize.SUV]: Math.floor(count * 0.15),
      [VehicleSize.BUS]: Math.floor(count * 0.1)
    };

    let spotNumber = 1;
    for (const [size, quantity] of Object.entries(sizeDistribution)) {
      for (let i = 0; i < quantity; i++) {
        const spot = new ParkingSpot(
          `${floor.floor}-${spotNumber}`,
          floor.floor as ParkingLotLevel,
          size as VehicleSize
        );
        floor.addSpot(spot);
        spotNumber++;
      }
    }
  }

  /**
   * Vehicle entry - allocate parking spot
   * Thread-safe operation with concurrency handling
   */
  async vehicleEntry(
    licensePlate: string,
    vehicleType: VehicleType,
    vehicleSize: VehicleSize
  ): Promise<ParkingTicket> {
    return this.spotAllocationLock.runExclusive(async () => {
      return this.spotsLock.runExclusiveWrite(async () => {
        // Create vehicle entity
        const vehicle = new Vehicle(licensePlate, vehicleType, vehicleSize);

        // Find available spot using allocation strategy
        const spot = this.allocationStrategy.findSpot(
          this.parkingLot.floors,
          vehicleSize
        );

        if (!spot) {
          throw new Error(
            `No available parking spot for vehicle size: ${vehicleSize}`
          );
        }

        // Create ticket
        const ticket = new ParkingTicket(vehicle, spot);

        // Occupy the spot
        spot.occupy(vehicle);

        // Store active ticket
        await this.ticketsLock.runExclusive(async () => {
          this.activeTickets.set(vehicle.id, ticket);
        });

        return ticket;
      });
    });
  }

  /**
   * Vehicle exit - calculate fee and release spot
   * Thread-safe operation with concurrency handling
   */
  async vehicleExit(vehicleId: string): Promise<{
    ticket: ParkingTicket;
    totalFee: number;
  }> {
    return this.spotsLock.runExclusiveWrite(async () => {
      return this.ticketsLock.runExclusive(async () => {
        const ticket = this.activeTickets.get(vehicleId);
        if (!ticket) {
          throw new Error(`No active ticket found for vehicle: ${vehicleId}`);
        }

        // Record exit time
        ticket.vehicle.exitTime = new Date();
        ticket.exitTime = new Date();

        // Calculate fee
        const durationInMinutes = ticket.getDurationInMinutes();
        const fee = this.rateManager.calculateFeeWithDiscount(
          durationInMinutes,
          ticket.vehicle.vehicleType
        );

        // Mark ticket as paid
        ticket.markAsPaid(fee);

        // Release the parking spot
        ticket.parkingSpot.vacate();

        // Move ticket from active to completed
        this.activeTickets.delete(vehicleId);
        this.completedTickets.push(ticket);

        return {
          ticket,
          totalFee: fee
        };
      });
    });
  }

  /**
   * Get current parking lot status
   */
  async getParkingLotStatus(): Promise<{
    totalSpots: number;
    availableSpots: number;
    occupiedSpots: number;
    occupancyRate: number;
    activeVehicles: number;
  }> {
    return this.spotsLock.runSharedRead(async () => {
      const totalSpots = this.parkingLot.getTotalSpots();
      const availableSpots = this.parkingLot.getTotalAvailableSpots();
      const occupiedSpots = this.parkingLot.getTotalOccupiedSpots();

      return {
        totalSpots,
        availableSpots,
        occupiedSpots,
        occupancyRate: (occupiedSpots / totalSpots) * 100,
        activeVehicles: this.activeTickets.size
      };
    });
  }

  /**
   * Get floor status
   */
  async getFloorStatus(floorLevel: ParkingLotLevel): Promise<{
    floor: ParkingLotLevel;
    totalSpots: number;
    availableSpots: number;
    occupiedSpots: number;
  }> {
    return this.spotsLock.runSharedRead(async () => {
      const floor = this.parkingLot.getFloor(floorLevel);
      if (!floor) {
        throw new Error(`Floor ${floorLevel} not found`);
      }

      return {
        floor: floorLevel,
        totalSpots: floor.spots.size,
        availableSpots: floor.getAvailableSpotCount(),
        occupiedSpots: floor.getOccupiedSpotCount()
      };
    });
  }

  /**
   * Get active ticket for a vehicle
   */
  async getActiveTicket(vehicleId: string): Promise<ParkingTicket | undefined> {
    return this.spotsLock.runSharedRead(async () => {
      return this.activeTickets.get(vehicleId);
    });
  }

  /**
   * Get all completed transactions
   */
  async getCompletedTransactions(): Promise<ParkingTicket[]> {
    return this.spotsLock.runSharedRead(async () => {
      return [...this.completedTickets];
    });
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    averageFee: number;
  }> {
    return this.spotsLock.runSharedRead(async () => {
      const totalTransactions = this.completedTickets.length;
      const totalRevenue = this.completedTickets.reduce(
        (sum, ticket) => sum + ticket.totalFee,
        0
      );
      const averageFee = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      return {
        totalTransactions,
        totalRevenue,
        averageFee
      };
    });
  }

  /**
   * Set parking rate for a vehicle type
   */
  setRate(vehicleType: VehicleType, rate: any): void {
    this.rateManager.setRate(vehicleType, rate);
  }

  /**
   * Change allocation strategy
   */
  setAllocationStrategy(strategy: SpotAllocationStrategy): void {
    this.allocationStrategy = strategy;
  }

  /**
   * Get parking lot information
   */
  getParkingLotInfo(): {
    id: string;
    name: string;
    companyName: string;
    location: string;
  } {
    return {
      id: this.parkingLot.id,
      name: this.parkingLot.name,
      companyName: this.parkingLot.companyName,
      location: this.parkingLot.location
    };
  }
}
