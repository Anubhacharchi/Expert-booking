import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ExpertsList from './pages/ExpertsList';
import ExpertDetail from './pages/ExpertDetail';
import BookingForm from './pages/BookingForm';
import MyBookings from './pages/MyBookings';
import './styles/global.css';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<ExpertsList />} />
          <Route path="/experts/:id" element={<ExpertDetail />} />
          <Route path="/book/:expertId" element={<BookingForm />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1c28',
              color: '#f0f0f5',
              border: '1px solid #2a2a3a',
              borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#1c1c28' },
              duration: 4000,
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1c1c28' },
              duration: 5000,
            },
          }}
        />
      </Router>
    </SocketProvider>
  );
}

export default App;
