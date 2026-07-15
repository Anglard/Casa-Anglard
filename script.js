(function () {
  const grid = document.getElementById('productGrid');
  const count = document.getElementById('count');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const modal = document.getElementById('modal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  const shippingModal = document.getElementById('shippingModal');
  const shippingOverlay = document.getElementById('shippingOverlay');
  const shippingClose = document.getElementById('shippingClose');
  const shippingForm = document.getElementById('shippingForm');

  // ELEMENTOS DE CONTROL DEL CARRITO
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartCountGlobal = document.getElementById('cartCountGlobal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const cartPaymentMethod = document.getElementById('cartPaymentMethod');

  // ELEMENTOS DEL LIGHTBOX DE ZOOM
  const zoomOverlay = document.getElementById('zoomOverlay');
  const zoomModal = document.getElementById('zoomModal');
  const zoomImage = document.getElementById('zoomImage');
  const zoomClose = document.getElementById('zoomClose');

  const WHATSAPP_NUMBER = '525637091144'; // Teléfono real configurado para Casa Anglard

  let activeFilter = 'all';
  let cart = JSON.parse(localStorage.getItem('casa_anglard_cart')) || [];

  // ---------- INTERFAZ ZOOM LIGHTBOX ----------
  function openZoom(imgSrc) {
    zoomImage.src = imgSrc;
    zoomModal.style.display = 'block';
    zoomOverlay.classList.add('open');
  }

  function closeZoom() {
    zoomModal.style.display = 'none';
    zoomOverlay.classList.remove('open');
  }

  zoomClose.addEventListener('click', closeZoom);
  zoomOverlay.addEventListener('click', closeZoom);
  zoomImage.addEventListener('click', closeZoom);

  // ---------- CONTROL DE LA BOLSA DE COMPRAS ----------
  function updateCartDOM() {
    localStorage.setItem('casa_anglard_cart', JSON.stringify(cart));
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCountGlobal.textContent = totalItems;

    if (cart.length === 0) {
      cartItemsList.innerHTML = '<p class="shipping-copy" style="text-align: center; padding: 20px 0;">Tu bolsa está vacía.</p>';
      cartSubtotal.textContent = '$0 MXN';
      return;
    }

    let subtotal = 0;
    cartItemsList.innerHTML = cart.map(item => {
      const p = PRODUCTS.find(x => x.id === item.id);
      if (!p) return '';
      const itemPrice = p.price || 0;
      subtotal += itemPrice * item.quantity;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 13.5px; padding-bottom: 12px; border-bottom: 1px dashed var(--border);">
          <div>
            <strong style="display: block; font-family: var(--font-body); font-size: 14px; color: var(--ink);">${p.name}</strong>
            <span style="color: var(--muted); font-size: 12.5px;">${item.quantity} x ${p.priceText}</span>
          </div>
          <button class="link-btn" data-remove-id="${item.id}" style="color: oklch(40% 0.06 20); text-decoration: none; font-weight: 600;">Quitar</button>
        </div>
      `;
    }).join('');

    cartSubtotal.textContent = `$${subtotal} MXN`;

    cartItemsList.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeItemFromCart(btn.dataset.removeId);
      });
    });
  }

  function addItemToCart(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: id, quantity: 1 });
    }
    updateCartDOM();
    closeModal();
    openCartDrawer();
  }

  function removeItemFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartDOM();
  }

  function openCartDrawer() {
    cartDrawer.style.transform = "translate(0%, -50%)";
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    cartDrawer.style.transform = "translate(100%, -50%)";
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('openCartBtn').addEventListener('click', openCartDrawer);
  cartClose.addEventListener('click', closeCartDrawer);
  cartOverlay.addEventListener('click', closeCartDrawer);

  // CONTROL DEL BOTÓN COMPRAR DESDE LA BOLSA
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    const gateway = cartPaymentMethod.value;
    
    let subtotal = 0;
    cart.forEach(item => {
      const p = PRODUCTS.find(x => x.id === item.id);
      if (p) subtotal += (p.price || 0) * item.quantity;
    });

    if (gateway === 'paypal') {
      alert(`Redirigiendo de forma segura a la pasarela de PayPal para procesar tu pago de $${subtotal} MXN.\n\n* Listo para colocar tu Client ID.`);
    } else if (gateway === 'mercadopago') {
      alert(`Procesando tu orden global con Mercado Pago Checkout Pro.\n\n* Configura los links individuales dentro del campo "mpLink" de tu base de datos.`);
    } else if (gateway === 'clip') {
      alert(`Iniciando conexión con Clip Checkout API para cobros con tarjeta bancaria.`);
    } else {
      let textMsg = "Hola Casa Anglard, prefiero liquidar las piezas de mi bolsa por transferencia bancaria:\n\n";
      cart.forEach(item => {
        const p = PRODUCTS.find(x => x.id === item.id);
        if (p) textMsg += `• ${item.quantity}x ${p.name} (${p.priceText})\n`;
      });
      textMsg += "\nQuedo a la espera de los datos de cuenta y cotización de envío.";
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textMsg)}`, '_blank', 'noopener');
    }
    
    closeCartDrawer();
  });

  // ---------- CONTROL DEL MOCKUP EN TARJETAS ----------
  function cardHTML(p) {
    return `
      <div class="product-card" data-id="${p.id}" data-category="${p.category}">
        <div class="thumb" style="position: relative;">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <button class="zoom-trigger-btn" data-zoom-src="${p.img}" style="position: absolute; bottom: 8px; right: 8px; background: rgba(255,255,255,0.9); border: 1px solid var(--border); padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); cursor: pointer; border-radius: 2px; z-index: 10;">🔍 Zoom</button>
        </div>
        <div class="info">
          <span class="cat-label">${p.categoryLabel}</span>
          <div class="name">${p.name}</div>
          <div class="meta">${p.medidas}</div>
          <div class="price">${p.priceText}<span class="ship-note"> + envío</span></div>
        </div>
      </div>
    `;
  }

  function render() {
    const list = activeFilter === 'all'
      ? PRODUCTS
      : PRODUCTS.filter(p => p.category === activeFilter);

    grid.innerHTML = list.map(cardHTML).join('');
    count.textContent = list.length;

    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('zoom-trigger-btn')) return;
        openModal(card.dataset.id);
      });
    });

    grid.querySelectorAll('.zoom-trigger-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openZoom(btn.dataset.zoomSrc);
      });
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  // ---------- MODAL: VISTA DE ARTÍCULO ----------
  function openModal(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;

    const hasFixedPrice = p.price !== null;

    const paymentButtonsHTML = hasFixedPrice ? `
      <div class="payment-buttons">
        <div class="payment-label">Canal Express Individual</div>
        <div class="payment-row">
          <button class="pay-btn pay-mercadopago" data-provider="mercadopago" data-product="${p.id}">Pagar esta pieza con Mercado Pago</button>
        </div>
      </div>
    ` : `
      <p class="quote-note">Este producto se cotiza por proyecto. Solicita tu cotización directamente por WhatsApp o agrega otros artículos fijos a tu bolsa.</p>
    `;

    const addToCartHTML = hasFixedPrice ? `
      <button class="btn btn-dark" id="addToCartModalBtn" style="width: 100%; margin-bottom: 12px; font-weight: 600;">Añadir a mi Bolsa</button>
    ` : '';

    modalBody.innerHTML = `
      <div style="position: relative; background: var(--teal-soft); cursor: zoom-in;" id="modalImgContainer">
        <img class="modal-img" src="${p.img}" alt="${p.name}">
        <div style="position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.9); padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); border: 1px solid var(--border); border-radius: 2px;">Click para ampliar arte</div>
      </div>
      <div class="modal-info">
        <span class="cat-label">${p.categoryLabel}</span>
        <h3>${p.name}</h3>
        <div class="price">${p.priceText}<span class="ship-note"> + envío, calculado según destino</span></div>
        <p class="wholesale-note">Mayoreo (5 piezas o más): descuento disponible, escríbenos para aplicarlo.</p>
        <dl>
          <div><dt>Medidas / Tallas</dt><dd>${p.medidas}</dd></div>
          <div><dt>Material / Notas</dt><dd>${p.material}</dd></div>
        </dl>

        ${addToCartHTML}
        ${paymentButtonsHTML}

        <div class="modal-actions">
          <a class="btn btn-outline" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, me interesa saber más de: ' + p.name)}" target="_blank" rel="noopener" style="width: 100%;">Consultar por WhatsApp</a>
          <button class="link-btn" data-open-shipping>Cotizar envío para esta pieza →</button>
        </div>
      </div>
    `;

    document.getElementById('modalImgContainer').addEventListener('click', () => {
      openZoom(p.img);
    });

    const cartBtn = document.getElementById('addToCartModalBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => addItemToCart(p.id));
    }

    modalBody.querySelectorAll('.pay-btn').forEach(btn => {
      btn.addEventListener('click', () => handlePayment(btn.dataset.provider, p));
    });

    const openShippingLink = modalBody.querySelector('[data-open-shipping]');
    if (openShippingLink) {
      openShippingLink.addEventListener('click', () => {
        closeModal();
        openShippingModal();
      });
    }

    modal.classList.add('open');
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { 
      closeModal(); 
      closeShippingModal(); 
      closeCartDrawer();
      closeZoom();
    }
  });

  function handlePayment(provider, product) {
    if (provider === 'mercadopago') {
      if (product.mpLink) {
        window.open(product.mpLink, '_blank', 'noopener');
      } else {
        alert(
          `Falta configurar el enlace de cobro de Mercado Pago para "${product.name}".\n\n` +
          `Genéralo en tu perfil de Mercado Pago y pégalo en el campo "mpLink" en products.js.`
        );
      }
    }
  }

  // ---------- SOLICITUD DE PAQUETERÍA ----------
  function openShippingModal() {
    shippingModal.classList.add('open');
    shippingOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeShippingModal() {
    shippingModal.classList.remove('open');
    shippingOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('openShippingBtnHeader').addEventListener('click', openShippingModal);
  document.getElementById('openShippingBtnNote').addEventListener('click', openShippingModal);
  shippingClose.addEventListener('click', closeShippingModal);
  shippingOverlay.addEventListener('click', closeShippingModal);

  shippingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const cp = document.getElementById('shippingCP').value.trim();
    const ciudad = document.getElementById('shippingCiudad').value.trim();
    const mensaje = `Hola Casa Anglard, me gustaría cotizar la mensajería de mi orden hacia la ciudad de ${ciudad}, Código Postal: ${cp}.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
    closeShippingModal();
    shippingForm.reset();
  });

  updateCartDOM();
  render();
})();