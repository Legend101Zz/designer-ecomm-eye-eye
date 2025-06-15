# Transaction API Contract

## Overview

This document outlines the API contract for all transaction-related endpoints in the e-commerce system with Razorpay payment integration.

**Base URL:** `/api`  
**Authentication:** Bearer Token (except webhook endpoint)  
**Content-Type:** `application/json`

---

## 1. Create Transaction

### `POST /transactions/initiate`

Creates a new transaction and initializes Razorpay order for payment processing.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
X-API-KEY: <api_key>
```

**Request Body:**

```json
{
  "Address": "60f1a2b3c4d5e6f7g8h9i0j1",
  "paymentProvider": "razorpay",
  "amount": 1500,
  "currency": "INR",
  "products": [
    {
      "product": "60f1a2b3c4d5e6f7g8h9i0j2",
      "quantity": 2,
      "size": "M",
      "color": "black"
    },
    {
      "product": "60f1a2b3c4d5e6f7g8h9i0j3",
      "quantity": 1,
      "size": "L",
      "color": "white"
    }
  ]
}
```

**Success Response (201):**

```json
{
  "message": "Transaction initiated successfully",
  "transaction": {
    "id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "transaction_id": "TXN_1703123456_abc123",
    "status": "pending",
    "amount": 1500,
    "currency": "INR"
  },
  "razorpay": {
    "order_id": "order_NVQhgf0W8FOzGS",
    "amount": 150000,
    "currency": "INR",
    "key_id": "rzp_test_1234567890"
  },
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}
```

**Error Responses:**

- `400`: Invalid address or missing required fields
- `401`: Unauthorized
- `404`: User not found
- `500`: Payment gateway error or internal server error

---

## 2. Verify Payment

### `POST /transactions/:transactionId/verify`

Verifies payment confirmation from frontend after successful Razorpay payment.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
X-API-KEY: <api_key>
```

**Parameters:**

- `transactionId` (path): MongoDB ObjectId of the transaction

**Request Body:**

```json
{
  "razorpay_order_id": "order_NVQhgf0W8FOzGS",
  "razorpay_payment_id": "pay_NVQhgf0W8FOzGT",
  "razorpay_signature": "cf2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f"
}
```

**Success Response (200):**

```json
{
  "message": "Payment verified successfully",
  "status": "success",
  "transaction": {
    "id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "transaction_id": "TXN_1703123456_abc123",
    "status": "completed",
    "isCompleted": true,
    "amount": 1500,
    "currency": "INR",
    "paymentId": "pay_NVQhgf0W8FOzGT"
  }
}
```

**Error Responses:**

- `400`: Payment verification failed (invalid signature)
- `404`: Transaction not found
- `500`: Internal server error

---

## 3. Razorpay Webhook

### `POST /transactions/webhook/razorpay`

Handles Razorpay webhook callbacks for payment status updates.

**Headers:**

```
X-Razorpay-Signature: <webhook_signature>
Content-Type: application/json
X-API-KEY: <api_key>
```

**Request Body (Payment Captured):**

```json
{
  "entity": "event",
  "account_id": "acc_BFQ7uQEaa30PNf",
  "event": "payment.captured",
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_NVQhgf0W8FOzGT",
        "entity": "payment",
        "amount": 150000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_NVQhgf0W8FOzGS",
        "method": "card",
        "captured": true
      }
    }
  },
  "created_at": 1703123456
}
```

**Success Response (200):**

```json
{
  "status": "ok"
}
```

**Error Responses:**

- `400`: Missing or invalid signature
- `500`: Internal server error

**Supported Webhook Events:**

- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed
- `order.paid` - Order marked as paid

---

## 4. Update Transaction

### `PUT /transactions/:transactionId`

Updates an existing transaction with new status or payment details.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
X-API-KEY: <api_key>
```

**Parameters:**

- `transactionId` (path): MongoDB ObjectId of the transaction

**Request Body (partial update):**

```json
{
  "status": "completed",
  "isCompleted": true,
  "paymentDetails": {
    "paymentMethodId": "pay_NVQhgf0W8FOzGT",
    "receiptUrl": "https://razorpay.com/receipt/12345"
  }
}
```

**Success Response (200):**

```json
{
  "message": "Transaction updated successfully",
  "transaction": {
    "id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "transaction_id": "TXN_1703123456_abc123",
    "status": "completed",
    "isCompleted": true,
    "paymentProvider": "razorpay",
    "amount": 1500,
    "currency": "INR",
    "updatedAt": "2023-12-21T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Invalid update data
- `404`: Transaction not found
- `500`: Internal server error

---

## 5. Get Transaction

### `GET /transactions/:transactionId`

Retrieves a single transaction with populated product and address details.

**Headers:**

```
Authorization: Bearer <token>
X-API-KEY: <api_key>
```

**Parameters:**

- `transactionId` (path): MongoDB ObjectId of the transaction

**Success Response (200):**

```json
{
  "transaction": {
    "id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "transaction_id": "TXN_1703123456_abc123",
    "status": "completed",
    "isCompleted": true,
    "amount": 1500,
    "currency": "INR",
    "paymentProvider": "razorpay",
    "user": {
      "id": "60f1a2b3c4d5e6f7g8h9i0j4",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "DeliveryAddress": {
      "id": "60f1a2b3c4d5e6f7g8h9i0j1",
      "address_line1": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postal_code": "400001",
      "country": "India"
    },
    "productsBought": [
      {
        "product": {
          "id": "60f1a2b3c4d5e6f7g8h9i0j2",
          "productName": "Designer T-Shirt",
          "price": 750
        },
        "quantity": 2,
        "size": "M",
        "color": "black"
      }
    ],
    "paymentDetails": {
      "paymentIntentId": "order_NVQhgf0W8FOzGS",
      "paymentMethodId": "pay_NVQhgf0W8FOzGT",
      "receiptUrl": "https://razorpay.com/receipt/12345"
    },
    "createdAt": "2023-12-21T10:00:00.000Z",
    "updatedAt": "2023-12-21T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `404`: Transaction not found
- `500`: Internal server error

---

## 6. Get User Transactions

### `GET /transactions/user/:userId`

Retrieves all transactions for a specific user with pagination and filtering.

**Headers:**

```
Authorization: Bearer <token>
X-API-KEY: <api_key>
```

**Parameters:**

- `userId` (path): MongoDB ObjectId of the user

**Query Parameters:**

- `status` (optional): Filter by transaction status (`pending`, `completed`, `failed`, etc.)
- `limit` (optional): Number of results per page (default: 10, max: 100)
- `page` (optional): Page number (default: 1)

**Example Request:**

```
GET /transactions/user/60f1a2b3c4d5e6f7g8h9i0j4?status=completed&limit=5&page=1
```

**Success Response (200):**

```json
{
  "transactions": [
    {
      "id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "transaction_id": "TXN_1703123456_abc123",
      "status": "completed",
      "isCompleted": true,
      "amount": 1500,
      "currency": "INR",
      "paymentProvider": "razorpay",
      "DeliveryAddress": {
        "address_line1": "123 Main Street",
        "city": "Mumbai"
      },
      "productsBought": [
        {
          "product": {
            "productName": "Designer T-Shirt"
          },
          "quantity": 2,
          "size": "M",
          "color": "black"
        }
      ],
      "createdAt": "2023-12-21T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 5,
    "totalPages": 5
  }
}
```

**Error Responses:**

- `404`: User not found
- `500`: Internal server error

---

## Data Models

### Transaction Status Enum

```typescript
enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
```

### Payment Provider Enum

```typescript
enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}
```

### Size Enum

```typescript
enum Size {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
}
```

### Color Enum

```typescript
enum Color {
  RED = 'red',
  BLACK = 'black',
  WHITE = 'white',
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "message": "Error description",
  "status": "error"
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found
- `500`: Internal Server Error

---

## Authentication

All endpoints except webhook require Bearer token authentication:

```
Authorization: Bearer <your_jwt_token>
```

The token should contain user information and be obtained from the login endpoint.

---

## Rate Limiting

- Standard endpoints: 100 requests per minute per user
- Webhook endpoint: 1000 requests per minute (no user limit)

---

## Environment Variables Required

```bash
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```
