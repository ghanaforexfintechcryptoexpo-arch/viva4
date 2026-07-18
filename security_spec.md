# Security Specification: ProViva Wellness Firestore Security

## Data Invariants
1. **Support Tickets**:
   - Anyone can create a ticket.
   - Tickets cannot be updated or deleted by regular clients once submitted (only read by admins if admin panel is added, or blocked entirely for clients).
   - Document ID must match ticket ID if specified, and be valid.
   - Text fields must conform to strict maxLength constraints to prevent Resource Exhaustion (Denial of Wallet).

2. **User Reviews**:
   - Anyone can read reviews.
   - A user can only write reviews if they are signed in (or we can allow anonymous/public submissions, but we will secure authenticated ones so that if `userId` is supplied, it matches the actual signed-in `request.auth.uid`).
   - Standard users cannot modify or delete other users' reviews.

3. **User Orders**:
   - Signed-in users can view their own orders.
   - Public users can create orders (to allow guest checkout) but guest checkouts can't be listed by standard signed-in users.
   - If signed-in, `userId` must match `request.auth.uid`.
   - Orders are immutable after creation.

---

## The "Dirty Dozen" Malicious Payloads (TDD Test Scenarios)

### Scenario 1: Support Ticket Ghost Field Injection (Shadow Update)
Attempt to inject a ghost field `isAdminReview: true` into a support ticket.
```json
{
  "name": "Abigail Sterling",
  "email": "abigail@sterling.com",
  "topic": "Wholesale",
  "message": "Enquiry",
  "isAdminReview": true
}
```

### Scenario 2: Support Ticket Size Limit Exhaustion (Denial of Wallet)
Attempt to write a support ticket message that is 100,000 characters long to exhaust database capacity.
```json
{
  "name": "Attacker",
  "email": "attacker@gmail.com",
  "topic": "Wholesale",
  "message": "[100,000 character string...]"
}
```

### Scenario 3: Support Ticket ID Poisoning
Attempt to write a support ticket with a junk characters ID containing slashes or control characters to corrupt paths.
- Path: `/support_tickets/$$$malicious_ID###`

### Scenario 4: User Review Identity Spoofing (Owner Spoofing)
Attempt to submit a review with another user's ID to look like a high-profile reviewer.
```json
{
  "productId": "proviva",
  "author": "Faker",
  "comment": "Nice",
  "rating": 5,
  "userId": "victim_user_123"
}
```

### Scenario 5: User Review Invalid Rating Range
Attempt to write a user review with a rating of `100` stars.
```json
{
  "productId": "proviva",
  "author": "Dr. Vance",
  "comment": "Nice",
  "rating": 100
}
```

### Scenario 6: User Review Read Bypass (PII Leak Attempt)
Attempt to read private user profiles or private orders of other users without authorization.

### Scenario 7: User Review Malicious Update
An attacker tries to update a published review to inject spam links.
```json
{
  "productId": "proviva",
  "author": "Dr. Vance",
  "comment": "Buy crypto now at http://scam.com",
  "rating": 1
}
```

### Scenario 8: User Order Price Tampering
An attacker attempts to write an order where they set `total` to `$0.01` for a large cart.
```json
{
  "shipName": "Abigail",
  "shipEmail": "abigail@gmail.com",
  "shipAddress": "123 Lane",
  "shipCity": "Austin",
  "shipZip": "12345",
  "total": 0.01,
  "items": [{"productId": "proviva", "quantity": 100}]
}
```

### Scenario 9: User Order Unauthenticated Owner Injection
Attempting to create an order claiming it belongs to `admin_user` when the user is not signed in.
```json
{
  "shipName": "Abigail",
  "shipEmail": "abigail@gmail.com",
  "shipAddress": "123 Lane",
  "shipCity": "Austin",
  "shipZip": "12345",
  "total": 50.00,
  "userId": "admin_user_id"
}
```

### Scenario 10: User Order List Query Scraping
Attempting to query/list all orders in the system without specifying their own `userId` check.

### Scenario 11: Support Ticket Forbidden Update
Attempting to update an existing support ticket to change the issue topic or mark it as resolved.

### Scenario 12: Support Ticket Forbidden Delete
Attempting to delete a support ticket to clear up complaints.

---

## Firestore Rules Draft (`firestore.rules`)
To make sure these 12 scenarios are blocked, we'll design highly robust rules.
See `firestore.rules` for the secure implementation.
