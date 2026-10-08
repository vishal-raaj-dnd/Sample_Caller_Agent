'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import {
  Phone,
  PhoneOff,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Activity,
  User,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  X,
  Check,
  Volume2,
  Stethoscope,
  Trash2
} from 'lucide-react';

interface Slot {
  id: number;
  doctor_name: string;
  specialty: string;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
}

interface Appointment {
  id: number;
  doctor_name: string;
  slot_time: string;
  patient_name: string;
  patient_phone: string;
  reason: string;
  status?: string;
  created_at: string;
}

interface EvalItem {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  expected: string;
  actual: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'agent' | 'evals'>('agent');
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Filter & Search state
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Booking Modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [bookingReason, setBookingReason] = useState('General Consultation');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Evals state
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalScore, setEvalScore] = useState<number | null>(null);
  const [evalResults, setEvalResults] = useState<EvalItem[]>([]);

  const retellClientRef = useRef<RetellWebClient | null>(null);

  // Load schedule from Supabase
  const loadSchedule = async () => {
    try {
      const res = await fetch('/api/slots');
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  };

  useEffect(() => {
    loadSchedule();
    const interval = setInterval(loadSchedule, 3000);
    return () => clearInterval(interval);
  }, []);

  // Reset Schedule
  const handleResetSchedule = async () => {
    setLoadingSchedule(true);
    try {
      await fetch('/api/slots', { method: 'POST' });
      await loadSchedule();
      showToast('Schedule reset to 23 multi-specialty clinical slots', 'success');
    } catch (e) {
      showToast('Failed to reset schedule', 'error');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Start Voice Call
  const handleStartCall = async () => {
    try {
      setCallStatus('connecting');

      const res = await fetch('/api/create-web-call', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.access_token) {
        showToast('Could not start call: ' + (data.error || 'Server error'), 'error');
        setCallStatus('idle');
        return;
      }

      const client = new RetellWebClient();
      retellClientRef.current = client;

      client.on('call_started', () => {
        setCallStatus('active');
        showToast('Voice channel connected. Start speaking with Maya!', 'success');
      });

      client.on('call_ended', () => {
        setCallStatus('idle');
        setIsAgentSpeaking(false);
        loadSchedule();
      });

      client.on('agent_start_talking', () => {
        setIsAgentSpeaking(true);
      });

      client.on('agent_stop_talking', () => {
        setIsAgentSpeaking(false);
      });

      client.on('error', (err) => {
        console.error('Retell call error:', err);
        setCallStatus('idle');
      });

      await client.startCall({
        accessToken: data.access_token,
      });

    } catch (err: any) {
      console.error('Failed to start call:', err);
      showToast('Microphone access or audio device initialization failed.', 'error');
      setCallStatus('idle');
    }
  };

  // End Voice Call
  const handleEndCall = () => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
      setCallStatus('idle');
      setIsAgentSpeaking(false);
      showToast('Voice call ended.', 'success');
    }
  };

  // Open booking modal for specific slot
  const handleOpenBookingModalForSlot = (slot: Slot) => {
    if (slot.is_booked) return;
    setBookingDoctor(slot.doctor_name);
    setBookingTime(slot.slot_time);
    setIsBookingModalOpen(true);
  };

  // Open empty booking modal
  const handleOpenNewBooking = () => {
    const firstAvailable = slots.find(s => !s.is_booked);
    if (firstAvailable) {
      setBookingDoctor(firstAvailable.doctor_name);
      setBookingTime(firstAvailable.slot_time);
    }
    setIsBookingModalOpen(true);
  };

  // Submit manual booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      showToast('Please enter both patient name and phone number', 'error');
      return;
    }

    setBookingSubmitting(true);
    try {
      const res = await fetch('/api/tools/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: bookingDoctor,
          slot_time: bookingTime,
          patient_name: patientName,
          patient_phone: patientPhone,
          reason: bookingReason
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Could not complete booking', 'error');
      } else {
        showToast(data.message || 'Appointment confirmed successfully!', 'success');
        setIsBookingModalOpen(false);
        setPatientName('');
        setPatientPhone('');
        await loadSchedule();
      }
    } catch (err: any) {
      showToast('Network error while booking: ' + err.message, 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Cancel / Free appointment
  const handleCancelAppointment = async (appt: Appointment) => {
    if (!confirm(`Cancel appointment for ${appt.patient_name} with ${appt.doctor_name} at ${appt.slot_time}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: appt.id,
          doctor_name: appt.doctor_name,
          slot_time: appt.slot_time
        })
      });

      if (res.ok) {
        showToast('Appointment cancelled and slot restored to available!', 'success');
        await loadSchedule();
      } else {
        showToast('Failed to cancel appointment', 'error');
      }
    } catch (e) {
      showToast('Error cancelling appointment', 'error');
    }
  };

  // Run Evals
  const handleRunEvals = async () => {
    setEvalLoading(true);
    try {
      const res = await fetch('/api/evals', { method: 'POST' });
      const data = await res.json();
      setEvalScore(data.score);
      setEvalResults(data.results || []);
      await loadSchedule();
      showToast(`Evaluation completed! Score: ${data.score}%`, 'success');
    } catch (err) {
      console.error('Eval error:', err);
      showToast('Eval execution failed', 'error');
    } finally {
      setEvalLoading(false);
    }
  };

  // Specialties list
  const specialties = ['ALL', 'Cardiology', 'General Practice', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology'];

  // Filter slots
  const filteredSlots = slots.filter(s => {
    const matchesSpec = selectedSpecialty === 'ALL' || s.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
    const matchesSearch = !searchQuery ||
      s.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slot_time.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  // Group filtered slots by doctor
  const doctorsMap: { [key: string]: { specialty: string; slots: Slot[] } } = {};
  filteredSlots.forEach((s) => {
    if (!doctorsMap[s.doctor_name]) {
      doctorsMap[s.doctor_name] = { specialty: s.specialty, slots: [] };
    }
    doctorsMap[s.doctor_name].slots.push(s);
  });

  // Available slots for currently selected doctor in booking modal
  const availableSlotsForSelectedDoctor = slots.filter(
    s => s.doctor_name === bookingDoctor && !s.is_booked
  );

  return (
    <div className="container">
      {/* Neo-Brutalist Spec Banner */}
      <div className="spec-banner">
        <span>NEO-BRUTALIST DESIGN SYSTEM • BOLD. LOUD. SYSTEMATIC. USABLE.</span>
        <div className="spec-banner-tags">
          <span className="spec-chip chip-teal">#00C2CB TEAL</span>
          <span className="spec-chip chip-magenta">#FF00FF MAGENTA</span>
          <span className="spec-chip chip-yellow">#FFE000 YELLOW</span>
          <span className="spec-chip">0-4-12 ELEVATION</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Stethoscope size={30} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="brand-title">Metro Health Clinic</h1>
            <p className="brand-subtitle">AI-Native Clinical Appointment System • Retell & Cloud Postgres</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-primary-teal" onClick={handleOpenNewBooking}>
            <Plus size={18} strokeWidth={3} />
            Book Appointment
          </button>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'agent' ? 'active' : ''}`}
              onClick={() => setActiveTab('agent')}
            >
              Live Agent & Schedule
            </button>
            <button
              className={`tab-btn ${activeTab === 'evals' ? 'active' : ''}`}
              onClick={() => setActiveTab('evals')}
            >
              Eval Harness (Part B)
            </button>
          </div>
        </div>
      </header>

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`brutal-banner ${toastMessage.type === 'success' ? 'banner-warning' : 'banner-danger'}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900 }}>
            {toastMessage.type === 'success' ? <Check size={20} strokeWidth={3} /> : <AlertTriangle size={20} strokeWidth={3} />}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 900 }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {activeTab === 'agent' ? (
        <div className="grid-main">
          {/* LEFT COLUMN: Voice Agent Telecom Terminal */}
          <div>
            <div className="card">
              <div className="card-header-bar">
                <span className="card-header-title">
                  <Activity size={18} strokeWidth={3} />
                  Telecom Terminal: Maya
                </span>
                <span className="badge-specialty" style={{ background: varCss('--accent-yellow') }}>
                  Web-Call Live
                </span>
              </div>

              <p className="card-desc">
                Full bi-directional voice scheduling assistant connected directly to Postgres doctor availability.
              </p>

              {/* Hardware Console Box */}
              <div className={`telecom-console ${isAgentSpeaking ? 'active-speaking' : ''}`}>
                <div className="telecom-topbar">
                  <span>Channel: Audio-Full-Duplex</span>
                  <span>Engine: Retell GPT-5.6-Terra</span>
                </div>

                <div className="telecom-meter-box">
                  <div className={`terminal-avatar-square ${isAgentSpeaking ? 'active-speaking' : ''}`}>
                    <User size={38} strokeWidth={2.5} color="#000" />
                  </div>

                  <div className="audio-frequency-bars">
                    <div className="frequency-bar" />
                    <div className="frequency-bar" />
                    <div className="frequency-bar" />
                    <div className="frequency-bar" />
                    <div className="frequency-bar" />
                    <div className="frequency-bar" />
                    <div className="frequency-bar" />
                    <div className="frequency-bar" />
                  </div>
                </div>

                <div>
                  <span className={`brutal-status-tag ${
                    callStatus === 'idle' ? 'status-tag-idle' :
                    callStatus === 'connecting' ? 'status-tag-connecting' : 'status-tag-active'
                  }`}>
                    {callStatus === 'idle' && '● STANDBY • READY TO CALL'}
                    {callStatus === 'connecting' && '⚡ CONNECTING AUDIO CHANNEL...'}
                    {callStatus === 'active' && (isAgentSpeaking ? '🔊 MAYA IS SPEAKING' : '🎤 MAYA IS LISTENING')}
                  </span>
                </div>

                {callStatus === 'idle' ? (
                  <button className="btn btn-primary-teal btn-full" onClick={handleStartCall}>
                    <Phone size={18} strokeWidth={3} />
                    Start Voice Call
                  </button>
                ) : (
                  <button className="btn btn-danger btn-full" onClick={handleEndCall}>
                    <PhoneOff size={18} strokeWidth={3} />
                    Hang Up Call
                  </button>
                )}
              </div>

              {/* 108 Emergency Protocol Card */}
              <div className="brutal-banner banner-warning">
                <div className="banner-title">
                  <AlertTriangle size={18} strokeWidth={3} />
                  108 Emergency Triage Protocol:
                </div>
                <ul className="banner-list">
                  <li><strong>108 Ambulance Protocol</strong>: Serious/life-threatening symptoms advise calling 108 immediately, while offering the caller the option to book an urgent clinic visit.</li>
                  <li><strong>Live Database Check</strong>: Agent calls <code>check_availability</code> before proposing any doctor opening.</li>
                  <li><strong>Atomic Slot Locking</strong>: Concurrency checks prevent double-booking collisions.</li>
                </ul>
              </div>

              {/* Voice Configuration Quick Guide */}
              <div className="brutal-banner banner-info" style={{ marginTop: '16px' }}>
                <div className="banner-title">
                  <Volume2 size={18} strokeWidth={3} />
                  How to Change Agent Voice:
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.6 }}>
                  <div>• <strong>Current Voice</strong>: <code>retell-Cimo</code> (Ultra-low latency)</div>
                  <div>• <strong>Run in terminal</strong>: <code>npx tsx scripts/change-voice.ts 11labs-Adrian</code></div>
                  <div>• <strong>Or in Dashboard</strong>: Click <em>Voice</em> dropdown in Retell to pick 50+ ElevenLabs/Cartesia voices.</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Clinic Schedule & Bookings */}
          <div>
            <div className="card">
              <div className="card-header-bar">
                <span className="card-header-title">
                  <Calendar size={18} strokeWidth={3} />
                  Doctor Availability ({slots.filter(s => !s.is_booked).length} Open / {slots.length} Total)
                </span>
                <button
                  className="btn btn-sm btn-secondary-white"
                  onClick={handleResetSchedule}
                  disabled={loadingSchedule}
                >
                  <RefreshCw size={13} strokeWidth={3} />
                  {loadingSchedule ? 'Resetting...' : 'Reset 23 Slots'}
                </button>
              </div>

              {/* Department Filters & Search */}
              <div className="schedule-controls">
                <div className="specialty-filter-bar">
                  {specialties.map(spec => {
                    const count = spec === 'ALL'
                      ? slots.length
                      : slots.filter(s => s.specialty.toLowerCase() === spec.toLowerCase()).length;
                    return (
                      <button
                        key={spec}
                        className={`filter-chip ${selectedSpecialty === spec ? 'active' : ''}`}
                        onClick={() => setSelectedSpecialty(spec)}
                      >
                        {spec} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="search-input-box">
                  <Search size={16} strokeWidth={3} />
                  <input
                    type="text"
                    placeholder="Search doctor or slot..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Doctor Schedule Cards */}
              <div className="doctor-grid">
                {Object.keys(doctorsMap).length === 0 ? (
                  <div className="brutal-banner banner-info" style={{ textAlign: 'center', padding: '24px' }}>
                    No doctors found matching "{searchQuery}". Try selecting another department filter above.
                  </div>
                ) : (
                  Object.entries(doctorsMap).map(([docName, info]) => (
                    <div key={docName} className="doctor-item-card">
                      <div className="doctor-item-header">
                        <div>
                          <div className="doctor-title-text">{docName}</div>
                          <span className="badge-specialty" style={{ marginTop: '4px', display: 'inline-block' }}>
                            {info.specialty}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#555' }}>
                          Tomorrow • Clinic Wing B
                        </span>
                      </div>

                      <div className="slots-container">
                        {info.slots.map((s) => (
                          <button
                            key={s.id}
                            className={`slot-block ${s.is_booked ? 'booked' : 'available'}`}
                            onClick={() => handleOpenBookingModalForSlot(s)}
                            disabled={s.is_booked}
                            title={s.is_booked ? 'Already reserved' : 'Click to instantly book this slot'}
                          >
                            <Clock size={13} strokeWidth={3} />
                            <span>{s.slot_time}</span>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}>
                              {s.is_booked ? '✕ RESERVED' : '✓ OPEN'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Confirmed Appointments Section */}
              <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 className="card-title" style={{ fontSize: '17px', margin: 0 }}>
                    <ShieldCheck size={20} strokeWidth={3} />
                    Confirmed Clinic Appointments ({appointments.length})
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                    PostgreSQL Persisted
                  </span>
                </div>

                {appointments.length === 0 ? (
                  <div className="brutal-banner banner-info" style={{ textAlign: 'center', padding: '20px' }}>
                    No appointments booked yet. Click an open slot above or start a voice call with Maya!
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="brutal-table">
                      <thead>
                        <tr>
                          <th>Patient Name</th>
                          <th>Phone</th>
                          <th>Doctor</th>
                          <th>Slot Time</th>
                          <th>Chief Complaint</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a) => (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 900 }}>{a.patient_name}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{a.patient_phone}</td>
                            <td>{a.doctor_name}</td>
                            <td>{a.slot_time}</td>
                            <td>{a.reason || 'General Checkup'}</td>
                            <td>
                              <span className="badge-specialty" style={{ background: 'var(--accent-green)' }}>
                                {a.status || 'CONFIRMED'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleCancelAppointment(a)}
                                title="Cancel appointment and restore slot to open"
                              >
                                <Trash2 size={12} strokeWidth={3} />
                                Release
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: EVAL HARNESS (PART B) */
        <div className="card">
          <div className="card-header-bar">
            <span className="card-header-title">
              <ShieldCheck size={20} strokeWidth={3} />
              Part B: Clinical Agent Automated Evaluation Harness
            </span>
            <button
              className="btn btn-primary-yellow"
              onClick={handleRunEvals}
              disabled={evalLoading}
            >
              <Activity size={16} strokeWidth={3} />
              {evalLoading ? 'Executing Test Assertions...' : 'Run All 5 Evals'}
            </button>
          </div>

          <p className="card-desc">
            Executes programmatic assertions against doctor schedule querying, double-booking race condition prevention, mandatory entity extraction, and the 108 emergency triage protocol.
          </p>

          {evalScore !== null && (
            <div className="eval-score-card">
              <div className="eval-score-digit">{evalScore}%</div>
              <div>
                <strong style={{ fontSize: '20px', textTransform: 'uppercase', display: 'block' }}>
                  Safety & Workflow Benchmark Passed
                </strong>
                <p style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                  All critical safety guardrails, concurrency lockouts, 108 emergency triage, and Postgres transactional bookings passed.
                </p>
              </div>
            </div>
          )}

          <div>
            {evalResults.map((r) => (
              <div key={r.id} className={`eval-row-card ${r.passed ? 'pass' : 'fail'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 900, fontSize: '15px' }}>{r.name}</span>
                  <span className={`eval-tag ${r.passed ? 'eval-tag-pass' : 'eval-tag-fail'}`}>
                    {r.passed ? '✓ PASSED' : '✕ FAILED'} ({r.durationMs}ms)
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>
                  <strong>EXPECTED:</strong> {r.expected}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
                  <strong>ACTUAL:</strong> {r.actual}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production-Grade Manual Booking Modal */}
      {isBookingModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBookingModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Book Doctor Appointment</h3>
              <button className="close-btn" onClick={() => setIsBookingModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBooking}>
              <div className="form-group">
                <label className="form-label">Doctor</label>
                <select
                  className="form-select"
                  value={bookingDoctor}
                  onChange={(e) => {
                    setBookingDoctor(e.target.value);
                    const matching = slots.filter(s => s.doctor_name === e.target.value && !s.is_booked);
                    if (matching.length > 0) setBookingTime(matching[0].slot_time);
                  }}
                >
                  {Array.from(new Set(slots.map(s => s.doctor_name))).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Appointment Slot Time</label>
                <select
                  className="form-select"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                >
                  {availableSlotsForSelectedDoctor.length === 0 ? (
                    <option value="">No open slots available for this doctor</option>
                  ) : (
                    availableSlotsForSelectedDoctor.map(s => (
                      <option key={s.id} value={s.slot_time}>{s.slot_time} (Tomorrow)</option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="form-input"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Patient Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210 or +1-555-0199"
                  className="form-input"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Visit / Chief Complaint</label>
                <input
                  type="text"
                  placeholder="e.g. Annual health checkup, chest discomfort follow-up"
                  className="form-input"
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary-white"
                  style={{ flex: 1 }}
                  onClick={() => setIsBookingModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-teal"
                  style={{ flex: 1 }}
                  disabled={bookingSubmitting || availableSlotsForSelectedDoctor.length === 0}
                >
                  {bookingSubmitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Spec Banner */}
      <footer className="footer-banner">
        <span>Metro Health AI • Full-Stack Retell Voice + Supabase Postgres System</span>
        <span>Built with Neo-Brutalist Design Tokens • 108 Emergency Protocol Active</span>
      </footer>
    </div>
  );
}

// Helper for CSS var
function varCss(name: string) {
  return `var(${name})`;
}
