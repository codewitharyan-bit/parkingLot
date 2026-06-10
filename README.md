# Smart Parking Lot System

Production-ready backend for managing multi-floor parking facilities with automated spot allocation, real-time tracking, and dynamic pricing.

**Key Features:**
- Automated spot allocation (4 strategies)
- Thread-safe concurrent operations
- Dynamic fee calculation with discounts
- Real-time availability tracking
- Revenue analytics & audit logs

## 📁 Project Structure

```
src/
├── enums/              # Type definitions
├── models/             # Domain entities
├── config/             # Pricing & configuration
├── services/           # Core business logic & strategies
├── utils/              # Concurrency utilities
├── repositories/       # Data persistence
├── api/                # Controllers & DTOs
├── database/           # Schema documentation
└── tests.ts           # Test scenarios
```

## 🚀 Quick Start

### Installation

```bash
# 1. Navigate to project directory
cd parkinglot

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run build

# 4. Run the demo
npm start

# Or run in development mode
npm run dev
```

## 📋 Core Features

### 1. Parking Spot Allocation

**Smart allocation strategies ensure efficient space utilization:**

- **Nearest Spot Strategy**: Prioritizes ground floor and lower levels
- **Best-Fit Strategy**: Finds smallest available spot for vehicle
- **Even Distribution**: Balances vehicles across all floors
- **Premium Strategy**: Prioritizes accessible spots on lower floors

```typescript
const manager = new ParkingLotManager(parkingLot, new BestFitStrategy());
```

### 2. Vehicle Entry & Exit

**Seamless check-in/check-out operations:**

```typescript
// Vehicle Entry
const ticket = await manager.vehicleEntry(
    "ABC-001",
    VehicleType.CAR,
    VehicleSize.SEDAN
);
console.log(`Parked at: ${ticket.parkingSpot.spotNumber}`);

// Vehicle Exit with automatic fee calculation
const { ticket, totalFee } = await manager.vehicleExit(vehicleId);
console.log(`Total fee: $${totalFee.toFixed(2)}`);
```

### 3. Fee Calculation

**Dynamic pricing based on vehicle type and duration:**

| Vehicle Type | Hourly Rate | Daily Max | Min Charge |
|--------------|-------------|-----------|-----------|
| Motorcycle   | $10         | $100      | $5        |
| Car          | $20         | $200      | $10       |
| Truck        | $30         | $300      | $15       |
| Bus          | $50         | $500      | $25       |

**Discount Tiers:**
- 1-24 hours: No discount
- 1-3 days: 5% discount
- 3-7 days: 10% discount
- 7+ days: 15% discount

### 4. Real-Time Status

**Monitor parking lot status in real-time:**

```typescript
const status = await manager.getParkingLotStatus();
console.log(`Available: ${status.availableSpots}/${status.totalSpots}`);
console.log(`Occupancy: ${status.occupancyRate.toFixed(2)}%`);
console.log(`Active Vehicles: ${status.activeVehicles}`);
```

### 5. Concurrency Handling

**Thread-safe operations with multi-level locking:**

```typescript
// Safely handles 100+ concurrent vehicle entries
const results = await Promise.all([
    manager.vehicleEntry("CAR-001", VehicleType.CAR, VehicleSize.SEDAN),
    manager.vehicleEntry("CAR-002", VehicleType.CAR, VehicleSize.SEDAN),
    // ... more entries
]);
```

## 🏗️ Architecture

### System Layers

```
┌─────────────────────────────────┐
│     API Controller Layer        │
│  (Request/Response Handling)    │
├─────────────────────────────────┤
│   Business Logic Layer          │
│  (ParkingLotManager)            │
├─────────────────────────────────┤
│   Service & Strategy Layer      │
│  (Spot Allocation, Fee Calc)    │
├─────────────────────────────────┤
│   Repository Layer              │
│  (Data Access & Persistence)    │
├─────────────────────────────────┤
│   Concurrency Utilities         │
│  (Locks, Mutexes, Semaphores)   │
└─────────────────────────────────┘
```

### Key Components

#### **ParkingLotManager**
- Main orchestration service
- Coordinates all parking operations
- Manages concurrency and consistency
- Provides status and analytics

#### **SpotAllocationStrategy**
- Determines where to park vehicles
- Multiple implementation strategies
- Easy to extend with new strategies

#### **ParkingRateManager**
- Manages pricing models
- Calculates fees with discounts
- Configurable per vehicle type

#### **ConcurrencyUtils**
- Semaphore for resource throttling
- Mutex for exclusive access
- ReadWriteLock for optimized reads

## 📊 Data Models

### Core Entities

**Vehicle**
- License plate
- Vehicle type and size
- Entry and exit times

**ParkingSpot**
- Spot number and floor
- Spot size (accommodates different vehicles)
- Status (Available, Occupied, Reserved, Maintenance)

**ParkingTicket**
- Vehicle reference
- Spot assignment
- Entry and exit times
- Calculated fee

**ParkingFloor**
- Floor level (0-5)
- Multiple parking spots
- Occupancy tracking

**ParkingLot**
- Multiple floors
- Overall capacity
- Location and company info

## 🔒 Concurrency Safety

The system uses a robust concurrency model:

```typescript
class ParkingLotManager {
    private spotsLock: ReadWriteLock;      // For spot operations
    private ticketsLock: Mutex;            // For ticket operations
    private spotAllocationLock: Mutex;     // For allocation sequence

    async vehicleEntry(...) {
        return this.spotAllocationLock.runExclusive(async () => {
            return this.spotsLock.runExclusiveWrite(async () => {
                // Exclusive access to spot allocation
                ...
                await this.ticketsLock.runExclusive(async () => {
                    // Exclusive access to ticket management
                    ...
                });
            });
        });
    }
}
```

**Benefits:**
- Prevents double-booking of spots
- Ensures atomic transactions
- Allows concurrent reads for status queries
- No deadlocks or race conditions

## 📈 Performance Metrics

### Time Complexity
- **Spot Allocation**: O(n) where n = total spots
- **Fee Calculation**: O(1)
- **Status Query**: O(f) where f = number of floors
- **Vehicle Exit**: O(1)

### Space Complexity
- **Parking Spots**: O(s) where s = total spots
- **Active Tickets**: O(v) where v = active vehicles
- **Completed Tickets**: O(t) where t = all transactions

## 💼 API Examples

### Initialize Parking Lot

```typescript
const parkingLot = new ParkingLot(
    "Downtown Parking",
    600,           // capacity
    "ParkingCorp",
    "123 Main St"
);

const manager = new ParkingLotManager(parkingLot);
manager.initializeParkingLot(6, 100); // 6 floors, 100 spots each
```

### Vehicle Entry

```typescript
const ticket = await manager.vehicleEntry(
    "ABC-001",
    VehicleType.CAR,
    VehicleSize.SEDAN
);

console.log(`
    Ticket ID: ${ticket.id}
    Spot: ${ticket.parkingSpot.spotNumber}
    Floor: ${ticket.parkingSpot.floor}
    Entry Time: ${ticket.entryTime}
`);
```

### Vehicle Exit

```typescript
const { ticket, totalFee } = await manager.vehicleExit(vehicleId);

console.log(`
    Duration: ${ticket.getDurationInHours().toFixed(2)} hours
    Fee: $${totalFee.toFixed(2)}
    Status: ${ticket.status}
`);
```

### Query Status

```typescript
// Lot Status
const status = await manager.getParkingLotStatus();

// Floor Status
const floorStatus = await manager.getFloorStatus(ParkingLotLevel.GROUND);

// Revenue Stats
const revenue = await manager.getRevenueStats();
```

## 🔄 Workflow Example

```
1. Vehicle Arrives
   ↓
2. System Allocates Parking Spot
   (Uses configured strategy)
   ↓
3. Ticket Created & Vehicle Recorded
   ↓
4. Vehicle Parks
   ↓
5. Vehicle Owner Returns
   ↓
6. System Calculates Fee
   (Based on duration & type)
   ↓
7. Vehicle Exits, Spot Released
   ↓
8. Transaction Recorded
```

## 🧪 Running Tests & Examples

```bash
# Run main demo
npm start

# Run with concurrency demonstration
npm run dev

# Build only
npm run build
```

## 🎯 Design Patterns Used

1. **Strategy Pattern**: Multiple spot allocation strategies
2. **Repository Pattern**: Data persistence abstraction
3. **Singleton Pattern**: Single ParkingLotManager instance
4. **Adapter Pattern**: Convert different pricing models
5. **Observer Pattern**: Track status changes
6. **Builder Pattern**: Construct complex entities

## 📝 Configuration

### Pricing Configuration

```typescript
const rateManager = manager.rateManager;

// Set custom rate
rateManager.setRate(VehicleType.CAR, {
    vehicleType: VehicleType.CAR,
    hourlyRate: 25,
    dailyMax: 250,
    minimumCharge: 12,
    minimumChargeDuration: 20
});
```

### Allocation Strategy

```typescript
// Switch to different strategy
manager.setAllocationStrategy(new EvenDistributionStrategy());
manager.setAllocationStrategy(new PremiumSpotStrategy());
```

## 🚨 Error Handling

```typescript
try {
    const ticket = await manager.vehicleEntry(...);
} catch (error) {
    if (error.message.includes("No available")) {
        // Lot is full
        console.log("Parking lot is at full capacity");
    } else if (error.message.includes("not found")) {
        // Ticket not found
        console.log("Vehicle not found in system");
    } else {
        // Other errors
        console.log("An error occurred:", error.message);
    }
}
```

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture and design documentation
- **[src/](src/)** - Well-commented source code
- **[src/example.ts](src/example.ts)** - Complete usage examples

## 🔮 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] REST API endpoints
- [ ] WebSocket for real-time updates
- [ ] Mobile app integration
- [ ] Payment gateway integration
- [ ] AI-powered spot prediction
- [ ] RFID/QR code scanning
- [ ] License plate recognition
- [ ] Dynamic pricing based on demand
- [ ] Multi-site management

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript strict mode
- All operations are thread-safe
- Performance is optimized
- Documentation is updated

## 📄 License

MIT License - feel free to use for learning and commercial projects

## 📞 Support

For questions or issues, please refer to:
- Architecture documentation
- Code comments
- Example implementations

---

**Version**: 1.0.0  
**Last Updated**: June 2024  
**Status**: Production Ready
