# Metro Health AI — Clinical Appointment Voice Agent & Evaluation Harness

An end-to-end healthcare appointment booking voice system built for **2care**, featuring an AI voice receptionist connected to real doctor availability in PostgreSQL, paired with an automated clinical evaluation harness.

---

## 🌟 System Overview

### Part A: Voice Agent (Retell AI + Next.js + PostgreSQL)
* **Real Doctor Availability**: Real-time slots queried from a cloud PostgreSQL database (Supabase) across multiple specialties (Cardiology, General Practice, Dermatology).
* **Double-Booking & Concurrency Protection**: Atomic slot checks and reservation locking to prevent race conditions when multiple callers request the same slot simultaneously.
* **Clinical Emergency Triage**: Built-in guardrail protocol intercepting acute red-flag symptoms (severe chest pain, shortness of breath, stroke signs) and redirecting callers to 911 / emergency services rather than scheduling a routine appointment.
* **In-Browser WebRTC Calling**: Browser-based microphone call interface using Retell Web SDK, generating ephemeral server tokens to protect private API keys.

### Part B: Automated Evaluation Harness
* **Automated Scenario Benchmark**: Deterministic assertions and evaluation test suite covering:
  1. **Availability Retrieval**: Validates correct doctor matching and unbooked slot filtering.
  2. **Booking Lifecycle**: Verifies slot state transitions (`is_booked = true`) and patient record creation in PostgreSQL.
  3. **Concurrency & Collision Prevention**: Confirms rejection when attempting to reserve an already-booked slot.
  4. **Mandatory Entity Validation**: Asserts rejection if patient name or contact number is missing.
  5. **Clinical Red-Flag Guardrail**: Validates emergency triage rule execution.
* **Multi-Interface Runner**: Executable via CLI (`npm run evals`) and interactive Web UI with instant benchmark scoring.

---

## 🏗️ Architecture

```
+-----------------------------------------------------------------------------------+
|                                  USER / CLINIC UI                                 |
|  - WebRTC Browser Voice Call with Live Audio Indicator                            |
|  - Real-Time Doctor Schedule Grid (Cardiology, General Practice, Dermatology)     |
|  - Live Confirmed Appointments Log                                                |
|  - Evaluation Harness Report Card                                                 |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------+                     +-------------------------------+
|      RETELL VOICE AGENT     |                     |         NEXT.JS BACKEND       |
|  - Model: GPT-4o-mini       | ◄─── Function ────► | (TypeScript App Router API)   |
|  - Voice: Cartesia Natural  |      Calling        |  - /api/tools/check-avail...  |
|  - Turn-taking sub-800ms    |      (Webhooks)     |  - /api/tools/book-appt...    |
+-----------------------------+                     +---------------+---------------+
                                                                    │
                                                                    ▼
                                                    +-------------------------------+
                                                    |      SUPABASE POSTGRESQL      |
                                                    |  - slots (availability state) |
                                                    |  - appointments (records)     |
                                                    |  * Concurrency protection     |
                                                    +-------------------------------+
```

---

## 🗄️ Database Schema

```sql
-- Doctor appointment availability slots
CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    slot_date TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE
);

-- Confirmed patient bookings
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    doctor_name TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    reason TEXT DEFAULT 'General Consultation',
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/vishal-raaj-dnd/Sample_Caller_Agent.git
cd Sample_Caller_Agent
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
RETELL_API_KEY=key_your_retell_key
NEXT_PUBLIC_RETELL_AGENT_ID=agent_your_agent_id
RETELL_LLM_ID=llm_your_llm_id
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the clinic dashboard.

### 4. Run Part B Evaluations
```bash
npm run evals
```
Sample benchmark output:
```
============================================================
       2CARE CLINIC VOICE AGENT EVALUATION HARNESS          
============================================================

RESULTS SUMMARY:
✅ PASS [Availability   ] Query Availability by Specialty (Cardiology) (271ms)
✅ PASS [Lifecycle      ] Book Slot & Record Appointment Row (1120ms)
✅ PASS [Concurrency    ] Double-Booking Collision Detection (473ms)
✅ PASS [Validation     ] Mandatory Patient Entity Validation (0ms)
✅ PASS [Clinical Safety] Clinical Emergency Red Flag Triage (0ms)
------------------------------------------------------------
Score: 5/5 Tests Passed (100%)
============================================================
```

---

## 🛡️ Design Decisions & Trade-Offs

* **Why Retell Web Calls?**: Generates ephemeral access tokens via server-side session initialization (`/api/create-web-call`). This keeps private API keys completely hidden from client inspection while enabling instant microphone testing without telephony expenses.
* **Why Postgres Concurrency Check?**: Healthcare scheduling cannot tolerate double-booking. When a booking request arrives, the target slot is queried and asserted against `is_booked = false` before recording the appointment row.
* **Why Deterministic Assertions for Evals?**: In clinical workflows, probabilistic LLM judgments can have evaluation drift. Combining deterministic state assertions (DB row transitions, collision detection) with semantic triage checks delivers repeatable, auditable evaluation results.
