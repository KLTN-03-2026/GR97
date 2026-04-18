import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../lib/api';
import AuthForms from '../components/AuthForms';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login({ email, password });
            navigate('/dashboard'); // Redirect to dashboard after successful login
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="login-page">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <AuthForms 
                email={email} 
                setEmail={setEmail} 
                password={password} 
                setPassword={setPassword} 
                handleSubmit={handleSubmit} 
            />
        </div>
    );
};

export default LoginPage;