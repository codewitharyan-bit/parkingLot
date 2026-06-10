/**
 * Fee calculation configuration and pricing rules
 */

import { VehicleType } from "../enums";

/**
 * Pricing model for different vehicle types
 */
export interface PricingModel {
  vehicleType: VehicleType;
  hourlyRate: number; // in currency units
  dailyMax: number; // maximum daily charge
  minimumCharge: number; // minimum charge for parking
  minimumChargeDuration: number; // in minutes
}

export class ParkingRateManager {
  private rates: Map<VehicleType, PricingModel>;

  constructor() {
    this.rates = new Map();
    this.initializeDefaultRates();
  }

  private initializeDefaultRates(): void {
    this.rates.set(VehicleType.MOTORCYCLE, {
      vehicleType: VehicleType.MOTORCYCLE,
      hourlyRate: 10,
      dailyMax: 100,
      minimumCharge: 5,
      minimumChargeDuration: 15 // minimum 15 minutes
    });

    this.rates.set(VehicleType.CAR, {
      vehicleType: VehicleType.CAR,
      hourlyRate: 20,
      dailyMax: 200,
      minimumCharge: 10,
      minimumChargeDuration: 15
    });

    this.rates.set(VehicleType.TRUCK, {
      vehicleType: VehicleType.TRUCK,
      hourlyRate: 30,
      dailyMax: 300,
      minimumCharge: 15,
      minimumChargeDuration: 15
    });

    this.rates.set(VehicleType.BUS, {
      vehicleType: VehicleType.BUS,
      hourlyRate: 50,
      dailyMax: 500,
      minimumCharge: 25,
      minimumChargeDuration: 15
    });
  }

  getRate(vehicleType: VehicleType): PricingModel {
    const rate = this.rates.get(vehicleType);
    if (!rate) {
      throw new Error(`No pricing model found for vehicle type: ${vehicleType}`);
    }
    return rate;
  }

  setRate(vehicleType: VehicleType, rate: PricingModel): void {
    this.rates.set(vehicleType, rate);
  }

  /**
   * Calculate parking fee based on duration and vehicle type
   * @param durationInMinutes - Total parking duration in minutes
   * @param vehicleType - Type of vehicle
   * @returns Total fee to be charged
   */
  calculateFee(durationInMinutes: number, vehicleType: VehicleType): number {
    const rate = this.getRate(vehicleType);

    // Handle minimum charge for short parking durations
    if (durationInMinutes <= rate.minimumChargeDuration) {
      return rate.minimumCharge;
    }

    // Calculate hourly charges
    const durationInHours = durationInMinutes / 60;
    const hoursToCharge = Math.ceil(durationInHours); // Round up to nearest hour
    let totalFee = hoursToCharge * rate.hourlyRate;

    // Apply daily maximum
    totalFee = Math.min(totalFee, rate.dailyMax);

    return totalFee;
  }

  /**
   * Get a discount if applicable
   * @param duration - Parking duration in minutes
   * @returns discount percentage (0-100)
   */
  getDiscount(duration: number): number {
    // Example: Offer discounts for long-term parking
    const daysParked = duration / (24 * 60);

    if (daysParked >= 7) {
      return 15; // 15% discount for weekly parking
    }
    if (daysParked >= 3) {
      return 10; // 10% discount for 3-day parking
    }
    if (daysParked >= 1) {
      return 5; // 5% discount for full day parking
    }

    return 0;
  }

  /**
   * Calculate final fee with discounts
   */
  calculateFeeWithDiscount(
    durationInMinutes: number,
    vehicleType: VehicleType
  ): number {
    const baseFee = this.calculateFee(durationInMinutes, vehicleType);
    const discount = this.getDiscount(durationInMinutes);
    const discountAmount = (baseFee * discount) / 100;
    return baseFee - discountAmount;
  }
}
