# System Architecture and Workflow Documentation

## 1. System Architecture

The SupplyChain Pro application is a **Client-Side Single Page Application (SPA)** built with **React** and **TypeScript**, utilizing **Zustand** for state management and local persistence.

### High-Level Components

- **Client**: React Application (SPA)
- **State Management**: Zustand Store (Persistent)
- **Persistence**: LocalStorage (`supplychain-storage`)
- **Modules**: Auth, Order, Inventory, User, Billing

### Data Flow

1.  **Store (Zustand)**: Acts as the single source of truth.
2.  **Persistence**: `persist` middleware saves the entire state tree to `localStorage`.
3.  **UI Components**: Subscribe to store changes and trigger actions.

---

## 2. Order Workflow (Current vs. Enhanced)

### Enhanced Workflow with Agreements

1.  **Order Creation (Kitchen)**
    *   Chef selects items.
    *   System checks for **Established Agreements** with Suppliers.
    *   *New Logic*: Order is sent ONLY to connected Suppliers (not broadcasted).
    *   Status: `pending_supplier`

2.  **Supplier Assignment**
    *   Connected Supplier receives notification.
    *   Supplier accepts order.
    *   Status: `pending_vendor_assignment`

3.  **Vendor Allocation (Smart Segregation)**
    *   System analyzes Order Items by **Category** (Fruit, Veg, Meat).
    *   **Auto-Allocation**:
        *   Check `Vendor-Supplier` Agreements.
        *   Match Item Category to Vendor Inventory.
        *   Prioritize Vendors with stock.
    *   Supplier confirms or overrides assignment.
    *   Status: `vendor_assigned`

4.  **Vendor Fulfillment**
    *   Vendor receives sub-order for their specific items.
    *   Vendor packs items.
    *   Status: `packed_ready`

5.  **Logistics (Delivery)**
    *   Supplier requests pickup.
    *   Transporter (Delivery Agent) accepts ride.
    *   Status: `in_transit` -> `delivered`

6.  **Confirmation**
    *   Kitchen confirms receipt.
    *   Status: `completed`

---

## 3. Auto-Bill Generation Mechanism

The auto-bill (Invoice) generation is triggered automatically when an order reaches the **`completed`** status.

### Trigger Point
*   **Event**: `updateOrderStatus(orderId, 'completed')` in `src/store/index.ts`.
*   **Condition**: Valid Order ID and Status transition to `completed`.

### Logic
1.  **Kitchen Invoice**: Generated for the Kitchen User containing the full order summary.
2.  **Supplier Invoice**: Generated for the Supplier (if assigned) for their records.

### Content
*   **Invoice Number**: Unique `INV-{timestamp}-{random}`.
*   **Subtotal**: Sum of (Item Price * Quantity).
*   **Tax**: Calculates 18% GST (as defined in constants).
*   **Total**: Subtotal + Tax.
*   **Due Date**: Set to 30 days from creation.

---

## 4. Automation Points

1.  **Order Routing**: Automatically filters suppliers based on agreements (To be implemented).
2.  **Vendor Matching**: Automatically suggests/assigns vendors based on item category (To be implemented).
3.  **Status Updates**:
    *   Pickup by Transporter -> Updates Order to `in_transit`.
    *   Drop-off -> Updates Order to `delivered`.
4.  **Invoicing**: Auto-generation upon completion.
5.  **Notifications**: Auto-alerts for every status change.

## 5. AI Verification
**Confirmed**: There is **NO** AI model integration in the current codebase. All logic is deterministic based on `if/else` conditions and array filtering.
