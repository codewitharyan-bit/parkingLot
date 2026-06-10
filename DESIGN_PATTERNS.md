# Design Patterns & Best Practices

## Core Patterns

### Strategy Pattern
**Use**: Different spot allocation algorithms
```typescript
manager.setAllocationStrategy(new BestFitStrategy());
```
✓ Runtime selection | ✓ Easy to extend | ✓ Testable

---

### Repository Pattern
**Use**: Decouple business logic from data access
```typescript
const repository = process.env.USE_DB 
    ? new DatabaseRepository() 
    : new InMemoryRepository();
```
✓ Easy DB switching | ✓ Simple testing | ✓ Clean abstraction

---

### Builder Pattern
**Use**: Construct complex objects
```typescript
const lot = new ParkingLotBuilder()
    .withFloors(6, 100)
    .withPricingModel(model)
    .build();
```
✓ Readable | ✓ Flexible | ✓ Type-safe

// Usage
const lot = new ParkingLotBuilder()
    .withFloors(6, 100)
    .withPricingModel(premiumModel)
    .build();
```

---

### 5. Observer Pattern
**Problem**: Multiple components need to react to status changes
**Solution**: Implement event/observer mechanism

```typescript
interface Observer {
    update(event: ParkingEvent): void;
}

class ParkingLotEventBus {
    private observers: Set<Observer> = new Set();
    
    subscribe(observer: Observer): void {
        this.observers.add(observer);
    }
    
    publish(event: ParkingEvent): void {
        this.observers.forEach(o => o.update(event));
    }
}

// Usage
eventBus.subscribe(new AnalyticsObserver());
eventBus.subscribe(new NotificationObserver());
eventBus.publish(new VehicleExitEvent(...));
```

---

## Concurrency Patterns

### 1. Mutex (Mutual Exclusion)
**Use When**: Exclusive access needed
**Implementation**: Lock-based synchronization

```typescript
class Mutex {
    async lock(): Promise<void> { ... }
    unlock(): void { ... }
    async runExclusive<T>(fn: () => Promise<T>): Promise<T> { ... }
}

// Usage
await mutex.runExclusive(async () => {
    // Only one thread can execute this
    spotAllocationQueue.push(vehicle);
});
```

---

### 2. Read-Write Lock
**Use When**: Many readers, few writers
**Implementation**: Allow concurrent reads, exclusive writes

```typescript
class ReadWriteLock {
    async acquireRead(): Promise<void> { ... }
    async acquireWrite(): Promise<void> { ... }
    
    async runSharedRead<T>(fn: () => Promise<T>): Promise<T> { ... }
    async runExclusiveWrite<T>(fn: () => Promise<T>): Promise<T> { ... }
}

// Usage
// Status queries (many can happen together)
const status = await lock.runSharedRead(async () => {
    return calculateStatus();
});

// Vehicle entry (exclusive)
const ticket = await lock.runExclusiveWrite(async () => {
    return allocateSpot();
});
```

---

## Concurrency Patterns

| Pattern | Use Case |
|---------|----------|
| **Mutex** | Exclusive access |
| **ReadWriteLock** | Many readers, few writers |
| **Semaphore** | Limit concurrent operations |

---

## Error Handling

### Custom Exceptions
```typescript
class NoAvailableSpotError extends ParkingException {
    constructor(vehicleSize: VehicleSize) {
        super('NO_SPOT', `No spot for ${vehicleSize}`);
    }
}
```

### Result Pattern
```typescript
const result = await manager.vehicleEntry(...);
if (result.isSuccess()) console.log(result.value);
```

---

## Testing (AAA Pattern)

```typescript
// Arrange
const manager = new ParkingLotManager(lot, strategy);

// Act
const ticket = await manager.vehicleEntry(...);

// Assert
expect(ticket.parkingSpot.status).toBe(ParkingSpotStatus.OCCUPIED);
```

---

## Performance Patterns

**Caching**: Cache results with TTL expiration  
**Batch Operations**: Group multiple inserts/updates  
**Lazy Loading**: Load data only when needed

---

## SOLID Principles Summary

| Principle | Application |
|-----------|-------------|
| S | Each class has one responsibility |
| O | Extend via strategies, not modification |
| L | All strategies are substitutable |
| I | Segregate client interfaces |
| D | Depend on abstractions, not details |

---

**Last Updated**: June 2024
