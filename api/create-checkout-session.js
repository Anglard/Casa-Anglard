// api/create-checkout-session.js
// Crea sesiones seguras de Stripe Checkout para Casa Anglard.

import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY
);

// Catálogo validado en el servidor.
// Nunca usamos los precios enviados desde el navegador.
const SERVER_CATALOG = {
  poster: {
    name: "Póster de Exhibición",
    price: 68
  },

  postal: {
    name: "Postal Editorial",
    price: 41
  },

  termo: {
    name: "Termo de Acero Inoxidable",
    price: 567
  },

  libreta: {
    name: "Libreta de Cubierta Rígida",
    price: 189
  },

  imanes: {
    name: "Imanes de Acrílico",
    price: 61
  },

  lapices: {
    name: "Lápices Especiales",

    variants: {
      "sin-goma": {
        name: "Negro sin goma",
        price: 16
      },

      "con-goma": {
        name: "Negro con goma",
        price: 20
      },

      arcoiris: {
        name: "Arcoíris",
        price: 20
      }
    }
  },

  pin: {
    name: "Pin Metálico Esmaltado",
    price: null
  },

  "bolsa-chica": {
    name: "Bolsa Premium Chica",
    price: 284
  },

  "bolsa-mediana": {
    name: "Bolsa Premium Mediana",
    price: 338
  },

  "bolsa-grande": {
    name: "Bolsa Premium Grande",
    price: 311
  },

  "bolsa-manta": {
    name: "Bolsa de Manta",
    price: 115
  },

  cosmetiquera: {
    name: "Cosmetiquera de Mezclilla",
    price: 115
  },

  monedero: {
    name: "Monedero de Mezclilla",
    price: 54
  },

  playera: {
    name: "Playera Estampada",

    variants: {
      "ch-m-g": {
        name: "Tallas CH, M o G",
        price: 270
      },

      xg: {
        name: "Talla XG",
        price: 311
      }
    }
  },

  sudadera: {
    name: "Sudadera con Capucha",

    variants: {
      "ch-m-g": {
        name: "Tallas CH, M o G",
        price: 574
      },

      xg: {
        name: "Talla XG",
        price: 621
      }
    }
  },

  patchouli: {
    name: "Aroma de Patchouli",
    variants: createAromaVariants()
  },

  "flor-naranjo": {
    name: "Aroma de Flor de Naranjo",
    variants: createAromaVariants()
  },

  mandarina: {
    name: "Aroma de Mandarina",
    variants: createAromaVariants()
  },

  sandalo: {
    name: "Aroma de Sándalo",
    variants: createAromaVariants()
  },

  "mix-18": {
    name: "Aroma Mix de 18 Elementos",
    variants: createAromaVariants()
  },

  "arbol-te": {
    name: "Aroma de Árbol de Té",
    variants: createAromaVariants()
  },

  bergamota: {
    name: "Aroma de Bergamota",
    variants: createAromaVariants()
  },

  "toronja-rosa": {
    name: "Aroma de Toronja Rosa",
    variants: createAromaVariants()
  },

  geranio: {
    name: "Aroma de Geranio",
    variants: createAromaVariants()
  },

  menta: {
    name: "Aroma de Menta",
    variants: createAromaVariants()
  },

  eucalipto: {
    name: "Aroma de Eucalipto",
    variants: createAromaVariants()
  },

  romero: {
    name: "Aroma de Romero",
    variants: createAromaVariants()
  },

  lavanda: {
    name: "Aroma de Lavanda",
    variants: createAromaVariants()
  },

  "eucalipto-dulce": {
    name: "Aroma de Eucalipto Dulce",
    variants: createAromaVariants()
  },

  limon: {
    name: "Aroma de Limón",
    variants: createAromaVariants()
  }
};

function createAromaVariants() {
  return {
    "10ml": {
      name: "Gotero de 10 ml",
      price: 250
    },

    "20ml": {
      name: "Gotero de 20 ml",
      price: 320
    },

    spray: {
      name: "Spray ambiental",
      price: 380
    }
  };
}

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 20
  ) {
    throw new Error(
      "La cantidad de un producto no es válida."
    );
  }

  return quantity;
}

function getValidatedCatalogItem(item) {
  const productId =
    normalizeText(item?.productId);

  const variantId =
    normalizeText(item?.variantId);

  const product =
    SERVER_CATALOG[productId];

  if (!product) {
    throw new Error(
      `El producto ${productId || "desconocido"} no existe.`
    );
  }

  const quantity =
    normalizeQuantity(item?.quantity);

  if (product.variants) {
    const variant =
      product.variants[variantId];

    if (!variant) {
      throw new Error(
        `La presentación elegida para ${product.name} no es válida.`
      );
    }

    return {
      productId,
      variantId,
      quantity,
      name:
        `${product.name} — ${variant.name}`,
      unitAmount:
        Math.round(
          Number(variant.price) * 100
        )
    };
  }

  if (
    typeof product.price !== "number" ||
    product.price <= 0
  ) {
    throw new Error(
      `${product.name} requiere cotización y no puede pagarse directamente.`
    );
  }

  return {
    productId,
    variantId: null,
    quantity,
    name:
      product.name,
    unitAmount:
      Math.round(
        Number(product.price) * 100
      )
  };
}

function getRequestOrigin(request) {
  const forwardedHost =
    request.headers["x-forwarded-host"];

  const host =
    forwardedHost ||
    request.headers.host;

  const forwardedProtocol =
    request.headers["x-forwarded-proto"];

  const protocol =
    forwardedProtocol ||
    "https";

  if (!host) {
    return "https://www.casa-anglard.com";
  }

  return `${protocol}://${host}`;
}

async function recalculateShipping({
  request,
  shipping
}) {
  const destination =
    shipping?.destination;

  const carrier =
    normalizeText(
      shipping?.carrier
    ).toLowerCase();

  const service =
    normalizeText(
      shipping?.service
    );

  if (
    !destination ||
    !carrier
  ) {
    throw new Error(
      "Primero debes calcular y seleccionar una opción de envío."
    );
  }

  const origin =
    getRequestOrigin(request);

  const rateResponse =
    await fetch(
      `${origin}/api/shipping-rates`,
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

  const rateData =
    await rateResponse
      .json()
      .catch(() => ({}));

  if (!rateResponse.ok) {
    throw new Error(
      rateData.error ||
      "No fue posible volver a validar el envío."
    );
  }

  if (
    !Array.isArray(rateData.rates) ||
    rateData.rates.length === 0
  ) {
    throw new Error(
      "No se encontró una tarifa vigente para el envío."
    );
  }

  let validatedRate =
    rateData.rates.find(rate => {
      const rateCarrier =
        normalizeText(
          rate.carrier
        ).toLowerCase();

      const rateService =
        normalizeText(
          rate.service
        );

      return (
        rateCarrier === carrier &&
        rateService === service
      );
    });

  // Algunas mensajerías no devuelven siempre el mismo
  // identificador de servicio. Como respaldo buscamos
  // la tarifa más económica del transportista elegido.
  if (!validatedRate) {
    validatedRate =
      rateData.rates
        .filter(rate => {
          return (
            normalizeText(
              rate.carrier
            ).toLowerCase() === carrier
          );
        })
        .sort((firstRate, secondRate) => {
          return (
            Number(firstRate.totalPrice) -
            Number(secondRate.totalPrice)
          );
        })[0];
  }

  if (!validatedRate) {
    throw new Error(
      "La tarifa seleccionada ya no está disponible. Vuelve a cotizar el envío."
    );
  }

  const totalPrice =
    Number(
      validatedRate.totalPrice
    );

  if (
    !Number.isFinite(totalPrice) ||
    totalPrice <= 0
  ) {
    throw new Error(
      "Envia devolvió un precio de envío inválido."
    );
  }

  return {
    carrier:
      normalizeText(
        validatedRate.carrier
      ) || carrier,

    service:
      normalizeText(
        validatedRate.service
      ),

    serviceDescription:
      normalizeText(
        validatedRate.serviceDescription
      ) ||
      normalizeText(
        validatedRate.service
      ) ||
      "Servicio de mensajería",

    deliveryEstimate:
      normalizeText(
        validatedRate.deliveryEstimate
      ) ||
      "Entrega por confirmar",

    totalPrice,

    currency:
      normalizeText(
        validatedRate.currency
      ) || "MXN",

    destination:
      rateData.destination ||
      destination
  };
}

function createProductLineItem(item) {
  return {
    quantity:
      item.quantity,

    price_data: {
      currency:
        "mxn",

      unit_amount:
        item.unitAmount,

      product_data: {
        name:
          item.name,

        metadata: {
          product_id:
            item.productId,

          variant_id:
            item.variantId || ""
        }
      }
    }
  };
}

function createShippingLineItem(
  validatedShipping
) {
  return {
    quantity: 1,

    price_data: {
      currency:
        "mxn",

      unit_amount:
        Math.round(
          validatedShipping.totalPrice *
          100
        ),

      product_data: {
        name:
          `Envío — ${validatedShipping.carrier.toUpperCase()}`,

        description:
          `${validatedShipping.serviceDescription}. ${validatedShipping.deliveryEstimate}`,

        metadata: {
          type:
            "shipping",

          carrier:
            validatedShipping.carrier,

          service:
            validatedShipping.service || ""
        }
      }
    }
  };
}

export default async function handler(
  request,
  response
) {
  response.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  if (request.method !== "POST") {
    response.setHeader(
      "Allow",
      "POST"
    );

    return response
      .status(405)
      .json({
        error:
          "Método no permitido."
      });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return response
      .status(500)
      .json({
        error:
          "La variable STRIPE_SECRET_KEY no está disponible en Vercel."
      });
  }

  try {
    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body || {};

    const items =
      body.items;

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return response
        .status(400)
        .json({
          error:
            "La bolsa está vacía."
        });
    }

    if (items.length > 50) {
      return response
        .status(400)
        .json({
          error:
            "La bolsa contiene demasiados artículos diferentes."
        });
    }

    const validatedItems =
      items.map(
        getValidatedCatalogItem
      );

    const validatedShipping =
      await recalculateShipping({
        request,
        shipping:
          body.shipping
      });

    const productLineItems =
      validatedItems.map(
        createProductLineItem
      );

    const shippingLineItem =
      createShippingLineItem(
        validatedShipping
      );

    const origin =
      getRequestOrigin(request);

    const customerEmail =
      normalizeText(
        body.shipping?.destination?.email
      );

    const session =
      await stripe.checkout.sessions.create({
        mode:
          "payment",

        line_items: [
          ...productLineItems,
          shippingLineItem
        ],

        success_url:
          `${origin}/?pago=exitoso&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${origin}/?pago=cancelado`,

        locale:
          "es",

        customer_email:
          customerEmail || undefined,

        billing_address_collection:
          "auto",

        shipping_address_collection: {
          allowed_countries: [
            "MX"
          ]
        },

        phone_number_collection: {
          enabled:
            true
        },

        allow_promotion_codes:
          false,

        metadata: {
          store:
            "Casa Anglard",

          shipping_carrier:
            validatedShipping.carrier,

          shipping_service:
            validatedShipping.service || "",

          shipping_postal_code:
            normalizeText(
              body.shipping
                ?.destination
                ?.postalCode
            )
        },

        payment_intent_data: {
          metadata: {
            store:
              "Casa Anglard",

            shipping_carrier:
              validatedShipping.carrier,

            shipping_service:
              validatedShipping.service || ""
          }
        }
      });

    if (!session.url) {
      throw new Error(
        "Stripe creó la sesión, pero no devolvió la página de pago."
      );
    }

    return response
      .status(200)
      .json({
        id:
          session.id,

        url:
          session.url
      });
  } catch (error) {
    console.error(
      "Error al crear sesión de Stripe:",
      error
    );

    const message =
      error?.type ===
      "StripeAuthenticationError"
        ? "Stripe rechazó la clave secreta configurada."
        : error?.message ||
          "No fue posible iniciar el pago.";

    return response
      .status(500)
      .json({
        error:
          message
      });
  }
}
