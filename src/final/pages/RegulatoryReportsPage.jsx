import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiDownload } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DashboardPage.css';

export default function RegulatoryReportsPage() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setChartData([
        { quarter: 'Q1 2025', compliance: 98.5, audits: 2, violations: 0 },
        { quarter: 'Q2 2025', compliance: 99.1, audits: 1, violations: 0 },
        { quarter: 'Q3 2025', compliance: 98.8, audits: 3, violations: 1 },
        { quarter: 'Q4 2025', compliance: 99.3, audits: 2, violations: 0 },
        { quarter: 'Q1 2026', compliance: 99.5, audits: 2, violations: 0 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Regulatory Reports</div>
          <div className="page-subtitle">Compliance status and regulatory filings</div>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiDownload /> Export Report
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading regulatory data...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#5cb85c' }}>
                  <FiBarChart2 />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Compliance Rate
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#5cb85c' }}>99.5%</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current quarter</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#0066cc' }}>
                  <FiBarChart2 />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Total Audits
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#0066cc' }}>10</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 12 months</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#5cb85c' }}>
                  <FiBarChart2 />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Violations
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#5cb85c' }}>1</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 12 months</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Compliance Trend</h2>
              <p>Quarterly compliance rates</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis domain={[96, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="compliance" stroke="#5cb85c" strokeWidth={2} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Pending Filings</h2>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Report Type</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Q1 2026 Compliance Report</td>
                    <td>2026-04-30</td>
                    <td><span className="badge badge-yellow">In Preparation</span></td>
                    <td><button className="btn btn-link">View</button></td>
                  </tr>
                  <tr>
                    <td>Annual Safety Report 2025</td>
                    <td>2026-03-15</td>
                    <td><span className="badge badge-green">Submitted</span></td>
                    <td><button className="btn btn-link">View</button></td>
                  </tr>
                  <tr>
                    <td>Reliability Performance Report</td>
                    <td>2026-02-28</td>
                    <td><span className="badge badge-green">Submitted</span></td>
                    <td><button className="btn btn-link">View</button></td>
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
