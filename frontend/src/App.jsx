import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LoginPage from '../features/01-auth/frontend/pages/LoginPage';
import AppointmentsPage from '../features/02-appointments/frontend/pages/AppointmentsPage';
import ChatPage from '../features/03-chat/frontend/pages/ChatPage';
import DoctorsPage from '../features/04-doctors/frontend/pages/DoctorsPage';
import AdminPage from '../features/05-admin/frontend/pages/AdminPage';
import PaymentPage from '../features/06-payments/frontend/pages/PaymentPage';
import RecordsPage from '../features/07-records/frontend/pages/RecordsPage';
import VideoPage from '../features/08-video-consultation/frontend/pages/VideoPage';

const App = () => {
    return (
        <Router>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/appointments" element={<AppointmentsPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/doctors" element={<DoctorsPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/payments" element={<PaymentPage />} />
                    <Route path="/records" element={<RecordsPage />} />
                    <Route path="/video" element={<VideoPage />} />
                </Routes>
            </AppLayout>
        </Router>
    );
};

export default App;