import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiDownload } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DashboardPage.css';

export default function ReliabilityAnalyticsPage() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setChartData([
        { month: 'Jan', saifi: 1.2, saidi: 45, caidi: 37.5 },
        { month: 'Feb', saifi: 1.1, saidi: 42, caidi: 38.2 },
        { month: 'Mar', saifi: 1.3, saidi: 48, caidi: 36.9 },
        { month: 'Apr', saifi: 1.15, saidi: 44, caidi: 38.3 },
        { month: 'May', saifi: 1.05, saidi: 41, caidi: 39.0 },
        { month: 'Jun', saifi: 0.95, saidi: 38, caidi: 40.0 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Reliability Analytics</div>
          <div className="page-subtitle">System reliability metrics and trends</div>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiDownload /> Export Report
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading analytics...</div>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h2>SAIFI / SAIDI Trend</h2>
              <p>System Average Interruption Frequency Index / System Average Interruption Duration Index</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="saifi" stroke="#ff7300" strokeWidth={2} />
                <Line type="monotone" dataKey="saidi" stroke="#0066cc" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>CAIDI Trend</h2>
              <p>Customer Average Interruption Duration Index</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="caidi" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginTop: 24 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#ff7300' }}>
                  <FiTrendingUp />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Avg SAIFI
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#ff7300' }}>1.12</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>System interruptions per year</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#0066cc' }}>
                  <FiTrendingUp />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Avg SAIDI
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#0066cc' }}>43.2</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Minutes of interruption per year</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32, color: '#82ca9d' }}>
                  <FiTrendingUp />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Avg CAIDI
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#82ca9d' }}>38.6</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Minutes per interruption</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
