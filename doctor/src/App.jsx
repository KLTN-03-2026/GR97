import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import DoctorsPage from '../../features/04-doctors/frontend/pages/DoctorsPage';
import AppointmentsPage from '../../features/02-appointments/frontend/pages/AppointmentsPage';
import ChatPage from '../../features/03-chat/frontend/pages/ChatPage';
import PaymentPage from '../../features/06-payments/frontend/pages/PaymentPage';
import RecordsPage from '../../features/07-records/frontend/pages/RecordsPage';
import VideoPage from '../../features/08-video-consultation/frontend/pages/VideoPage';
import AdminPage from '../../features/05-admin/frontend/pages/AdminPage';
import LoginPage from '../../features/01-auth/frontend/pages/LoginPage';

const App = () => {
    return (
        <Router>
            <AppLayout>
                <Switch>
                    <Route path="/doctors" component={DoctorsPage} />
                    <Route path="/appointments" component={AppointmentsPage} />
                    <Route path="/chat" component={ChatPage} />
                    <Route path="/payments" component={PaymentPage} />
                    <Route path="/records" component={RecordsPage} />
                    <Route path="/video" component={VideoPage} />
                    <Route path="/admin" component={AdminPage} />
                    <Route path="/login" component={LoginPage} />
                </Switch>
            </AppLayout>
        </Router>
    );
};

export default App;