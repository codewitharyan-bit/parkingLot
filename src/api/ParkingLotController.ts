/**
 * API Controller for parking lot operations
 * Demonstrates request/response handling
 */

import { ParkingLotManager } from "../services/ParkingLotManager";
import { VehicleType, VehicleSize, ParkingLotLevel } from "../enums";
import { SpotAllocationStrategy } from "../services/SpotAllocationStrategy";

/**
 * Request/Response DTOs
 */
export interface VehicleEntryRequest {
  licensePlate: string;
  vehicleType: VehicleType;
  vehicleSize: VehicleSize;
}

export interface VehicleExitRequest {
  vehicleId: string;
}

export interface ParkingLotStatusResponse {
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
  occupancyRate: number;
  activeVehicles: number;
}

export interface VehicleEntryResponse {
  ticketId: string;
  vehicleId: string;
  licensePlate: string;
  spotNumber: string;
  floor: number;
  entryTime: string;
  message: string;
}

export interface VehicleExitResponse {
  ticketId: string;
  vehicleId: string;
  licensePlate: string;
  duration: string;
  totalFee: number;
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
}

/**
 * Parking Lot API Controller
 */
export class ParkingLotController {
  constructor(private parkingLotManager: ParkingLotManager) {}

  /**
   * Handle vehicle entry request
   */
  async handleVehicleEntry(
    request: VehicleEntryRequest
  ): Promise<VehicleEntryResponse> {
    try {
      const ticket = await this.parkingLotManager.vehicleEntry(
        request.licensePlate,
        request.vehicleType,
        request.vehicleSize
      );

      return {
        ticketId: ticket.id,
        vehicleId: ticket.vehicle.id,
        licensePlate: ticket.vehicle.licensePlate,
        spotNumber: ticket.parkingSpot.spotNumber,
        floor: ticket.parkingSpot.floor,
        entryTime: ticket.entryTime.toISOString(),
        message: `Vehicle ${request.licensePlate} parked successfully at spot ${ticket.parkingSpot.spotNumber}`
      };
    } catch (error) {
      throw {
        error: "VEHICLE_ENTRY_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle vehicle exit request
   */
  async handleVehicleExit(
    request: VehicleExitRequest
  ): Promise<VehicleExitResponse> {
    try {
      const { ticket, totalFee } =
        await this.parkingLotManager.vehicleExit(request.vehicleId);

      const durationMs = (ticket.exitTime!.getTime() - ticket.entryTime.getTime());
      const hours = Math.floor(durationMs / 3600000);
      const minutes = Math.floor((durationMs % 3600000) / 60000);

      return {
        ticketId: ticket.id,
        vehicleId: ticket.vehicle.id,
        licensePlate: ticket.vehicle.licensePlate,
        duration: `${hours}h ${minutes}m`,
        totalFee: totalFee,
        message: `Vehicle ${ticket.vehicle.licensePlate} exited successfully. Fee: $${totalFee.toFixed(2)}`
      };
    } catch (error) {
      throw {
        error: "VEHICLE_EXIT_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get parking lot status
   */
  async getParkingStatus(): Promise<ParkingLotStatusResponse> {
    return this.parkingLotManager.getParkingLotStatus();
  }

  /**
   * Get floor status
   */
  async getFloorStatus(
    floorLevel: ParkingLotLevel
  ): Promise<{
    floor: ParkingLotLevel;
    totalSpots: number;
    availableSpots: number;
    occupiedSpots: number;
  }> {
    return this.parkingLotManager.getFloorStatus(floorLevel);
  }

  /**
   * Get active ticket for vehicle
   */
  async getActiveTicket(vehicleId: string) {
    const ticket = await this.parkingLotManager.getActiveTicket(vehicleId);
    if (!ticket) {
      throw {
        error: "TICKET_NOT_FOUND",
        message: `No active ticket found for vehicle: ${vehicleId}`,
        timestamp: new Date().toISOString()
      };
    }
    return ticket;
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats() {
    return this.parkingLotManager.getRevenueStats();
  }

  /**
   * Change allocation strategy
   */
  changeAllocationStrategy(strategy: SpotAllocationStrategy): void {
    this.parkingLotManager.setAllocationStrategy(strategy);
  }

  /**
   * Get parking lot information
   */
  getParkingLotInfo() {
    return this.parkingLotManager.getParkingLotInfo();
  }
}
