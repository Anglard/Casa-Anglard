(function () {
  "use strict";

  const STRIPE_CHECKOUT_ENDPOINT = "/api/create-checkout-session";
  const WHATSAPP_NUMBER = "525637091144";
  const CART_STORAGE_KEY = "casa_anglard_cart";

  const grid = document.getElementById("productGrid");
  const count = document.getElementById("count");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const modal = document.getElementById("modal");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");

  const shippingModal = document.getElementById("shippingModal");
  const shippingOverlay = document.getElementById("shippingOverlay");
  const shippingClose = document.getElementById("shippingClose");
  const shippingForm = document.getElementById("shippingForm");

  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartClose = document.getElementById("cartClose");
  const cartItemsList = document.getElementById("cartItemsList");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartCountGlobal = document.getElementById("cartCountGlobal");
  const cartCountMobile = document.getElementById("cartCountMobile");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const zoomOverlay = document.getElementById("zoomOverlay");
  const zoomModal = document.getElementById("zoomModal");
  const zoomImage = document.getElementById("zoomImage");
  const zoomClose = document.getElementById("zoomClose");

  const currencyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0
  });

  let activeFilter = "all";
  let cart = loadCart();

  function loadCart() {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (!storedCart) {
        return [];
      }

      const parsedCart = JSON.parse(storedCart);

      return Array.isArray(parsedCart)
        ? parsedCart
        : [];
    } catch (error) {
      console.warn(
        "No fue posible recuperar la bolsa guardada.",
        error
      );

      localStorage.removeItem(CART_STORAGE_KEY);

      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );
  }

  function formatCurrency(value) {
    return currencyFormatter.format(value);
  }

  function getProduct(productId) {
    return PRODUCTS.find(
      product => product.id === productId
    );
  }

  function getVariant(product, variantId) {
    if (
      !product ||
      !Array.isArray(product.variants)
    ) {
      return null;
    }

    return product.variants.find(
      variant => variant.id === variantId
    ) || null;
  }

  function getProductPriceLabel(product) {
    if (typeof product.price === "number") {
      return formatCurrency(product.price);
    }

    if (
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {
      const prices = product.variants.map(
        variant => variant.price
      );

      const minimum = Math.min(...prices);
      const maximum = Math.max(...prices);

      return minimum === maximum
        ? formatCurrency(minimum)
        : `${formatCurrency(minimum)}–${formatCurrency(maximum)}`;
    }

    return "Cotización";
  }

  function getCartItemUnitPrice(item) {
    const product = getProduct(item.productId);

    if (!product) {
      return 0;
    }

    const variant = getVariant(
      product,
      item.variantId
    );

    if (variant) {
      return variant.price;
    }

    return typeof product.price === "number"
      ? product.price
      : 0;
  }

  function getCartItemLabel(item) {
    const product = getProduct(item.productId);

    if (!product) {
      return "";
    }

    const variant = getVariant(
      product,
      item.variantId
    );

    return variant
      ? `${product.name} — ${variant.name}`
      : product.name;
  }

  function openZoom(imgSrc, altText) {
    zoomImage.src = imgSrc;
    zoomImage.alt =
      altText || "Imagen ampliada del producto";

    zoomModal.style.display = "block";
    zoomModal.setAttribute("aria-hidden", "false");
    zoomOverlay.classList.add("open");

    zoomClose.focus();
  }

  function closeZoom() {
    zoomModal.style.display = "none";
    zoomModal.setAttribute("aria-hidden", "true");
    zoomOverlay.classList.remove("open");
  }

  function updateCartDOM() {
    saveCart();

    const totalItems = cart.reduce(
      (total, item) => total + item.quantity,
      0
    );

    cartCountGlobal.textContent = totalItems;
    cartCountMobile.textContent = totalItems;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <p
          class="shipping-copy"
          style="text-align:center; padding:20px 0;"
        >
          Tu bolsa está vacía.
        </p>
      `;

      cartSubtotal.textContent = formatCurrency(0);

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Tu bolsa está vacía";

      return;
    }

    let subtotal = 0;

    cartItemsList.innerHTML = cart
      .map((item, index) => {
        const product = getProduct(item.productId);

        if (!product) {
          return "";
        }

        const unitPrice = getCartItemUnitPrice(item);

        subtotal += unitPrice * item.quantity;

        return `
          <div
            style="margin-bottom:16px; padding-bottom:14px; border-bottom:1px dashed var(--border);"
          >
            <strong
              style="display:block; font-size:14px; color:var(--ink); margin-bottom:5px;"
            >
              ${getCartItemLabel(item)}
            </strong>

            <span
              style="display:block; color:var(--muted); font-size:12.5px; margin-bottom:9px;"
            >
              ${formatCurrency(unitPrice)} por unidad
            </span>

            <div
              style="display:flex; align-items:center; justify-content:space-between; gap:12px;"
            >
              <div
                style="display:flex; align-items:center; gap:9px;"
              >
                <button
                  type="button"
                  class="filter-btn"
                  data-cart-action="decrease"
                  data-cart-index="${index}"
                  aria-label="Reducir cantidad"
                  style="padding:4px 10px;"
                >
                  −
                </button>

                <span>${item.quantity}</span>

                <button
                  type="button"
                  class="filter-btn"
                  data-cart-action="increase"
                  data-cart-index="${index}"
                  aria-label="Aumentar cantidad"
                  style="padding:4px 10px;"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                class="link-btn"
                data-cart-action="remove"
                data-cart-index="${index}"
                style="font-weight:600;"
              >
                Quitar
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    cartSubtotal.textContent =
      formatCurrency(subtotal);

    checkoutBtn.disabled = false;
    checkoutBtn.textContent =
      "Pagar de forma segura con Stripe";

    cartItemsList
      .querySelectorAll("[data-cart-action]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const index = Number(
            button.dataset.cartIndex
          );

          const action =
            button.dataset.cartAction;

          if (
            !Number.isInteger(index) ||
            !cart[index]
          ) {
            return;
          }

          if (action === "increase") {
            cart[index].quantity += 1;
          }

          if (action === "decrease") {
            cart[index].quantity -= 1;

            if (cart[index].quantity <= 0) {
              cart.splice(index, 1);
            }
          }

          if (action === "remove") {
            cart.splice(index, 1);
          }

          updateCartDOM();
        });
      });
  }

  function addItemToCart(
    productId,
    variantId = null
  ) {
    const product = getProduct(productId);

    if (!product) {
      return;
    }

    const itemKey =
      `${productId}:${variantId || "default"}`;

    const existingItem = cart.find(
      item => item.key === itemKey
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        key: itemKey,
        productId,
        variantId,
        quantity: 1
      });
    }

    updateCartDOM();
    closeModal();
    openCartDrawer();
  }

  function openCartDrawer() {
    cartDrawer.style.transform =
      "translate(0%, -50%)";

    cartDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

    cartOverlay.classList.add("open");
    document.body.style.overflow = "hidden";

    cartClose.focus();
  }

  function closeCartDrawer() {
    cartDrawer.style.transform =
      "translate(100%, -50%)";

    cartDrawer.setAttribute(
      "aria-hidden",
      "true"
    );

    cartOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  async function checkoutWithStripe() {
    if (cart.length === 0) {
      return;
    }

    checkoutBtn.disabled = true;
    checkoutBtn.textContent =
      "Preparando pago…";

    try {
      const response = await fetch(
        STRIPE_CHECKOUT_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: cart.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity
            }))
          })
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No fue posible iniciar el pago."
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe no devolvió una dirección de pago."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);

      alert(
        "No pudimos iniciar el pago con Stripe.\n\n" +
        "La tienda necesita tener activo el endpoint " +
        "\"/api/create-checkout-session\" en Vercel."
      );
    } finally {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent =
        "Pagar de forma segura con Stripe";
    }
  }

  function cardHTML(product) {
    return `
      <article
        class="product-card"
        data-id="${product.id}"
        data-category="${product.category}"
        tabindex="0"
        aria-label="Ver ${product.name}"
      >
        <div
          class="thumb"
          style="position:relative;"
        >
          <img
            src="${product.img}"
            alt="${product.name}"
            loading="lazy"
          >

          <button
            type="button"
            class="zoom-trigger-btn"
            data-zoom-src="${product.img}"
            data-zoom-alt="${product.name}"
            aria-label="Ampliar imagen de ${product.name}"
            style="position:absolute; bottom:8px; right:8px; background:rgba(255,255,255,0.9); border:1px solid var(--border); padding:4px 8px; font-size:11px; font-family:var(--font-mono); cursor:pointer; border-radius:2px; z-index:10;"
          >
            🔍 Zoom
          </button>
        </div>

        <div class="info">
          <span class="cat-label">
            ${product.categoryLabel}
          </span>

          <div class="name">
            ${product.name}
          </div>

          <div class="meta">
            ${product.medidas}
          </div>

          <div class="price">
            ${getProductPriceLabel(product)}
            <span class="ship-note">
              + envío
            </span>
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    const list =
      activeFilter === "all"
        ? PRODUCTS
        : PRODUCTS.filter(
            product =>
              product.category === activeFilter
          );

    grid.innerHTML =
      list.map(cardHTML).join("");

    count.textContent = list.length;

    grid
      .querySelectorAll(".product-card")
      .forEach(card => {
        card.addEventListener(
          "click",
          event => {
            if (
              event.target.closest(
                ".zoom-trigger-btn"
              )
            ) {
              return;
            }

            openModal(card.dataset.id);
          }
        );

        card.addEventListener(
          "keydown",
          event => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              openModal(card.dataset.id);
            }
          }
        );
      });

    grid
      .querySelectorAll(".zoom-trigger-btn")
      .forEach(button => {
        button.addEventListener(
          "click",
          event => {
            event.stopPropagation();

            openZoom(
              button.dataset.zoomSrc,
              button.dataset.zoomAlt
            );
          }
        );
      });
  }

  function openModal(productId) {
    const product = getProduct(productId);

    if (!product) {
      return;
    }

    const hasFixedPrice =
      typeof product.price === "number";

    const hasVariants =
      Array.isArray(product.variants) &&
      product.variants.length > 0;

    const variantSelectorHTML =
      hasVariants
        ? `
          <label
            for="variantSelector"
            style="display:block; font-size:12px; color:var(--muted); margin:14px 0 6px;"
          >
            Elige una presentación
          </label>

          <select
            id="variantSelector"
            style="width:100%; padding:11px 13px; border:1px solid var(--border); background:white; font-family:var(--font-body); margin-bottom:14px;"
          >
            ${product.variants
              .map(
                variant => `
                  <option value="${variant.id}">
                    ${variant.name} —
                    ${formatCurrency(variant.price)}
                  </option>
                `
              )
              .join("")}
          </select>
        `
        : "";

    const purchaseButtonHTML =
      hasFixedPrice || hasVariants
        ? `
          <button
            type="button"
            class="btn btn-dark"
            id="addToCartModalBtn"
            style="width:100%; margin-bottom:12px; font-weight:600;"
          >
            Añadir a mi bolsa
          </button>
        `
        : `
          <p class="quote-note">
            Este producto se prepara bajo cotización.
          </p>
        `;

    modalBody.innerHTML = `
      <div
        id="modalImgContainer"
        style="position:relative; background:var(--teal-soft); cursor:zoom-in;"
      >
        <img
          class="modal-img"
          src="${product.img}"
          alt="${product.name}"
        >

        <div
          style="position:absolute; top:12px; left:12px; background:rgba(255,255,255,0.9); padding:4px 8px; font-size:11px; font-family:var(--font-mono); border:1px solid var(--border);"
        >
          Click para ampliar
        </div>
      </div>

      <div class="modal-info">
        <span class="cat-label">
          ${product.categoryLabel}
        </span>

        <h3>${product.name}</h3>

        <div class="price">
          ${getProductPriceLabel(product)}
          <span class="ship-note">
            + envío
          </span>
        </div>

        <p
          style="font-size:14px; line-height:1.6; color:var(--muted);"
        >
          ${product.description || ""}
        </p>

        <dl>
          <div>
            <dt>Medidas / tallas</dt>
            <dd>${product.medidas}</dd>
          </div>

          <div>
            <dt>Material / notas</dt>
            <dd>${product.material}</dd>
          </div>
        </dl>

        ${variantSelectorHTML}
        ${purchaseButtonHTML}

        <div class="modal-actions">
          <a
            class="btn btn-outline"
            href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hola, tengo una duda sobre: ${product.name}`
            )}"
            target="_blank"
            rel="noopener"
            style="width:100%;"
          >
            Consultar por WhatsApp
          </a>

          <button
            type="button"
            class="link-btn"
            data-open-shipping
          >
            Cotizar envío para esta pieza →
          </button>
        </div>
      </div>
    `;

    document
      .getElementById("modalImgContainer")
      .addEventListener(
        "click",
        () => {
          openZoom(
            product.img,
            product.name
          );
        }
      );

    const addToCartButton =
      document.getElementById(
        "addToCartModalBtn"
      );

    if (addToCartButton) {
      addToCartButton.addEventListener(
        "click",
        () => {
          const variantSelector =
            document.getElementById(
              "variantSelector"
            );

          const variantId =
            variantSelector
              ? variantSelector.value
              : null;

          addItemToCart(
            product.id,
            variantId
          );
        }
      );
    }

    const openShippingLink =
      modalBody.querySelector(
        "[data-open-shipping]"
      );

    if (openShippingLink) {
      openShippingLink.addEventListener(
        "click",
        () => {
          closeModal();
          openShippingModal();
        }
      );
    }

    modal.classList.add("open");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    modalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";

    modalClose.focus();
  }

  function closeModal() {
    modal.classList.remove("open");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function openShippingModal() {
    shippingModal.classList.add("open");

    shippingModal.setAttribute(
      "aria-hidden",
      "false"
    );

    shippingOverlay.classList.add("open");
    document.body.style.overflow = "hidden";

    shippingClose.focus();
  }

  function closeShippingModal() {
    shippingModal.classList.remove("open");

    shippingModal.setAttribute(
      "aria-hidden",
      "true"
    );

    shippingOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document
    .getElementById("openCartBtn")
    .addEventListener(
      "click",
      openCartDrawer
    );

  document
    .getElementById("openCartBtnMobile")
    .addEventListener(
      "click",
      openCartDrawer
    );

  document
    .getElementById("openShippingBtnHeader")
    .addEventListener(
      "click",
      openShippingModal
    );

  document
    .getElementById("openShippingBtnNote")
    .addEventListener(
      "click",
      openShippingModal
    );

  filterBtns.forEach(button => {
    button.addEventListener(
      "click",
      () => {
        filterBtns.forEach(item => {
          item.classList.remove("active");
        });

        button.classList.add("active");
        activeFilter = button.dataset.filter;

        render();
      }
    );
  });

  modalClose.addEventListener(
    "click",
    closeModal
  );

  modalOverlay.addEventListener(
    "click",
    closeModal
  );

  cartClose.addEventListener(
    "click",
    closeCartDrawer
  );

  cartOverlay.addEventListener(
    "click",
    closeCartDrawer
  );

  shippingClose.addEventListener(
    "click",
    closeShippingModal
  );

  shippingOverlay.addEventListener(
    "click",
    closeShippingModal
  );

  zoomClose.addEventListener(
    "click",
    closeZoom
  );

  zoomOverlay.addEventListener(
    "click",
    closeZoom
  );

  zoomImage.addEventListener(
    "click",
    closeZoom
  );

  checkoutBtn.addEventListener(
    "click",
    checkoutWithStripe
  );

  shippingForm.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const postalCode =
        document
          .getElementById("shippingCP")
          .value
          .trim();

      const city =
        document
          .getElementById("shippingCiudad")
          .value
          .trim();

      if (!/^\d{5}$/.test(postalCode)) {
        alert(
          "Escribe un código postal mexicano de cinco dígitos."
        );

        return;
      }

      if (city.length < 3) {
        alert(
          "Escribe tu ciudad, alcaldía o municipio."
        );

        return;
      }

      const cartSummary =
        cart.length > 0
          ? cart
              .map(item => {
                return (
                  `• ${item.quantity} × ` +
                  `${getCartItemLabel(item)}`
                );
              })
              .join("\n")
          : "Aún no he agregado productos a la bolsa.";

      const message =
        "Hola Casa Anglard, quiero cotizar el envío de este pedido:\n\n" +
        `${cartSummary}\n\n` +
        `Destino: ${city}, CP ${postalCode}.`;

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener"
      );

      closeShippingModal();
      shippingForm.reset();
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeModal();
        closeShippingModal();
        closeCartDrawer();
        closeZoom();
      }
    }
  );

  updateCartDOM();
  render();
})();