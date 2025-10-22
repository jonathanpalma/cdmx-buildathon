# Palace Resorts REST API Reference

Official REST API documentation for The Palace Company's Office Hours Buildathon API.

## Base URL

```
https://office-hours-buildathon.palaceresorts.com
```

## API Documentation

- **Swagger UI**: https://office-hours-buildathon.palaceresorts.com/docs
- **OpenAPI Spec**: [palace-api-openapi.json](./palace-api-openapi.json)

## Dataset Overview

This API provides access to synthetic but realistic hotel reservation data:

- 🏨 **8 properties** across 4 luxury brands
- 📊 **~3.9M reservations** with realistic data
- 💰 **Dynamic pricing engine** with multiple factors
- 📡 **16 booking channels** with complete analytics
- 🔍 **Advanced search** with multiple filters
- 💎 **7% premium reservations** ($15K-$100K) at luxury properties

### Statistics

- **Total Revenue**: $18B+ USD
- **Commissions**: $1.02B USD
- **Price Range**: $320 - $102K
- **Direct Bookings**: 62.6%

---

## Endpoints

### System

#### `GET /`
Root endpoint with server information.

#### `GET /health`
Health check for AWS ECS/ELB monitoring.

---

### Properties

#### `GET /api/properties`
Get all properties.

**Response**: Array of property objects with details about each hotel.

#### `GET /api/properties/{property_id}`
Get specific property details.

**Parameters**:
- `property_id` (path, required): Property identifier

**Example**:
```bash
curl https://office-hours-buildathon.palaceresorts.com/api/properties/palace_001
```

---

### System Data

#### `GET /api/stats`
Get system statistics including total reservations, revenue, and analytics.

#### `GET /api/channels`
Get list of all booking channels (Expedia, Booking.com, direct, etc.).

#### `GET /api/segments`
Get customer segments used for pricing and analytics.

#### `GET /api/room-types`
Get catalog of all room types across properties.

---

### Reservations

#### `GET /api/reservations`
List reservations with pagination and filters.

**Query Parameters**:
- `limit` (integer, default: 100): Maximum number of results
- `offset` (integer, default: 0): Pagination offset
- `property_id` (string, optional): Filter by property
- `estado` (string, optional): Filter by status (confirmada, cancelada, etc.)

**Example**:
```bash
curl "https://office-hours-buildathon.palaceresorts.com/api/reservations?limit=10&property_id=palace_001"
```

#### `GET /api/reservations/{reservation_id}`
Get specific reservation by ID.

**Parameters**:
- `reservation_id` (path, required): Reservation identifier

**Example**:
```bash
curl https://office-hours-buildathon.palaceresorts.com/api/reservations/reserva_001
```

#### `GET /api/reservations/confirmation/{confirmation_number}`
Get reservation by confirmation number.

**Parameters**:
- `confirmation_number` (path, required): Confirmation number

**Example**:
```bash
curl https://office-hours-buildathon.palaceresorts.com/api/reservations/confirmation/MOON2025-1001
```

#### `POST /api/reservations/search`
Search reservations by multiple criteria.

**Request Body** (SearchRequest):
```json
{
  "property_id": "palace_001",
  "estado": "confirmada",
  "email": "customer@example.com",
  "confirmation": "MOON2025-1001",
  "limit": 100
}
```

All fields are optional.

**Example**:
```bash
curl -X POST https://office-hours-buildathon.palaceresorts.com/api/reservations/search \
  -H "Content-Type: application/json" \
  -d '{"property_id": "palace_001", "estado": "confirmada"}'
```

---

### Business Operations

#### `POST /api/pricing`
Calculate dynamic pricing for a reservation.

**Request Body** (PricingRequest):
```json
{
  "property_id": "palace_001",
  "room_type": "suite_swim_up",
  "check_in_date": "2025-12-20",
  "check_out_date": "2025-12-27",
  "num_guests": 2,
  "customer_segment": "seg_family_traditional",
  "lifetime_value_usd": 5000
}
```

**Required Fields**:
- `property_id`: Property identifier
- `room_type`: Room type code
- `check_in_date`: Check-in date (YYYY-MM-DD)
- `check_out_date`: Check-out date (YYYY-MM-DD)
- `num_guests`: Number of guests

**Optional Fields**:
- `customer_segment`: Customer segment (default: "seg_family_traditional")
- `lifetime_value_usd`: Customer lifetime value (default: 0)

**Example**:
```bash
curl -X POST https://office-hours-buildathon.palaceresorts.com/api/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "palace_001",
    "room_type": "suite_swim_up",
    "check_in_date": "2025-12-20",
    "check_out_date": "2025-12-27",
    "num_guests": 2
  }'
```

#### `POST /api/availability`
Check room availability for specific dates.

**Request Body** (AvailabilityRequest):
```json
{
  "property_id": "palace_001",
  "check_in_date": "2025-12-20",
  "check_out_date": "2025-12-27",
  "room_type": "suite_swim_up"
}
```

**Required Fields**:
- `property_id`: Property identifier
- `check_in_date`: Check-in date (YYYY-MM-DD)
- `check_out_date`: Check-out date (YYYY-MM-DD)

**Optional Fields**:
- `room_type`: Specific room type to check

**Example**:
```bash
curl -X POST https://office-hours-buildathon.palaceresorts.com/api/availability \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "palace_001",
    "check_in_date": "2025-12-20",
    "check_out_date": "2025-12-27"
  }'
```

---

## Common Property IDs

| ID | Property Name | Location |
|----|---------------|----------|
| palace_001 | Moon Palace Cancún | Cancún, Quintana Roo |
| palace_002 | Le Blanc Spa Resort Los Cabos | Los Cabos, Baja California Sur |
| palace_003 | Beach Palace Cancún | Cancún, Quintana Roo |
| palace_004 | Playacar Palace | Playa del Carmen, Quintana Roo |

## Common Room Types

### Moon Palace Cancún (palace_001)
- `deluxe_ocean` - Deluxe Ocean View ($450/night)
- `suite_swim_up` - Swim-Up Suite ($650/night)
- `presidential_suite` - Presidential Suite ($1,200/night)

### Le Blanc Spa Resort Los Cabos (palace_002)
- `deluxe_ocean_view` - Deluxe Ocean View ($800/night)
- `luxury_ocean_front` - Luxury Ocean Front Suite ($1,100/night)
- `blanc_suite` - Blanc Suite ($1,800/night)

### Beach Palace Cancún (palace_003)
- `deluxe_resort_view` - Deluxe Resort View ($350/night)
- `deluxe_ocean_view` - Deluxe Ocean View ($425/night)
- `concierge_suite` - Concierge Suite ($650/night)

### Playacar Palace (palace_004)
- `deluxe_tropical` - Deluxe Tropical ($380/night)
- `deluxe_ocean_view` - Deluxe Ocean View ($460/night)
- `master_suite` - Master Suite ($750/night)

---

## Response Schemas

### Error Response (422 Validation Error)

```json
{
  "detail": [
    {
      "loc": ["body", "property_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Related Resources

### Local MCP Server Documentation

The `office-hours-buildathon` folder contains a Python MCP server that wraps this REST API:

- [API.md](./office-hours-buildathon/docs/API.md) - Complete MCP tools reference (Spanish)
- [BUILDATHON.md](./office-hours-buildathon/docs/BUILDATHON.md) - Buildathon guide
- [CURL_EXAMPLES_ES.md](./office-hours-buildathon/docs/CURL_EXAMPLES_ES.md) - cURL examples
- [GETTING_STARTED.md](./office-hours-buildathon/docs/GETTING_STARTED.md) - Getting started

### Code Examples

- Python: [connect_python.py](./office-hours-buildathon/examples/connect_python.py)
- Node.js: [connect_nodejs.js](./office-hours-buildathon/examples/connect_nodejs.js)
- Shell: [http_api_examples.sh](./office-hours-buildathon/examples/http_api_examples.sh)

---

## Notes

- All data is **synthetic** but uses real business logic
- Dates should be in `YYYY-MM-DD` format
- The API is read-only via HTTP (no POST/PUT/DELETE for creating/modifying reservations)
- For full reservation management, use the MCP server tools
