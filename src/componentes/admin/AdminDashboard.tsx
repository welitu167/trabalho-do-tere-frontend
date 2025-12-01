import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import './AdminDashboard.css';

interface Usuario {
  _id: string;
  nome: string;
  email: string;
  tipo: string;
}

interface Carrinho {
  _id: string;
  usuarioId: string;
  usuarioNome: string;
  itens: any[];
  total: number;
  dataAtualizacao: string;
}

function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carrinhos, setCarrinhos] = useState<Carrinho[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [usuariosResp, carrinhosResp] = await Promise.all([
        api.get('/usuarios'),
        api.get('/admin/carrinhos')
      ]);
      setUsuarios(usuariosResp.data);
      setCarrinhos(carrinhosResp.data);
    } catch (error: any) {
      setErro(error.response?.data?.message || 'Erro ao carregar dados');
    }
  }

  async function removerUsuario(id: string) {
    try {
      await api.delete(`/admin/usuario/${id}`);
      setUsuarios(usuarios.filter(u => u._id !== id));
    } catch (error: any) {
      setErro(error.response?.data?.message || 'Erro ao remover usuário');
    }
  }

  async function removerCarrinho(id: string) {
    try {
      await api.delete(`/admin/carrinho/${id}`);
      setCarrinhos(carrinhos.filter(c => c._id !== id));
    } catch (error: any) {
      setErro(error.response?.data?.message || 'Erro ao remover carrinho');
    }
  }

  function voltarHome() {
    window.location.href = '/';
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 style={{margin:0}}>Admin Dashboard</h2>
        <button
          onClick={voltarHome}
          style={{
            background:'#0ea5a4',
            color:'#fff',
            padding:'8px 12px',
            borderRadius:8,
            border:'none',
            cursor:'pointer'
          }}
        >
          ← Voltar à página inicial
        </button>
      </div>

      {erro && <p className="erro-mensagem">{erro}</p>}
      
      <h3>Usuários</h3>
      {usuarios.length === 0 ? (
        <p className="lista-vazia">Nenhum usuário encontrado</p>
      ) : (
        <ul className="usuarios-lista">
          {usuarios.map(usuario => (
            <li key={usuario._id}>
              <div className="item-info">
                <span className="usuario-info">
                  {usuario.nome}
                  <span className="usuario-email">({usuario.email})</span>
                  <span className="usuario-tipo">{usuario.tipo}</span>
                </span>
              </div>
              <button 
                className="btn-remover"
                onClick={() => removerUsuario(usuario._id)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <h3>Carrinhos</h3>
      {carrinhos.length === 0 ? (
        <p className="lista-vazia">Nenhum carrinho encontrado</p>
      ) : (
        <ul className="carrinhos-lista">
          {carrinhos.map(carrinho => (
            <li key={carrinho._id}>
              <div className="item-info">
                <div className="carrinho-info">
                  <span className="carrinho-usuario">{carrinho.usuarioNome}</span>
                  <span className="carrinho-total">Total: R$ {carrinho.total.toFixed(2)}</span>
                  <span className="carrinho-data">
                    Atualizado em: {new Date(carrinho.dataAtualizacao).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                className="btn-remover"
                onClick={() => removerCarrinho(carrinho._id)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminDashboard;