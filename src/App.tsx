import React, { useState, useEffect } from 'react'
// @ts-ignore
import './App.css'
import api from './api/api'
import AlertProvider, { useAlerts } from './components/AlertProvider'

type ProdutoType = {
  _id: string,
  nome: string,
  preco: number,
  descricao: string,
  urlfoto: string,
  categoria?: string
}

function AppInner() {
  const [produtos, setProdutos] = useState<ProdutoType[]>([])
  const [carrinho, setCarrinho] = useState<any>(null)
  const [tipo, setTipo] = useState<string | null>(null)
  const [nome, setNome] = useState<string | null>(null)
  const alerts = useAlerts()

  useEffect(() => {
    api.get("/produtos")
      .then((response) => setProdutos(response.data))
      .catch((error) => {
        if (error.response) {
          console.error(`Servidor respondeu mas com o erro:${error.response.data.mensagem ?? error.response.data}`)
          alerts.showAlert('error', `Servidor respondeu mas com o erro:${error.response.data.mensagem ?? "olhe o console do navegador para mais informa\u00e7\u00f5es"}`)
        }
        else { //Não teve resposta do servidor, então mostramos o erro do axios.vercellokoi
          console.error(`Erro Axios: ${error.message}`)
          alerts.showAlert('error', `Servidor não respondeu, voc\u00ea ligou o backend? Erro do Axios: ${error.message ?? "Erro desconhecido"}`)
        }
      })
  }, [])

  useEffect(()=>{
    const t = localStorage.getItem('tipo') || localStorage.getItem('role')
    if(t) setTipo(t.toString().toUpperCase())
    
    const n = localStorage.getItem('nome')
    if(n) setNome(n)
  }, [])

  useEffect(()=>{
    // recalcula total localmente sempre que o carrinho mudar
    if(carrinho){
      const total = carrinho.itens.reduce((acc:any, item:any) => acc + item.precoUnitario * item.quantidade, 0)
      setCarrinho({...carrinho, total})
    }
  }, [carrinho?.itens?.length])

  function showError(err:any){
    const msg = err?.response?.data?.mensagem ?? err?.message ?? 'Erro desconhecido'
    alerts.showAlert('error', msg)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nome = formData.get("nome")
    const preco = Number(formData.get("preco"))
    const descricao = formData.get("descricao")
    const urlfoto = formData.get("urlfoto")
    const categoria = formData.get("categoria")
    const produto = { nome, preco, descricao, urlfoto, categoria: categoria || undefined }
    api.post("/produtos", produto)
      .then((response) => setProdutos([...produtos, response.data]))
      .catch((error) => {
        showError(error)
      })
  }

  function adicionarItemCarrinho(produtoId:string){
    api.post("/adicionarItem", {produtoId,quantidade:1})
      .then((r) => { setCarrinho(r.data); alerts.showAlert('success', 'Produto adicionado com sucesso!') })
      .catch((error) => showError(error))
  }

  function fetchCarrinho(){
    api.get('/carrinho')
      .then(r=> setCarrinho(r.data))
      .catch(()=> setCarrinho(null))
  }

  function atualizarQuantidade(produtoId:string, quantidade:number){
    api.patch('/carrinho/quantidade', {produtoId, quantidade})
      .then(r=> setCarrinho(r.data))
      .catch((err)=> showError(err))
  }

  function removerItem(produtoId:string){
    api.delete('/carrinho/item', { data: { produtoId } })
      .then(r=> setCarrinho(r.data))
      .catch((err)=> showError(err))
  }

  function esvaziarCarrinho(){
    api.delete('/carrinho')
      .then(()=> { setCarrinho(null); alerts.showAlert('info','Carrinho esvaziado') })
      .catch((err)=> showError(err))
  }

  async function excluirCarrinho(){
    const ok = await alerts.showConfirm('Tem certeza que deseja excluir o carrinho do banco? Esta ação não pode ser desfeita.')
    if(!ok) return
    api.delete('/carrinho')
      .then(()=> { setCarrinho(null); alerts.showAlert('success','Carrinho excluído do banco com sucesso') })
      .catch((err)=> showError(err))
  }

  function logout(){
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('tipo')
    localStorage.removeItem('nome')
    setTipo(null)
    setNome(null)
    window.location.href = '/login'
  }

  async function abrirEdicao(produto:ProdutoType){
    const novoNome = await alerts.showPrompt('Novo nome:', produto.nome)
    if(novoNome === null) return // cancelou

    const novoPreco = await alerts.showPrompt('Novo preço (R$):', String(produto.preco))
    if(novoPreco === null) return // cancelou

    const novaCategoria = await alerts.showPrompt('Nova categoria (deixe em branco para remover):', produto.categoria || '')
    if(novaCategoria === null) return // cancelou

    api.put(`/produtos/${produto._id}`, { 
      nome: novoNome, 
      preco: Number(novoPreco), 
      categoria: novaCategoria || undefined 
    })
      .then(r=>{
        setProdutos(produtos.map(p=> p._id === produto._id ? r.data : p))
        alerts.showAlert('success','Produto editado com sucesso!')
      })
      .catch(showError)
  }

  function removerProduto(produtoId:string){
    api.delete(`/produtos/${produtoId}`)
      .then(()=> setProdutos(produtos.filter(p=> p._id !== produtoId)))
      .catch(showError)
  }

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>Loja</h1>
        <div>
          {tipo && nome ? (
            <span style={{marginRight:16, fontSize: '14px'}}>
              👤 <strong>{nome}</strong> ({tipo})
            </span>
          ) : tipo ? (
            <span style={{marginRight:8}}>Tipo: {tipo}</span>
          ) : null}
          {tipo === 'ADMIN' && (
            <button 
              onClick={() => window.location.href = '/admin'} 
              style={{marginRight:8}}
            >
              Área Admin
            </button>
          )}
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* show create-product form only to admins */}
      {tipo === 'ADMIN' && (
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder='Nome' name="nome" />
          <input type="number" placeholder='Preço' name="preco" />
          <input type="text" placeholder='Descrição' name="descricao" />
          <input type="text" placeholder='URL Foto' name="urlfoto" />
          <input type="text" placeholder='Categoria (opcional)' name="categoria" />

          <button type='submit'>Cadastrar</button>
        </form>
      )}

      <h2>Lista de produtos</h2>
      <div className="container-produtos">
        {
          produtos.map((produto) => {
            return (
              <div key={produto._id}>
                <h3>{produto.nome}</h3>
                {/* Container de imagem com tamanho fixo */}
                <div style={{
                  width: '200px',
                  height: '200px',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f0f0f0',
                  marginBottom: '12px'
                }}>
                  <img 
                    src={produto.urlfoto} 
                    alt='Imagem do produto' 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <p>Preço: R$ {produto.preco}</p>
                <p>Descrição: {produto.descricao}</p>
                <button onClick={()=>adicionarItemCarrinho(produto._id)}>Adicionar ao Carrinho</button>
                {tipo === 'ADMIN' && (
                  <>
                    <button onClick={()=> abrirEdicao(produto)}>Editar</button>
                    <button onClick={()=> removerProduto(produto._id)}>Remover</button>
                  </>
                )}
              </div>
            )
          })
        }
      </div>

      <h2>Meu Carrinho</h2>
      <div style={{marginBottom:12}}>
        <button onClick={fetchCarrinho}>Atualizar Carrinho</button>
        <button onClick={esvaziarCarrinho} style={{marginLeft:8}}>Esvaziar Carrinho</button>
        <button onClick={excluirCarrinho} style={{marginLeft:8, backgroundColor:'#ff6b6b', color:'#fff'}}>Excluir Carrinho (Banco)</button>
        <button onClick={() => window.location.href = '/pagamento.html'} style={{marginLeft:8, backgroundColor:'#2b6cb0', color:'#fff'}}>Pagamento</button>
      </div>

      {carrinho ? (
        <div>
          {carrinho.itens.map((item:any)=> (
            <div key={item.produtoId}>
              <p>{item.nome} - R$ {item.precoUnitario} x {item.quantidade}</p>
              <button onClick={()=> atualizarQuantidade(item.produtoId, Math.max(0, item.quantidade - 1))}>-</button>
              <button onClick={()=> atualizarQuantidade(item.produtoId, item.quantidade + 1)}>+</button>
              <button onClick={()=> removerItem(item.produtoId)}>Remover</button>
            </div>
          ))}
          <p><strong>Total: R$ {carrinho.total}</strong></p>
        </div>
      ) : <p>Sem carrinho</p>}
    </>
  )
}

function App(){
  return (
    <AlertProvider>
      <AppInner />
    </AlertProvider>
  )
}

export default App

