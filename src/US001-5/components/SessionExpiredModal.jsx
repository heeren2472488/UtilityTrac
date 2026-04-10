export default function SessionExpiredModal({ onLogin }) {
  return (
    <div style={backdrop}>
      <div style={modal}>
        <h3>Session Expired</h3>
        <p>Your session has expired. Please login again.</p>
        <button onClick={onLogin}>Login</button>
      </div>
    </div>
  );
}

const backdrop = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modal = {
  background: '#ff0000ff',
  padding: 24,
  borderRadius: 8,
  width: 300,
  textAlign: 'center',
};