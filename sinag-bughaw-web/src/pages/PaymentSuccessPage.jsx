import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home after 5 seconds
    const timer = setTimeout(() => navigate('/'), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#f8fafc' }}>
      <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
        <i className="fas fa-check-circle text-green-500 text-6xl mb-4" />
        <h1 className="text-2xl font-extrabold text-[#1d2b4b] mb-2">Payment Successful!</h1>
        <p className="text-slate-400 mb-6">Your Sinag-Bughaw Premium is now active.</p>
        <a href="/" className="px-6 py-3 bg-[#1d2b4b] text-white rounded-xl font-bold">
          Go to Home
        </a>
      </div>
    </div>
  );
}