import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AdminDashboard from '../features/05-admin/frontend/components/AdminDashboard';
import LoginPage from '../features/01-auth/frontend/pages/LoginPage';
import AppointmentsPage from '../features/02-appointments/frontend/pages/AppointmentsPage';
import ChatPage from '../features/03-chat/frontend/pages/ChatPage';
import DoctorsPage from '../features/04-doctors/frontend/pages/DoctorsPage';
import PaymentPage from '../features/06-payments/frontend/pages/PaymentPage';
import RecordsPage from '../features/07-records/frontend/pages/RecordsPage';
import VideoPage from '../features/08-video-consultation/frontend/pages/VideoPage';

const App = () => {
    return (
        <Router>
            <Switch>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/login" component={LoginPage} />
                <Route path="/appointments" component={AppointmentsPage} />
                <Route path="/chat" component={ChatPage} />
                <Route path="/doctors" component={DoctorsPage} />
                <Route path="/payments" component={PaymentPage} />
                <Route path="/records" component={RecordsPage} />
                <Route path="/video" component={VideoPage} />
            </Switch>
        </Router>
    );
};

export default App;