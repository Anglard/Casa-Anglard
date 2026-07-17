(function () {
  "use strict";

  const STRIPE_CHECKOUT_ENDPOINT =
    "/api/create-checkout-session";

  const SHIPPING_RATES_ENDPOINT =
    "/api/shipping-rates";

  const WHATSAPP_NUMBER =
    "525637091144";

  const CART_STORAGE_KEY =
    "casa_anglard_cart";

  const grid =
    document.getElementById("productGrid");

  const count =
    document.getElementById("count");

  const filterBtns =
    document.querySelectorAll(".filter-btn");

  const modal =
    document.getElementById("modal");

  const modalOverlay =
    document.getElementById("modalOverlay");

  const modalBody =
    document.getElementById("modalBody");

  const modalClose =
    document.getElementById("modalClose");

  const shippingModal =
    document.getElementById("shippingModal");

  const shippingOverlay =
    document.getElementById("shippingOverlay");

  const shippingClose =
    document.getElementById("shippingClose");

  const shippingForm =
    document.getElementById("shippingForm");

  const shippingSubmit =
    document.getElementById("shippingSubmit");

  const shippingStatus =
    document.getElementById("shippingStatus");

  const shippingResults =
    document.getElementById("shippingResults");

  const cartDrawer =
    document.getElementById("cartDrawer");

  const cartOverlay =
    document.getElementById("cartOverlay");

  const cartClose =
    document.getElementById("cartClose");

  const cartItemsList =
    document.getElementById("cartItemsList");

  const cartSubtotal =
    document.getElementById("cartSubtotal");

  const cartCountGlobal =
    document.getElementById("cartCountGlobal");

  const cartCountMobile =
    document.getElementById("cartCountMobile");

  const checkoutBtn =
    document.getElementById("checkoutBtn");

  const selectedShippingSummary =
    document.getElementById(
      "selectedShippingSummary"
    );

  const zoomOverlay =
    document.getElementById("zoomOverlay");

  const zoomModal =
    document.getElementById("zoomModal");

  const zoomImage =
    document.getElementById("zoomImage");

  const zoomClose =
    document.getElementById("zoomClose");

  const currencyFormatter =
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0
    });

  let activeFilter = "all";
  let cart = loadCart();
  let selectedShipping = null;
  let lastShippingDestination = null;

  function loadCart() {
    try {
      const storedCart =
        localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (!storedCart) {
        return [];
      }

      const parsedCart =
        JSON.parse(storedCart);

      return Array.isArray(parsedCart)
        ? parsedCart
        : [];
    } catch (error) {
      console.warn(
        "No fue posible recuperar la bolsa guardada.",
        error
      );

      try {
        localStorage.removeItem(
          CART_STORAGE_KEY
        );
      } catch {
        // No se realiza ninguna acción adicional.
      }

      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.warn(
        "No fue posible guardar la bolsa.",
        error
      );
    }
  }

  function formatCurrency(value) {
    return currencyFormatter.format(
      Number(value || 0)
    );
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getProduct(productId) {
    return PRODUCTS.find(
      product =>
        product.id === productId
    );
  }

  function getVariant(
    product,
    variantId
  ) {
    if (
      !product ||
      !Array.isArray(product.variants)
    ) {
      return null;
    }

    return (
      product.variants.find(
        variant =>
          variant.id === variantId
      ) || null
    );
  }

  function getProductPriceLabel(product) {
    if (
      typeof product.price === "number"
    ) {
      return formatCurrency(
        product.price
      );
    }

    if (
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {
      const prices =
        product.variants.map(
          variant =>
            Number(variant.price)
        );

      const minimum =
        Math.min(...prices);

      const maximum =
        Math.max(...prices);

      return minimum === maximum
        ? formatCurrency(minimum)
        : `${formatCurrency(minimum)}–${formatCurrency(maximum)}`;
    }

    return "Cotización";
  }

  function getCartItemUnitPrice(item) {
    const product =
      getProduct(item.productId);

    if (!product) {
      return 0;
    }

    const variant =
      getVariant(
        product,
        item.variantId
      );

    if (variant) {
      return Number(
        variant.price || 0
      );
    }

    return typeof product.price === "number"
      ? product.price
      : 0;
  }

  function getCartItemLabel(item) {
    const product =
      getProduct(item.productId);

    if (!product) {
      return "";
    }

    const variant =
      getVariant(
        product,
        item.variantId
      );

    return variant
      ? `${product.name} — ${variant.name}`
      : product.name;
  }

  function getCartProductsSubtotal() {
    return cart.reduce(
      (total, item) => {
        return (
          total +
          getCartItemUnitPrice(item) *
          item.quantity
        );
      },
      0
    );
  }

  function invalidateShipping() {
    selectedShipping = null;
    lastShippingDestination = null;

    if (shippingResults) {
      shippingResults.innerHTML = "";
    }

    if (shippingStatus) {
      shippingStatus.textContent = "";
    }

    if (selectedShippingSummary) {
      selectedShippingSummary.textContent =
        "Aún no has seleccionado una opción de envío.";
    }
  }

  function openZoom(
    imgSrc,
    altText
  ) {
    if (
      !zoomImage ||
      !zoomModal ||
      !zoomOverlay
    ) {
      return;
    }

    zoomImage.src =
      imgSrc;

    zoomImage.alt =
      altText ||
      "Imagen ampliada del producto";

    zoomModal.style.display =
      "block";

    zoomModal.setAttribute(
      "aria-hidden",
      "false"
    );

    zoomOverlay.classList.add(
      "open"
    );

    if (zoomClose) {
      zoomClose.focus();
    }
  }

  function closeZoom() {
    if (
      !zoomModal ||
      !zoomOverlay
    ) {
      return;
    }

    zoomModal.style.display =
      "none";

    zoomModal.setAttribute(
      "aria-hidden",
      "true"
    );

    zoomOverlay.classList.remove(
      "open"
    );
  }

  function updateCartDOM() {
    saveCart();

    const totalItems =
      cart.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      );

    if (cartCountGlobal) {
      cartCountGlobal.textContent =
        totalItems;
    }

    if (cartCountMobile) {
      cartCountMobile.textContent =
        totalItems;
    }

    if (
      !cartItemsList ||
      !cartSubtotal ||
      !checkoutBtn
    ) {
      return;
    }

    if (cart.length === 0) {
      selectedShipping = null;
      lastShippingDestination = null;

      cartItemsList.innerHTML = `
        <p
          class="shipping-copy"
          style="text-align:center; padding:20px 0;"
        >
          Tu bolsa está vacía.
        </p>
      `;

      if (selectedShippingSummary) {
        selectedShippingSummary.textContent =
          "Aún no has seleccionado una opción de envío.";
      }

      cartSubtotal.textContent =
        formatCurrency(0);

      checkoutBtn.disabled =
        true;

      checkoutBtn.textContent =
        "Tu bolsa está vacía";

      return;
    }

    let subtotal = 0;

    cartItemsList.innerHTML =
      cart.map((item, index) => {
        const product =
          getProduct(item.productId);

        if (!product) {
          return "";
        }

        const unitPrice =
          getCartItemUnitPrice(item);

        const quantity =
          Number(item.quantity || 1);

        subtotal +=
          unitPrice * quantity;

        return `
          <div
            style="
              margin-bottom:16px;
              padding-bottom:14px;
              border-bottom:1px dashed var(--border);
            "
          >
            <strong
              style="
                display:block;
                font-size:14px;
                color:var(--ink);
                margin-bottom:5px;
              "
            >
              ${escapeHTML(
                getCartItemLabel(item)
              )}
            </strong>

            <span
              style="
                display:block;
                color:var(--muted);
                font-size:12.5px;
                margin-bottom:9px;
              "
            >
              ${formatCurrency(unitPrice)}
              por unidad
            </span>

            <div
              style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
              "
            >
              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:9px;
                "
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

                <span>
                  ${quantity}
                </span>

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
      }).join("");

    if (
      selectedShipping &&
      selectedShippingSummary
    ) {
      selectedShippingSummary.innerHTML = `
        <strong>
          Envío seleccionado:
        </strong>

        <br>

        ${escapeHTML(
          String(
            selectedShipping.carrier ||
            "Mensajería"
          ).toUpperCase()
        )}
        —
        ${escapeHTML(
          selectedShipping.serviceDescription
        )}

        <br>

        ${formatCurrency(
          selectedShipping.totalPrice
        )}
        ·
        ${escapeHTML(
          selectedShipping.deliveryEstimate
        )}
      `;
    } else if (
      selectedShippingSummary
    ) {
      selectedShippingSummary.textContent =
        "Aún no has seleccionado una opción de envío.";
    }

    const shippingPrice =
      selectedShipping
        ? Number(
            selectedShipping.totalPrice ||
            0
          )
        : 0;

    cartSubtotal.textContent =
      formatCurrency(
        subtotal + shippingPrice
      );

    checkoutBtn.disabled =
      false;

    checkoutBtn.textContent =
      "Pagar de forma segura con Stripe";

    cartItemsList
      .querySelectorAll(
        "[data-cart-action]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const index =
              Number(
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

              if (
                cart[index].quantity <= 0
              ) {
                cart.splice(index, 1);
              }
            }

            if (action === "remove") {
              cart.splice(index, 1);
            }

            invalidateShipping();
            updateCartDOM();
          }
        );
      });
  }

  function addItemToCart(
    productId,
    variantId = null
  ) {
    const product =
      getProduct(productId);

    if (!product) {
      return;
    }

    const itemKey =
      `${productId}:${variantId || "default"}`;

    const existingItem =
      cart.find(
        item =>
          item.key === itemKey
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

    invalidateShipping();
    updateCartDOM();
    closeModal();
    openCartDrawer();
  }

  function openCartDrawer() {
    if (
      !cartDrawer ||
      !cartOverlay
    ) {
      return;
    }

    cartDrawer.style.transform =
      "translate(0%, -50%)";

    cartDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

    cartOverlay.classList.add(
      "open"
    );

    document.body.style.overflow =
      "hidden";

    if (cartClose) {
      cartClose.focus();
    }
  }

  function closeCartDrawer() {
    if (
      !cartDrawer ||
      !cartOverlay
    ) {
      return;
    }

    cartDrawer.style.transform =
      "translate(100%, -50%)";

    cartDrawer.setAttribute(
      "aria-hidden",
      "true"
    );

    cartOverlay.classList.remove(
      "open"
    );

    document.body.style.overflow =
      "";
  }

  async function checkoutWithStripe() {
    if (cart.length === 0) {
      return;
    }

    if (
      !selectedShipping ||
      !lastShippingDestination
    ) {
      closeCartDrawer();
      openShippingModal();

      if (shippingStatus) {
        shippingStatus.textContent =
          "Calcula y selecciona una opción de envío antes de pagar.";
      }

      return;
    }

    checkoutBtn.disabled =
      true;

    checkoutBtn.textContent =
      "Preparando pago…";

    try {
      const response =
        await fetch(
          STRIPE_CHECKOUT_ENDPOINT,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              items: cart.map(
                item => ({
                  productId:
                    item.productId,

                  variantId:
                    item.variantId,

                  quantity:
                    item.quantity
                })
              ),

              shipping: {
                carrier:
                  selectedShipping.carrier,

                service:
                  selectedShipping.service,

                serviceDescription:
                  selectedShipping
                    .serviceDescription,

                deliveryEstimate:
                  selectedShipping
                    .deliveryEstimate,

                deliveryDate:
                  selectedShipping
                    .deliveryDate,

                totalPrice:
                  selectedShipping.totalPrice,

                currency:
                  selectedShipping.currency,

                destination:
                  lastShippingDestination
              }
            })
          }
        );

      const data =
        await response
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

      window.location.href =
        data.url;
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
        "No pudimos iniciar el pago con Stripe."
      );
    } finally {
      checkoutBtn.disabled =
        false;

      checkoutBtn.textContent =
        "Pagar de forma segura con Stripe";
    }
  }

  function cardHTML(product) {
    return `
      <article
        class="product-card"
        data-id="${escapeHTML(product.id)}"
        data-category="${escapeHTML(
          product.category
        )}"
        tabindex="0"
        aria-label="Ver ${escapeHTML(
          product.name
        )}"
      >
        <div
          class="thumb"
          style="position:relative;"
        >
          <img
            src="${escapeHTML(product.img)}"
            alt="${escapeHTML(product.name)}"
            loading="lazy"
          >

          <button
            type="button"
            class="zoom-trigger-btn"
            data-zoom-src="${escapeHTML(
              product.img
            )}"
            data-zoom-alt="${escapeHTML(
              product.name
            )}"
            aria-label="Ampliar imagen de ${escapeHTML(
              product.name
            )}"
            style="
              position:absolute;
              bottom:8px;
              right:8px;
              background:rgba(255,255,255,0.9);
              border:1px solid var(--border);
              padding:4px 8px;
              font-size:11px;
              font-family:var(--font-mono);
              cursor:pointer;
              border-radius:2px;
              z-index:10;
            "
          >
            🔍 Zoom
          </button>
        </div>

        <div class="info">
          <span class="cat-label">
            ${escapeHTML(
              product.categoryLabel
            )}
          </span>

          <div class="name">
            ${escapeHTML(product.name)}
          </div>

          <div class="meta">
            ${escapeHTML(product.medidas)}
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
    if (!grid || !count) {
      return;
    }

    const list =
      activeFilter === "all"
        ? PRODUCTS
        : PRODUCTS.filter(
            product =>
              product.category ===
              activeFilter
          );

    grid.innerHTML =
      list.map(cardHTML).join("");

    count.textContent =
      list.length;

    grid
      .querySelectorAll(
        ".product-card"
      )
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

            openModal(
              card.dataset.id
            );
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

              openModal(
                card.dataset.id
              );
            }
          }
        );
      });

    grid
      .querySelectorAll(
        ".zoom-trigger-btn"
      )
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
    const product =
      getProduct(productId);

    if (
      !product ||
      !modal ||
      !modalBody ||
      !modalOverlay
    ) {
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
            style="
              display:block;
              font-size:12px;
              color:var(--muted);
              margin:14px 0 6px;
            "
          >
            Elige una presentación
          </label>

          <select
            id="variantSelector"
            style="
              width:100%;
              padding:11px 13px;
              border:1px solid var(--border);
              background:white;
              font-family:var(--font-body);
              margin-bottom:14px;
            "
          >
            ${product.variants
              .map(
                variant => `
                  <option
                    value="${escapeHTML(
                      variant.id
                    )}"
                  >
                    ${escapeHTML(
                      variant.name
                    )}
                    —
                    ${formatCurrency(
                      variant.price
                    )}
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
            style="
              width:100%;
              margin-bottom:12px;
              font-weight:600;
            "
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
        style="
          position:relative;
          background:var(--teal-soft);
          cursor:zoom-in;
        "
      >
        <img
          class="modal-img"
          src="${escapeHTML(product.img)}"
          alt="${escapeHTML(product.name)}"
        >

        <div
          style="
            position:absolute;
            top:12px;
            left:12px;
            background:rgba(255,255,255,0.9);
            padding:4px 8px;
            font-size:11px;
            font-family:var(--font-mono);
            border:1px solid var(--border);
          "
        >
          Click para ampliar
        </div>
      </div>

      <div class="modal-info">
        <span class="cat-label">
          ${escapeHTML(
            product.categoryLabel
          )}
        </span>

        <h3>
          ${escapeHTML(product.name)}
        </h3>

        <div class="price">
          ${getProductPriceLabel(product)}

          <span class="ship-note">
            + envío
          </span>
        </div>

        <p
          style="
            font-size:14px;
            line-height:1.6;
            color:var(--muted);
          "
        >
          ${escapeHTML(
            product.description || ""
          )}
        </p>

        <dl>
          <div>
            <dt>
              Medidas / tallas
            </dt>

            <dd>
              ${escapeHTML(product.medidas)}
            </dd>
          </div>

          <div>
            <dt>
              Material / notas
            </dt>

            <dd>
              ${escapeHTML(product.material)}
            </dd>
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

    const modalImgContainer =
      document.getElementById(
        "modalImgContainer"
      );

    if (modalImgContainer) {
      modalImgContainer.addEventListener(
        "click",
        () => {
          openZoom(
            product.img,
            product.name
          );
        }
      );
    }

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

    modal.classList.add(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    modalOverlay.classList.add(
      "open"
    );

    document.body.style.overflow =
      "hidden";

    if (modalClose) {
      modalClose.focus();
    }
  }

  function closeModal() {
    if (
      !modal ||
      !modalOverlay
    ) {
      return;
    }

    modal.classList.remove(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    modalOverlay.classList.remove(
      "open"
    );

    document.body.style.overflow =
      "";
  }

  function openShippingModal() {
    if (
      !shippingModal ||
      !shippingOverlay
    ) {
      return;
    }

    shippingModal.classList.add(
      "open"
    );

    shippingModal.setAttribute(
      "aria-hidden",
      "false"
    );

    shippingOverlay.classList.add(
      "open"
    );

    document.body.style.overflow =
      "hidden";

    const shippingName =
      document.getElementById(
        "shippingName"
      );

    if (shippingName) {
      shippingName.focus();
    }
  }

  function closeShippingModal() {
    if (
      !shippingModal ||
      !shippingOverlay
    ) {
      return;
    }

    shippingModal.classList.remove(
      "open"
    );

    shippingModal.setAttribute(
      "aria-hidden",
      "true"
    );

    shippingOverlay.classList.remove(
      "open"
    );

    document.body.style.overflow =
      "";
  }

  function normalizePhone(phone) {
    const digits =
      String(phone || "")
        .replace(/\D/g, "");

    if (digits.length === 10) {
      return `+52${digits}`;
    }

    if (
      digits.startsWith("52") &&
      digits.length === 12
    ) {
      return `+${digits}`;
    }

    return String(phone || "").trim();
  }

  function renderShippingRates(rates) {
    if (!shippingResults) {
      return;
    }

    shippingResults.innerHTML =
      rates.map((rate, index) => `
        <label
          style="
            display:block;
            border:1px solid var(--border);
            padding:14px;
            margin-bottom:10px;
            cursor:pointer;
            background:white;
          "
        >
          <div
            style="
              display:flex;
              gap:10px;
              align-items:flex-start;
            "
          >
            <input
              type="radio"
              name="shippingRate"
              value="${index}"
              style="margin-top:4px;"
            >

            <span
              style="
                display:block;
                flex:1;
              "
            >
              <strong
                style="
                  display:block;
                  color:var(--ink);
                "
              >
                ${escapeHTML(
                  String(
                    rate.carrier ||
                    "Mensajería"
                  ).toUpperCase()
                )}
              </strong>

              <span
                style="
                  display:block;
                  margin-top:3px;
                "
              >
                ${escapeHTML(
                  rate.serviceDescription ||
                  rate.service ||
                  "Servicio"
                )}
              </span>

              <span
                style="
                  display:block;
                  color:var(--muted);
                  font-size:12px;
                  margin-top:3px;
                "
              >
                ${escapeHTML(
                  rate.deliveryEstimate ||
                  "Entrega por confirmar"
                )}
              </span>
            </span>

            <strong>
              ${formatCurrency(
                Number(
                  rate.totalPrice || 0
                )
              )}
            </strong>
          </div>
        </label>
      `).join("");

    shippingResults
      .querySelectorAll(
        'input[name="shippingRate"]'
      )
      .forEach(input => {
        input.addEventListener(
          "change",
          () => {
            const rate =
              rates[
                Number(input.value)
              ];

            if (!rate) {
              return;
            }

            selectedShipping = {
              carrier:
                rate.carrier || "",

              service:
                rate.service || "",

              serviceDescription:
                rate.serviceDescription ||
                rate.service ||
                "Servicio de envío",

              deliveryEstimate:
                rate.deliveryEstimate ||
                "Entrega por confirmar",

              deliveryDate:
                rate.deliveryDate || null,

              totalPrice:
                Number(
                  rate.totalPrice || 0
                ),

              currency:
                rate.currency || "MXN"
            };

            if (shippingStatus) {
              shippingStatus.textContent =
                "Opción de envío seleccionada. Ya puedes continuar al pago.";
            }

            updateCartDOM();
          }
        );
      });
  }

  const openCartButton =
    document.getElementById(
      "openCartBtn"
    );

  const openCartButtonMobile =
    document.getElementById(
      "openCartBtnMobile"
    );

  const openShippingButtonHeader =
    document.getElementById(
      "openShippingBtnHeader"
    );

  const openShippingButtonNote =
    document.getElementById(
      "openShippingBtnNote"
    );

  if (openCartButton) {
    openCartButton.addEventListener(
      "click",
      openCartDrawer
    );
  }

  if (openCartButtonMobile) {
    openCartButtonMobile.addEventListener(
      "click",
      openCartDrawer
    );
  }

  if (openShippingButtonHeader) {
    openShippingButtonHeader.addEventListener(
      "click",
      openShippingModal
    );
  }

  if (openShippingButtonNote) {
    openShippingButtonNote.addEventListener(
      "click",
      openShippingModal
    );
  }

  filterBtns.forEach(button => {
    button.addEventListener(
      "click",
      () => {
        filterBtns.forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );

        button.classList.add(
          "active"
        );

        activeFilter =
          button.dataset.filter;

        render();
      }
    );
  });

  if (modalClose) {
    modalClose.addEventListener(
      "click",
      closeModal
    );
  }

  if (modalOverlay) {
    modalOverlay.addEventListener(
      "click",
      closeModal
    );
  }

  if (cartClose) {
    cartClose.addEventListener(
      "click",
      closeCartDrawer
    );
  }

  if (cartOverlay) {
    cartOverlay.addEventListener(
      "click",
      closeCartDrawer
    );
  }

  if (shippingClose) {
    shippingClose.addEventListener(
      "click",
      closeShippingModal
    );
  }

  if (shippingOverlay) {
    shippingOverlay.addEventListener(
      "click",
      closeShippingModal
    );
  }

  if (zoomClose) {
    zoomClose.addEventListener(
      "click",
      closeZoom
    );
  }

  if (zoomOverlay) {
    zoomOverlay.addEventListener(
      "click",
      closeZoom
    );
  }

  if (zoomImage) {
    zoomImage.addEventListener(
      "click",
      closeZoom
    );
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener(
      "click",
      checkoutWithStripe
    );
  }

  if (shippingForm) {
    shippingForm.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const nameInput =
          document.getElementById(
            "shippingName"
          );

        const phoneInput =
          document.getElementById(
            "shippingPhone"
          );

        const emailInput =
          document.getElementById(
            "shippingEmail"
          );

        const streetInput =
          document.getElementById(
            "shippingStreet"
          );

        const numberInput =
          document.getElementById(
            "shippingNumber"
          );

        const districtInput =
          document.getElementById(
            "shippingDistrict"
          );

        const postalCodeInput =
          document.getElementById(
            "shippingCP"
          );

        const cityInput =
          document.getElementById(
            "shippingCity"
          );

        const postalCode =
          postalCodeInput
            ? postalCodeInput.value.trim()
            : "";

        if (
          !/^\d{5}$/.test(
            postalCode
          )
        ) {
          shippingStatus.textContent =
            "Escribe un código postal mexicano de cinco dígitos.";

          return;
        }

        if (
          !nameInput?.value.trim() ||
          !phoneInput?.value.trim() ||
          !streetInput?.value.trim() ||
          !numberInput?.value.trim() ||
          !districtInput?.value.trim()
        ) {
          shippingStatus.textContent =
            "Completa los datos obligatorios de la dirección.";

          return;
        }

        shippingSubmit.disabled =
          true;

        shippingSubmit.textContent =
          "Calculando…";

        shippingStatus.textContent =
          "Validando dirección y consultando mensajerías…";

        shippingResults.innerHTML =
          "";

        selectedShipping =
          null;

        lastShippingDestination =
          null;

        try {
          const destination = {
            name:
              nameInput.value.trim(),

            phone:
              normalizePhone(
                phoneInput.value
              ),

            email:
              emailInput
                ? emailInput.value.trim()
                : "",

            street:
              `${streetInput.value.trim()} ${numberInput.value.trim()}`,

            district:
              districtInput.value.trim(),

            city:
              cityInput
                ? cityInput.value.trim()
                : "",

            state:
              "",

            country:
              "MX",

            postalCode
          };

          const response =
            await fetch(
              SHIPPING_RATES_ENDPOINT,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  destination
                })
              }
            );

          const data =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok) {
            const carrierDetails =
              Array.isArray(
                data.details
              )
                ? data.details
                    .map(
                      item =>
                        `${item.carrier}: ${item.message}`
                    )
                    .join(" · ")
                : "";

            throw new Error(
              [
                data.error ||
                "No fue posible obtener tarifas para ese destino.",

                carrierDetails
              ]
                .filter(Boolean)
                .join(" ")
            );
          }

          if (
            !Array.isArray(
              data.rates
            ) ||
            data.rates.length === 0
          ) {
            throw new Error(
              "No se encontraron opciones de envío para ese destino."
            );
          }

          if (
            data.destination?.city &&
            cityInput
          ) {
            cityInput.value =
              data.destination.city;
          }

          lastShippingDestination = {
            ...destination,

            city:
              data.destination?.city ||
              destination.city,

            state:
              data.destination?.state ||
              destination.state,

            postalCode:
              data.destination?.postalCode ||
              destination.postalCode
          };

          shippingStatus.textContent =
            "Selecciona una opción de envío:";

          renderShippingRates(
            data.rates
          );
        } catch (error) {
          console.error(error);

          shippingStatus.textContent =
            error.message ||
            "No fue posible calcular el envío.";
        } finally {
          shippingSubmit.disabled =
            false;

          shippingSubmit.textContent =
            "Calcular envío";
        }
      }
    );
  }

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