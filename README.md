# TransitOps - Smart Transport Operations Platform

## Executive Summary
TransitOps is a centralized, role-based transport operations platform that digitizes the full lifecycle of fleet management for logistics companies. It replaces disconnected spreadsheets, WhatsApp messages, and paper logbooks with a single login-gated system where every action (dispatching a trip, logging fuel, closing a maintenance ticket) automatically updates vehicle and driver statuses and rolls up into cost and performance analytics.

## Problem Solved
Logistics SMBs often struggle with:
- Double-booked vehicles and overlapping trips.
- Assigning drivers with expired licenses or suspended statuses.
- Overloaded vehicles exceeding their rated cargo capacities.
- Missed maintenance leading to costly breakdowns.
- Lack of visibility into per-vehicle profitability (fuel + maintenance cost vs. revenue).

TransitOps solves these by enforcing business rules directly through the system.

## Features Implemented in Codebase

A review of the current codebase (`frontend/` and `backend/`) confirms that the core MVP requirements and several enhancements from the PRD and Problem Statement have been successfully implemented:

### 1. Authentication & Role-Based Access Control (RBAC)
- **Implemented:** Secure email and password login.
- **Implemented:** Role-Based Access Control (RBAC) with 4 distinct roles: Fleet Manager, Dispatcher, Safety Officer, and Financial Analyst. Actions and dashboard views are securely scoped to these roles.

### 2. Interactive Dashboard
- **Implemented:** Real-time KPI tiles for Active Trips, Available Vehicles, In Maintenance, and Pending Trips. These KPI cards are interactive and route users to appropriately filtered list views.
- **Implemented:** Financial and Efficiency analytics: Total Operational Cost, Fleet Utilization, Fuel Efficiency (km/l), and Average Vehicle ROI.
- **Implemented:** Dynamic charts for Monthly Revenue Trends and Top Costliest Vehicles.
- **Implemented:** Full Dark Mode support.

### 3. Vehicle Registry
- **Implemented:** Complete CRUD operations for vehicles, capturing unique Registration Numbers, Type, Max Load Capacity (kg), Odometer, and Acquisition Cost.
- **Implemented:** Automated status lifecycle transitions (Available, On Trip, In Shop, Retired).

### 4. Driver Management
- **Implemented:** Driver profiles including License Number, Expiry Date, Safety Score, and Contact details.
- **Implemented:** Automated status lifecycle (Available, On Trip, Off Duty, Suspended).
- **Implemented:** Strict enforcement preventing dispatch of drivers with expired licenses or suspended statuses.

### 5. Trip Management (Live Board)
- **Implemented:** Kanban-style trip board tracking lifecycles: Draft → Dispatched → Completed → Cancelled.
- **Implemented:** Validations checking Cargo Weight against the selected Vehicle's Maximum Load Capacity.
- **Implemented:** Dispatching automatically locks both the Vehicle and Driver to `On Trip`. Completing or cancelling the trip automatically restores them to `Available`.

### 6. Maintenance Module
- **Implemented:** Creating an active maintenance record automatically sets a vehicle's status to `In Shop`, immediately removing it from the dispatch selection pool.
- **Implemented:** Closing the maintenance record restores the vehicle's availability.

### 7. Finance: Fuel, Expense & Payment Management
- **Implemented:** Comprehensive expense tracking for fuel logs (liters, cost, date) and other trip-related expenses (tolls, miscellaneous).
- **Implemented:** Automatic computation of total operational costs per vehicle.
- **Implemented:** A dedicated Finance module supporting payment records and integrations.

### 8. Reports & Analytics
- **Implemented:** Core metric aggregations: Fuel Efficiency, Fleet Utilization, and Vehicle ROI calculation `(Revenue - (Maintenance + Fuel)) / Acquisition Cost`.
- **Implemented:** Category-wise expense rollups visible on vehicle profiles and across the dashboard.

## Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons, Chart.js for visualization, Next-Themes for dark mode.
- **Backend**: Django (Python), Django REST Framework.
- **Database**: PostgreSQL (Production) / SQLite (Local Development).

## Getting Started (Local Development)

### Prerequisites
- Node.js & npm
- Python 3.10+
- Docker & Docker Compose (Optional for DB services)

### Running the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the TransitOps platform.
