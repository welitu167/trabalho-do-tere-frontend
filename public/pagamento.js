// pagamento.js
// Payment Elements for the frontend project (static page)
// IMPORTANT: Publishable Key (pk_...) - nunca coloque a Secret Key no frontend.
// Try to read the publishable key from several sources so builds and local tests work.
const PUBLISHABLE_KEY = (
  // explicit runtime injection (useful for embeds)
  (typeof window !== 'undefined' && (window.__STRIPE_PUBLISHABLE__ || window.__VITE_STRIPE_PUBLIC_KEY__)) ||
  // saved in localStorage for quick testing
  (typeof localStorage !== 'undefined' && localStorage.getItem('VITE_STRIPE_PUBLIC_KEY')) ||
  // Vite build-time variable (if the file is processed by Vite during build)
  (typeof VITE_STRIPE_PUBLIC_KEY !== 'undefined' ? VITE_STRIPE_PUBLIC_KEY : null) ||
  // fallback: empty (we'll show an error if missing)
  null
);

const infoEl = document.getElementById('info');
const summaryEl = document.getElementById('summary');
const errorEl = document.getElementById('error-message');
const paymentMessage = document.getElementById('payment-message');
const submitButton = document.getElementById('submit');

if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY.includes('YOUR_PUBLISHABLE_KEY')) {
  errorEl.textContent = 'Insira a Stripe Publishable Key em /public/pagamento.js antes de testar.';
  submitButton.disabled = true;
} else {
  const stripe = Stripe(PUBLISHABLE_KEY);

  // Base API URL (ajuste para seu backend em desenvolvimento)
  // Pode ser configurada em tempo de execução via `window.__API_BASE__` ou `localStorage.setItem('VITE_API_URL', url)`
  const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || localStorage.getItem('VITE_API_URL') || (typeof VITE_API_URL !== 'undefined' ? VITE_API_URL : null) || 'http://localhost:8000';

  // helper: parse response and handle errors properly
  function parseJsonOrThrow(res) {
    const contentType = res.headers.get('content-type') || '';
    
    // For non-OK responses, extract error message
    if (!res.ok) {
      // Always try to parse as JSON first (our backend returns JSON errors)
      return res.json()
        .then(data => {
          const errorMsg = data.mensagem || data.error || data.message || JSON.stringify(data);
          throw new Error(`HTTP ${res.status}: ${errorMsg}`);
        })
        .catch(err => {
          // If JSON parsing fails, it means the response is not JSON
          if (err.message && err.message.startsWith('HTTP')) {
            throw err; // Re-throw our custom error
          }
          // Try to get text response
          return res.text().then(text => {
            throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
          });
        });
    }

    // For OK responses, parse as JSON
    return res.json()
      .catch(e => {
        throw new Error(`Erro ao fazer parse de JSON da resposta: ${e.message}`);
      });
  }

  // Try to get cart info from the backend /carrinho endpoint
  const token = localStorage.getItem('token');

  if (!token) {
    infoEl.textContent = 'Você precisa estar logado para acessar o pagamento.';
    submitButton.disabled = true;
  } else {
    const authHeaders = { Authorization: `Bearer ${token}` };
    
    fetch(`${API_BASE}/carrinho`, { headers: { ...authHeaders } })
      .then(parseJsonOrThrow)
      .then(async (carrinho) => {
        if (!carrinho || !carrinho.itens || carrinho.itens.length === 0) {
          infoEl.textContent = 'Carrinho vazio. Adicione produtos antes de pagar.';
          submitButton.disabled = true;
          return;
        }

        // Calculate total - ensure it's a valid number
        let total = carrinho.total;
        if (!total || isNaN(total)) {
          total = carrinho.itens.reduce((acc, item) => acc + (item.precoUnitario || 0) * (item.quantidade || 0), 0);
        }
        
        // Validate total is a positive number
        if (total <= 0) {
          infoEl.textContent = 'Carrinho inválido: total deve ser maior que zero.';
          submitButton.disabled = true;
          return;
        }

        // Show summary with all items including images
        let itemsHtml = '<div class="cart-items"><h3>Itens do Carrinho</h3><table><thead><tr><th>Foto</th><th>Produto</th><th>Quantidade</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead><tbody>';
        
        carrinho.itens.forEach(item => {
          const preco = item.precoUnitario || 0;
          const qtd = item.quantidade || 0;
          const subtotal = preco * qtd;
          const nomeProduto = item.nome || item.nomeProduto || 'Produto desconhecido';
          const fotoProduto = item.foto || item.imagem || item.foto_url || '';
          
          const fotoHtml = fotoProduto 
            ? `<img src="${fotoProduto}" alt="${nomeProduto}" style="max-width: 60px; max-height: 60px; object-fit: cover; border-radius: 4px;">`
            : '<span style="color: #999;">Sem foto</span>';
          
          itemsHtml += `<tr>
            <td style="text-align: center;">${fotoHtml}</td>
            <td>${nomeProduto}</td>
            <td>${qtd}</td>
            <td>R$ ${preco.toFixed(2)}</td>
            <td>R$ ${subtotal.toFixed(2)}</td>
          </tr>`;
        });
        
        itemsHtml += `</tbody></table></div><div class="cart-total"><p><strong>Total:</strong> R$ ${total.toFixed(2)}</p></div>`;
        summaryEl.innerHTML = itemsHtml;

        // Payment method selection
        let paymentMethodHtml = `
          <fieldset style="margin:12px 0;">
            <legend>Opção de pagamento</legend>
            <label style="display: block; margin-bottom: 10px;">
              <input type="radio" name="payment-method" value="credit_card" checked> Cartão de Crédito
            </label>
            <label style="display: block; margin-bottom: 10px;">
              <input type="radio" name="payment-method" value="debit_card"> Cartão de Débito
            </label>
          </fieldset>
        `;
        
        const paymentMethodsEl = document.querySelector('fieldset') || summaryEl.parentElement.insertBefore(document.createElement('div'), summaryEl.nextElementSibling);
        paymentMethodsEl.innerHTML = paymentMethodHtml;

        // Get selected payment method
        function getSelectedPaymentMethod() {
          const selected = document.querySelector('input[name="payment-method"]:checked');
          return selected ? selected.value : 'credit_card';
        }

        // Create PaymentIntent on server (card payments)
        const amountInCents = Math.round(total * 100);
        
        console.log('Enviando para /create-payment-intent:', { amount: amountInCents, currency: 'brl' });

        fetch(`${API_BASE}/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ amount: amountInCents, currency: 'brl' })
        })
          .then(parseJsonOrThrow)
          .then(async (data) => {
            // Debug: log server response
            console.debug('Resposta /create-payment-intent:', data);

            // Verify we got the expected response (client_secret must contain "_secret_")
            const clientSecret = data && (data.clientSecret || data.client_secret || data.client_secret_value || data.id);
            if (!clientSecret) {
              errorEl.textContent = 'Erro: Resposta inválida do servidor (sem clientSecret).';
              submitButton.disabled = true;
              return;
            }

            if (!String(clientSecret).includes('_secret_')) {
              console.error('clientSecret parece inválido (pode ser o id em vez do client_secret):', clientSecret);
              errorEl.textContent = 'Erro: servidor retornou um clientSecret inválido. Verifique o backend (deve retornar paymentIntent.client_secret).';
              submitButton.disabled = true;
              return;
            }

            // Create Elements and mount the Card element once, then reuse it on submit.
            let elements = null;
            let cardElement = null;
            try {
              elements = stripe.elements({ clientSecret });
              cardElement = elements.create('card');
              cardElement.mount('#payment-element');
            } catch (e) {
              console.error('Erro ao inicializar Elements:', e);
              errorEl.textContent = 'Erro ao inicializar o formulário de pagamento.';
              submitButton.disabled = true;
              return;
            }

            // Submit handler uses the mounted card element (do not recreate it here)
            submitButton.addEventListener('click', async () => {
              const paymentMethod = getSelectedPaymentMethod();
              submitButton.disabled = true;
              errorEl.textContent = '';
              paymentMessage.textContent = 'Processando pagamento...';

              try {
                const result = await stripe.confirmCardPayment(clientSecret, {
                  payment_method: { card: cardElement }
                });

                if (result.error) {
                  errorEl.textContent = result.error.message || 'Erro ao processar pagamento.';
                  paymentMessage.textContent = '';
                  submitButton.disabled = false;
                } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
                  paymentMessage.textContent = 'Pagamento realizado com sucesso! Redirecionando...';
                  setTimeout(() => window.location.href = '/pagamento-success.html', 1200);
                } else {
                  paymentMessage.textContent = 'Pagamento processado. Verifique seu extrato.';
                }
              } catch (err) {
                console.error(err);
                errorEl.textContent = 'Erro ao processar o pagamento.';
                paymentMessage.textContent = '';
                submitButton.disabled = false;
              }
            });

            // Keep card mounted when switching radio options; do not recreate unnecessarily.
            const paymentElementDiv = document.getElementById('payment-element');
            const radioButtons = document.querySelectorAll('input[name="payment-method"]');
            radioButtons.forEach(radio => {
              radio.addEventListener('change', () => {
                // If you need to change the element type, unmount and recreate here.
                // For now we keep a single Card element for both credit/debit options.
                paymentElementDiv.innerHTML = '';
                if (cardElement) cardElement.mount('#payment-element');
              });
            });
          })
          .catch(err => {
            console.error('Erro ao criar PaymentIntent:', err);
            errorEl.textContent = `Erro ao criar PaymentIntent: ${err.message}`;
            submitButton.disabled = true;
          });
      })
      .catch(err => {
        console.error('Erro ao carregar carrinho:', err);
        const msg = (err && err.message) ? err.message : String(err);
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED') || msg.includes('ERR_CONNECTION_REFUSED')) {
          errorEl.textContent = `Falha de conexão: não foi possível conectar ao backend em ${API_BASE}. Verifique se o servidor está rodando (ex.: execute o backend com \`npm run dev\`) e se a porta/host estão corretos.`;
        } else {
          errorEl.textContent = `Erro ao carregar carrinho: ${msg}`;
        }
        submitButton.disabled = true;
      });
  }
}