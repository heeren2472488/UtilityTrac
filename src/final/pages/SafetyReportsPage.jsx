import React, { useState, useEffect } from 'react';
import { FiShield, FiDownload, FiAlertTriangle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DashboardPage.css';

export default function SafetyReportsPage() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setChartData([
        { month: 'Jan', incidents: 2, nearMiss: 5, violations: 0 },
        { month: 'Feb', incidents: 1, nearMiss: 3, violations: 1 },
        { month: 'Mar', incidents: 3, nearMiss: 7, violations: 0 },
        { month: 'Apr', incidents: 2, nearMiss: 4, violations: 0 },
        { month: 'May', incidents: 1, nearMiss: 2, violations: 0 },
        { month: 'Jun', incidents: 0, nearMiss: 1, violations: 0 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Safety Reports</div>
          <div className="page-subtitle">Safety incidents, near misses, and compliance</div>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiDownload /> Export Report
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading safety data...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#d9534f' }}>
                  <FiAlertTriangle />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Total Incidents
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#d9534f' }}>9</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 6 months</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#f0ad4e' }}>
                  <FiShield />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Near Misses
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#f0ad4e' }}>22</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 6 months</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#5cb85c' }}>
                  <FiShield />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Violations
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#5cb85c' }}>1</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 6 months</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Safety Events Trend</h2>
              <p>Incidents, near misses, and regulatory violations</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="incidents" fill="#d9534f" />
                <Bar dataKey="nearMiss" fill="#f0ad4e" />
                <Bar dataKey="violations" fill="#5cb85c" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Recent Safety Events</h2>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2026-04-14</td>
                    <td><span className="badge badge-red">Incident</span></td>
                    <td>District 7 - Main Substation</td>
                    <td><span style={{ color: '#d9534f', fontWeight: 600 }}>High</span></td>
                    <td><span className="badge badge-green">Resolved</span></td>
                  </tr>
                  <tr>
                    <td>2026-04-10</td>
                    <td><span className="badge badge-yellow">Near Miss</span></td>
                    <td>District 3 - Field Work</td>
                    <td><span style={{ color: '#f0ad4e', fontWeight: 600 }}>Medium</span></td>
                    <td><span className="badge badge-green">Resolved</span></td>
                  </tr>
                  <tr>
                    <td>2026-04-05</td>
                    <td><span className="badge badge-yellow">Near Miss</span></td>
                    <td>District 2 - Cable Work</td>
                    <td><span style={{ color: '#f0ad4e', fontWeight: 600 }}>Low</span></td>
                    <td><span className="badge badge-green">Resolved</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
