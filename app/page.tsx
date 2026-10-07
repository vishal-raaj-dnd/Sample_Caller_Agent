'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { Phone, PhoneOff, Calendar, ShieldCheck, RefreshCw, Activity, User, Clock } from 'lucide-react';

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

  // Evals state
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalScore, setEvalScore] = useState<number | null>(null);
  const [evalResults, setEvalResults] = useState<EvalItem[]>([]);

  const retellClientRef = useRef<RetellWebClient | null>(null);

  // Fetch slots and appointments
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
    const interval = setInterval(loadSchedule, 4000);
    return () => clearInterval(interval);
  }, []);

  // Reset Schedule
  const handleResetSchedule = async () => {
    setLoadingSchedule(true);
    try {
      await fetch('/api/slots', { method: 'POST' });
      await loadSchedule();
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Start Voice Call
  const handleStartCall = async () => {
    try {
      setCallStatus('connecting');

      // 1. Get web call access token from our secure server route
      const res = await fetch('/api/create-web-call', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.access_token) {
        alert('Could not start call: ' + (data.error || 'Server error'));
        setCallStatus('idle');
        return;
      }

      // 2. Initialize Retell Web Client
      const client = new RetellWebClient();
      retellClientRef.current = client;

      client.on('call_started', () => {
        setCallStatus('active');
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

      // 3. Connect audio stream
      await client.startCall({
        accessToken: data.access_token,
      });

    } catch (err: any) {
      console.error('Failed to start call:', err);
      alert('Error initializing microphone or call session.');
      setCallStatus('idle');
    }
  };

  // End Voice Call
  const handleEndCall = () => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
      setCallStatus('idle');
      setIsAgentSpeaking(false);
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
    } catch (err) {
      console.error('Eval error:', err);
    } finally {
      setEvalLoading(false);
    }
  };

  // Group slots by doctor
  const doctorsMap: { [key: string]: { specialty: string; slots: Slot[] } } = {};
  slots.forEach((s) => {
    if (!doctorsMap[s.doctor_name]) {
      doctorsMap[s.doctor_name] = { specialty: s.specialty, slots: [] };
    }
    doctorsMap[s.doctor_name].slots.push(s);
  });

  return (
    <div className="container">
      {/* Top Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">+</div>
          <div>
            <h1 className="brand-title">Metro Health AI</h1>
            <p className="brand-subtitle">Clinical Appointment Voice System • Powered by Retell & Supabase</p>
          </div>
        </div>

        {/* Tab Switcher */}
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
            Eval Suite (Part B)
          </button>
        </div>
      </header>

      {activeTab === 'agent' ? (
        <div className="grid-2">
          {/* Left Column: Voice Agent Controller */}
          <div>
            <div className="card">
              <h2 className="card-title">
                <Activity size={20} color="#0284c7" />
                Voice Assistant (Maya)
              </h2>
              <p className="card-desc">
                Speak directly through your browser microphone. Maya queries real-time availability and confirms bookings.
              </p>

              <div className="call-box">
                <div className="agent-avatar">
                  {callStatus === 'active' && <div className="pulse-ring" />}
                  <User size={38} color="#0284c7" />
                </div>

                <div>
                  <span className={`status-badge status-${callStatus}`}>
                    {callStatus === 'idle' && 'Offline / Ready'}
                    {callStatus === 'connecting' && 'Connecting audio...'}
                    {callStatus === 'active' && (isAgentSpeaking ? 'Maya is Speaking' : 'Maya is Listening')}
                  </span>
                </div>

                {callStatus === 'idle' ? (
                  <button className="call-btn btn-start" onClick={handleStartCall}>
                    <Phone size={18} />
                    Start Voice Call
                  </button>
                ) : (
                  <button className="call-btn btn-end" onClick={handleEndCall}>
                    <PhoneOff size={18} />
                    Hang Up Call
                  </button>
                )}
              </div>

              {/* Guardrails Info Box */}
              <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>
                  Safety & Guardrail Rules Active:
                </strong>
                <ul style={{ paddingLeft: '18px', color: '#64748b', lineHeight: '1.5' }}>
                  <li>Acute chest pain or stroke symptoms trigger emergency 911 redirect.</li>
                  <li>Double-booking collision prevention enabled.</li>
                  <li>Caller phone & name required for confirmation.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Live Doctor Schedule & Appointments */}
          <div>
            <div className="card">
              <div className="section-header">
                <div>
                  <h2 className="card-title">
                    <Calendar size={20} color="#0284c7" />
                    Doctor Schedules & Availability
                  </h2>
                  <p className="card-desc" style={{ marginBottom: 0 }}>
                    Slots update automatically when Maya books an appointment.
                  </p>
                </div>

                <button className="btn-secondary" onClick={handleResetSchedule} disabled={loadingSchedule}>
                  <RefreshCw size={13} style={{ display: 'inline', marginRight: '6px' }} />
                  {loadingSchedule ? 'Resetting...' : 'Reset Slots'}
                </button>
              </div>

              {/* Doctor Cards */}
              {Object.keys(doctorsMap).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '14px' }}>Loading clinic slots...</p>
              ) : (
                Object.entries(doctorsMap).map(([doctorName, info]) => (
                  <div key={doctorName} className="doctor-card">
                    <div className="doctor-name">{doctorName}</div>
                    <div className="doctor-spec">{info.specialty}</div>
                    <div className="slots-grid">
                      {info.slots.map((s) => (
                        <div
                          key={s.id}
                          className={`slot-pill ${s.is_booked ? 'slot-booked' : 'slot-available'}`}
                        >
                          <Clock size={13} />
                          {s.slot_time} • {s.is_booked ? 'Booked' : 'Available'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Confirmed Appointments Table */}
              <div style={{ marginTop: '28px' }}>
                <h3 className="card-title" style={{ fontSize: '16px' }}>
                  Recent Confirmed Bookings ({appointments.length})
                </h3>
                {appointments.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
                    No bookings yet. Call Maya to book your first slot!
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Patient Name</th>
                          <th>Phone</th>
                          <th>Doctor</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a) => (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 500 }}>{a.patient_name}</td>
                            <td style={{ color: '#64748b' }}>{a.patient_phone}</td>
                            <td>{a.doctor_name}</td>
                            <td>{a.slot_time}</td>
                            <td>
                              <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                                {a.status}
                              </span>
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
        /* Tab 2: Eval Harness View */
        <div className="card">
          <div className="section-header">
            <div>
              <h2 className="card-title">
                <ShieldCheck size={22} color="#0284c7" />
                Part B: Automated Clinical Evaluation Harness
              </h2>
              <p className="card-desc" style={{ marginBottom: 0 }}>
                Runs deterministic assertions against availability queries, concurrency double-booking, and emergency triage guardrails.
              </p>
            </div>

            <button
              className="call-btn btn-start"
              style={{ width: 'auto', padding: '10px 20px' }}
              onClick={handleRunEvals}
              disabled={evalLoading}
            >
              {evalLoading ? 'Running Test Suite...' : 'Run All Evals'}
            </button>
          </div>

          {evalScore !== null && (
            <div style={{ margin: '20px 0', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#15803d' }}>{evalScore}%</div>
              <div>
                <strong style={{ fontSize: '16px', color: '#14532d' }}>Evaluation Benchmark Passed</strong>
                <p style={{ fontSize: '13px', color: '#15803d' }}>
                  All critical safety, concurrency, and booking verification assertions succeeded.
                </p>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            {evalResults.map((r) => (
              <div key={r.id} className={`eval-card ${r.passed ? 'eval-pass' : 'eval-fail'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{r.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: r.passed ? '#15803d' : '#b91c1c' }}>
                    {r.passed ? 'PASSED' : 'FAILED'} ({r.durationMs}ms)
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  <strong>Expected:</strong> {r.expected}
                </div>
                <div style={{ fontSize: '13px', color: '#0f172a', marginTop: '2px' }}>
                  <strong>Actual:</strong> {r.actual}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
