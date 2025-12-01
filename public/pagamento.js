// pagamento.js
// Payment Elements for the frontend project (static page)
// IMPORTANT: Publishable Key inserida (pk_... ). Nunca coloque a Secret Key no frontend.
const PUBLISHABLE_KEY = 'pk_test_51SXKK1GploZpoTypWYAJBQH3ChgupCFNGP83G6ZlWM9JwoXEnM4y18uIGuY4l7K3sVLFszKhh3ugoREjWtr6faQu00YAQixW8q';

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

  // Try to get cart info from the backend /carrinho endpoint
  // Include Authorization header if user is logged-in (token in localStorage)
  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  fetch('/carrinho', { headers: { ...authHeaders } })
    .then(r => r.json())
    .then(async (carrinho) => {
      if (!carrinho || !carrinho.itens) {
        infoEl.textContent = 'Carrinho vazio. Adicione produtos antes de pagar.';
        submitButton.disabled = true;
        return;
      }

      // show summary
      const total = carrinho.total ?? carrinho.itens.reduce((acc,item)=> acc + item.precoUnitario * item.quantidade, 0);
      summaryEl.innerHTML = `<p><strong>Total:</strong> R$ ${total}</p>`;

      // Create PaymentIntent on server (card payments)
      const amountInCents = Math.round(Number(total) * 100);
      fetch('/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ amount: amountInCents, currency: 'brl' })
      })
        .then(res => res.json())
        .then(async (data) => {
          if (data.error) {
            errorEl.textContent = data.error;
            return;
          }

          const clientSecret = data.clientSecret;
          // Use Stripe Elements with a Card Element for explicit card payments
          const elements = stripe.elements({ clientSecret });
          const cardElement = elements.create('card');
          cardElement.mount('#payment-element');

          submitButton.addEventListener('click', async () => {
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
                // optional: redirect to success page
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
        })
        .catch(err => {
          console.error(err);
          errorEl.textContent = 'Erro ao criar PaymentIntent. Veja console.';
        });
    })
    .catch(err => {
      console.error(err);
      infoEl.textContent = 'Erro ao carregar carrinho. Faça login ou verifique o backend.';
      submitButton.disabled = true;
    });
}
