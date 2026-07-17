// api/shipping-rates.js
// Cotización de envíos para Casa Anglard mediante Envia.com.

const ENVIA_API_URL = "https://api.envia.com/ship/rate/";

const ENVIA_GEOCODES_URL =
  "https://geocodes.envia.com/zipcode/MX";

const ORIGIN = {
  name: "Casa Anglard",
  company: "Casa Anglard",
  email: "casaanglard@gmail.com",
  phone: "+525637091144",
  street: "Cataluña 21",
  district: "Insurgentes Mixcoac",
  city: "Benito Juárez",
  state: "CX",
  country: "MX",
  postalCode: "03740"
};

const CARRIERS = [
  "dhl",
  "fedex",
  "estafeta"
];

const DEFAULT_PACKAGE = {
  type: "box",
  content: "Productos Casa Anglard",
  amount: 1,
  declaredValue: 500,
  weight: 1,
  weightUnit: "KG",
  lengthUnit: "CM",
  dimensions: {
    length: 30,
    width: 25,
    height: 15
  }
};

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function validatePostalCode(postalCode) {
  return /^[0-9]{5}$/.test(
    normalizeText(postalCode)
  );
}

function validateDestination(destination) {
  if (
    !destination ||
    typeof destination !== "object"
  ) {
    return false;
  }

  const requiredFields = [
    "name",
    "phone",
    "street",
    "district",
    "postalCode"
  ];

  const hasRequiredFields =
    requiredFields.every(field => {
      return normalizeText(
        destination[field]
      ) !== "";
    });

  return (
    hasRequiredFields &&
    validatePostalCode(
      destination.postalCode
    )
  );
}

async function validateDestinationPostalCode(
  postalCode
) {
  const url =
    `${ENVIA_GEOCODES_URL}/${encodeURIComponent(
      postalCode
    )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (
    !response.ok ||
    !data?.success ||
    !data?.data
  ) {
    throw new Error(
      "El código postal no pudo validarse con Envia."
    );
  }

  const location = data.data;

  const city =
    normalizeText(location.city);

  const state =
    normalizeText(location.state);

  if (!city || !state) {
    throw new Error(
      "Envia no devolvió la ciudad o el estado del código postal."
    );
  }

  return {
    city,
    state,
    country:
      normalizeText(location.country) ||
      "MX",
    postalCode:
      normalizeText(
        location.zipcode ||
        location.postalCode
      ) || postalCode
  };
}

function createDestination(
  destination,
  location
) {
  return {
    name:
      normalizeText(destination.name),

    company:
      normalizeText(destination.company),

    email:
      normalizeText(destination.email),

    phone:
      normalizeText(destination.phone),

    street:
      normalizeText(destination.street),

    district:
      normalizeText(destination.district),

    city:
      location.city,

    state:
      location.state,

    country:
      location.country || "MX",

    postalCode:
      location.postalCode
  };
}

function createPackage(packageData) {
  const source =
    packageData || DEFAULT_PACKAGE;

  const weight =
    Number(source.weight);

  const length =
    Number(
      source.dimensions?.length ??
      source.length
    );

  const width =
    Number(
      source.dimensions?.width ??
      source.width
    );

  const height =
    Number(
      source.dimensions?.height ??
      source.height
    );

  const declaredValue =
    Number(
      source.declaredValue ??
      DEFAULT_PACKAGE.declaredValue
    );

  if (
    !Number.isFinite(weight) ||
    !Number.isFinite(length) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    weight <= 0 ||
    length <= 0 ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(
      "El peso o las dimensiones del paquete no son válidos."
    );
  }

  return {
    type: "box",

    content:
      normalizeText(source.content) ||
      DEFAULT_PACKAGE.content,

    amount: 1,

    declaredValue:
      Number.isFinite(declaredValue) &&
      declaredValue > 0
        ? declaredValue
        : DEFAULT_PACKAGE.declaredValue,

    weight,

    weightUnit: "KG",

    lengthUnit: "CM",

    dimensions: {
      length,
      width,
      height
    }
  };
}

async function requestCarrierRate({
  token,
  carrier,
  destination,
  packageData
}) {
  const response =
    await fetch(
      ENVIA_API_URL,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body: JSON.stringify({
          origin: ORIGIN,

          destination,

          packages: [
            packageData
          ],

          shipment: {
            type: 1,
            carrier
          },

          settings: {
            currency: "MXN"
          }
        })
      }
    );

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      data?.meta ||
      `Envia respondió con código ${response.status}.`;

    throw new Error(
      typeof errorMessage === "string"
        ? errorMessage
        : JSON.stringify(errorMessage)
    );
  }

  return Array.isArray(data?.data)
    ? data.data
    : [];
}

function normalizeRate(rate) {
  const totalPrice =
    Number(rate.totalPrice);

  return {
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
      "Tiempo de entrega por confirmar",

    deliveryDate:
      rate.deliveryDate || null,

    totalPrice:
      Number.isFinite(totalPrice)
        ? totalPrice
        : 0,

    currency:
      rate.currency || "MXN"
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

  const token =
    process.env.ENVIA_TOKEN;

  if (!token) {
    return response
      .status(500)
      .json({
        error:
          "La variable privada ENVIA_TOKEN no está configurada en Vercel."
      });
  }

  try {
    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body || {};

    const destination =
      body.destination;

    if (
      !validateDestination(
        destination
      )
    ) {
      return response
        .status(400)
        .json({
          error:
            "La dirección está incompleta o el código postal no tiene cinco dígitos."
        });
    }

    const postalCode =
      normalizeText(
        destination.postalCode
      );

    const location =
      await validateDestinationPostalCode(
        postalCode
      );

    const normalizedDestination =
      createDestination(
        destination,
        location
      );

    const packageData =
      createPackage(
        body.package ||
        DEFAULT_PACKAGE
      );

    const carrierRequests =
      CARRIERS.map(carrier => {
        return requestCarrierRate({
          token,
          carrier,
          destination:
            normalizedDestination,
          packageData
        });
      });

    const carrierResults =
      await Promise.allSettled(
        carrierRequests
      );

    const rates = [];
    const errors = [];

    carrierResults.forEach(
      (result, index) => {
        const carrier =
          CARRIERS[index];

        if (
          result.status ===
          "fulfilled"
        ) {
          result.value.forEach(
            rate => {
              rates.push(
                normalizeRate(rate)
              );
            }
          );
        } else {
          errors.push({
            carrier,

            message:
              result.reason?.message ||
              "No fue posible obtener una tarifa."
          });
        }
      }
    );

    rates.sort(
      (firstRate, secondRate) => {
        return (
          firstRate.totalPrice -
          secondRate.totalPrice
        );
      }
    );

    if (rates.length === 0) {
      return response
        .status(422)
        .json({
          error:
            "No se encontraron servicios disponibles para ese destino.",

          details:
            errors,

          validatedDestination:
            normalizedDestination
        });
    }

    return response
      .status(200)
      .json({
        origin: {
          city:
            ORIGIN.city,

          state:
            ORIGIN.state,

          postalCode:
            ORIGIN.postalCode
        },

        destination: {
          city:
            normalizedDestination.city,

          state:
            normalizedDestination.state,

          postalCode:
            normalizedDestination.postalCode
        },

        package:
          packageData,

        rates,

        unavailableCarriers:
          errors
      });
  } catch (error) {
    console.error(
      "Error al cotizar con Envia:",
      error
    );

    return response
      .status(500)
      .json({
        error:
          error?.message ||
          "No fue posible calcular el envío."
      });
  }
}
