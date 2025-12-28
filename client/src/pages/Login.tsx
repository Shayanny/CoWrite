import { useState } from 'react';
import { authService } from '../services/authService';
import './Login.css';


function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        //prevent page refresh
        e.preventDefault();
        setError('');
        setLoading(true);

        const response = await authService.login({ email, password });

        setLoading(false);

        if (response.error) {
            setError(response.error);
        } else {
            console.log('User:', authService.getUser());
            // Full page reload to /dashboard
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>CoWrite</h1>
                <p className="subtitle">Collaborative Document Editing</p>

                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="cooldude123@example.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="switch-auth">
                    Don't have an account? <a href="/register">Register here</a>
                </p>
            </div>
        </div>
    );
}

export default Login;