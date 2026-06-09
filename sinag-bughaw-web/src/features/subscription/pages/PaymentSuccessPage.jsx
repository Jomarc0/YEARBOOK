import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentsApi } from '@/api/payment.api';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Confirming your subscription...');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const confirmPayment = async () => {
      const sessionId = localStorage.getItem('pending_paymongo_session_id');

      if (!sessionId) {
        setMessage('Payment received. Refresh your subscription status in a moment.');
        return;
      }

      try {
        await paymentsApi.confirm(sessionId);
        if (cancelled) return;
        localStorage.removeItem('pending_paymongo_session_id');
        window.dispatchEvent(new Event('notifications:refresh'));
        setConfirmed(true);
        setMessage('Your subscription is now active.');
      } catch (err) {
        if (cancelled) return;
        setMessage(err.response?.data?.message || 'Payment received, but confirmation failed. Please refresh.');
      }
    };

    confirmPayment();

    const timer = setTimeout(() => navigate('/'), 5000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#f8fafc' }}>
      <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
        <i className={`fas ${confirmed ? 'fa-check-circle text-green-500' : 'fa-spinner fa-spin text-[#fdb813]'} text-6xl mb-4`} />
        <h1 className="text-2xl font-extrabold text-[#1d2b4b] mb-2">Payment Successful!</h1>
        <p className="text-slate-400 mb-6">{message}</p>
        <a href="/" className="px-6 py-3 bg-[#1d2b4b] text-white rounded-xl font-bold">
          Go to Home
        </a>
      </div>
    </div>
  );
}
