

import { v4 as uuidv4 } from "uuid";
import {
  VehicleSize,
  ParkingSpotStatus,
  VehicleType,
  TicketStatus,
  ParkingLotLevel
} from "../enums";


export class Vehicle {
  id: string;
  licensePlate: string;
  vehicleType: VehicleType;
  vehicleSize: VehicleSize;
  entryTime: Date;
  exitTime?: Date;

  constructor(
    licensePlate: string,
    vehicleType: VehicleType,
    vehicleSize: VehicleSize
  ) {
    this.id = uuidv4();
    this.licensePlate = licensePlate;
    this.vehicleType = vehicleType;
    this.vehicleSize = vehicleSize;
    this.entryTime = new Date();
  }

  getDurationInMinutes(): number {
    const end = this.exitTime || new Date();
    return Math.floor((end.getTime() - this.entryTime.getTime()) / 60000);
  }

  getDurationInHours(): number {
    return this.getDurationInMinutes() / 60;
  }
}


export class ParkingSpot {
  id: string;
  spotNumber: string;
  floor: ParkingLotLevel;
  spotSize: VehicleSize;
  status: ParkingSpotStatus;
  occupiedBy?: Vehicle;
  lastUpdated: Date;

  constructor(
    spotNumber: string,
    floor: ParkingLotLevel,
    spotSize: VehicleSize
  ) {
    this.id = uuidv4();
    this.spotNumber = spotNumber;
    this.floor = floor;
    this.spotSize = spotSize;
    this.status = ParkingSpotStatus.AVAILABLE;
    this.lastUpdated = new Date();
  }

  isAvailable(): boolean {
    return this.status === ParkingSpotStatus.AVAILABLE;
  }

  canFit(vehicleSize: VehicleSize): boolean {
    // Define which vehicle sizes can fit in which spot sizes
    const compatibilityMap: Record<VehicleSize, VehicleSize[]> = {
      [VehicleSize.MOTORCYCLE]: [
        VehicleSize.MOTORCYCLE,
        VehicleSize.COMPACT,
        VehicleSize.SEDAN,
        VehicleSize.SUV,
        VehicleSize.BUS
      ],
      [VehicleSize.COMPACT]: [
        VehicleSize.COMPACT,
        VehicleSize.SEDAN,
        VehicleSize.SUV,
        VehicleSize.BUS
      ],
      [VehicleSize.SEDAN]: [VehicleSize.SEDAN, VehicleSize.SUV, VehicleSize.BUS],
      [VehicleSize.SUV]: [VehicleSize.SUV, VehicleSize.BUS],
      [VehicleSize.BUS]: [VehicleSize.BUS]
    };

    return compatibilityMap[this.spotSize].includes(vehicleSize);
  }

  occupy(vehicle: Vehicle): void {
    this.occupiedBy = vehicle;
    this.status = ParkingSpotStatus.OCCUPIED;
    this.lastUpdated = new Date();
  }

  vacate(): void {
    this.occupiedBy = undefined;
    this.status = ParkingSpotStatus.AVAILABLE;
    this.lastUpdated = new Date();
  }
}


export class ParkingTicket {
  id: string;
  vehicle: Vehicle;
  parkingSpot: ParkingSpot;
  entryTime: Date;
  exitTime?: Date;
  status: TicketStatus;
  totalFee: number = 0;

  constructor(vehicle: Vehicle, parkingSpot: ParkingSpot) {
    this.id = uuidv4();
    this.vehicle = vehicle;
    this.parkingSpot = parkingSpot;
    this.entryTime = new Date();
    this.status = TicketStatus.ACTIVE;
  }

  getDurationInMinutes(): number {
    const end = this.exitTime || new Date();
    return Math.floor((end.getTime() - this.entryTime.getTime()) / 60000);
  }

  getDurationInHours(): number {
    return this.getDurationInMinutes() / 60;
  }

  markAsPaid(fee: number): void {
    this.status = TicketStatus.PAID;
    this.totalFee = fee;
    this.exitTime = new Date();
  }
}


export class ParkingFloor {
  id: string;
  floor: ParkingLotLevel;
  spots: Map<string, ParkingSpot>;
  maxSpots: number;

  constructor(floor: ParkingLotLevel, maxSpots: number = 100) {
    this.id = uuidv4();
    this.floor = floor;
    this.spots = new Map();
    this.maxSpots = maxSpots;
  }

  addSpot(spot: ParkingSpot): void {
    if (this.spots.size < this.maxSpots) {
      this.spots.set(spot.id, spot);
    }
  }

  getAvailableSpots(): ParkingSpot[] {
    return Array.from(this.spots.values()).filter((spot) => spot.isAvailable());
  }

  getAvailableSpotCount(): number {
    return this.getAvailableSpots().length;
  }

  getOccupiedSpotCount(): number {
    return Array.from(this.spots.values()).filter(
      (spot) => spot.status === ParkingSpotStatus.OCCUPIED
    ).length;
  }
}


export class ParkingLot {
  id: string;
  name: string;
  floors: Map<ParkingLotLevel, ParkingFloor>;
  capacity: number;
  companyName: string;
  location: string;

  constructor(
    name: string,
    capacity: number,
    companyName: string,
    location: string
  ) {
    this.id = uuidv4();
    this.name = name;
    this.capacity = capacity;
    this.companyName = companyName;
    this.location = location;
    this.floors = new Map();
  }

  addFloor(floor: ParkingFloor): void {
    this.floors.set(floor.floor, floor);
  }

  getFloor(level: ParkingLotLevel): ParkingFloor | undefined {
    return this.floors.get(level);
  }

  getTotalAvailableSpots(): number {
    let total = 0;
    for (const floor of this.floors.values()) {
      total += floor.getAvailableSpotCount();
    }
    return total;
  }

  getTotalOccupiedSpots(): number {
    let total = 0;
    for (const floor of this.floors.values()) {
      total += floor.getOccupiedSpotCount();
    }
    return total;
  }

  getTotalSpots(): number {
    let total = 0;
    for (const floor of this.floors.values()) {
      total += floor.spots.size;
    }
    return total;
  }
}
