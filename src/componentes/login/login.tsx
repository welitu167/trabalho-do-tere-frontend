import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './Login.css';

interface LoginResponse {
    token: string;
    tipo: string;
    nome?: string;
}

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setIsLoading(true);

        try {
            const response = await api.post<LoginResponse>('/login', { email, senha });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('tipo', response.data.tipo);
            localStorage.setItem('nome', response.data.nome || 'Usuário');
            navigate('/');
        } catch (error: unknown) {
            if (error instanceof Error) {
                setErro(error.message);
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                setErro(axiosError.response?.data?.message || 'Erro ao fazer login');
            } else {
                setErro('Ocorreu um erro inesperado');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Texto de fundo - AGORA DEVE APARECER */}
            <div className="brand-text">Augusto´s MarketGreen</div>
            <div className="particles"></div>
            
            <form className="login-form" onSubmit={handleLogin}>
                <h1 className="login-title">Login</h1>
                
                <div className="form-group">
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="form-input"
                        required
                        disabled={isLoading}
                    />
                </div>
                
                <div className="form-group">
                    <input 
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Senha"
                        className="form-input"
                        required
                        disabled={isLoading}
                    />
                </div>
                
                {erro && <div className="error-message">{erro}</div>}
                
                <button 
                    type="submit" 
                    className="login-button"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="loading-spinner"></span>
                            Carregando...
                        </>
                    ) : (
                        'Entrar'
                    )}
                </button>
            </form>
        </div>
    );
}

export default Login;