// api/shipping-rates.js
// Cotización de envíos para Casa Anglard mediante Envia.com.

const ENVIA_API_URL =
  "https://api.envia.com/ship/rate/";

const ENVIA_GEOCODES_URL =
  "https://geocodes.envia.com/zipcode/MX";

const ORIGIN = {
  name: "Casa Anglard",
  company: "Casa Anglard",
  email: "casaanglard@gmail.com",
  phone: "+525637091144",
  street: "Cataluña 21",
  district: "Insurgentes Mixcoac",
  city: "Ciudad de Mexico",
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

function isValidPostalCode(postalCode) {
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

  const fieldsArePresent =
    requiredFields.every(field => {
      return normalizeText(
        destination[field]
      ) !== "";
    });

  return (
    fieldsArePresent &&
    isValidPostalCode(
      destination.postalCode
    )
  );
}

async function getPostalCodeLocation(
  postalCode
) {
  const url =
    `${ENVIA_GEOCODES_URL}/${encodeURIComponent(
      postalCode
    )}`;

  const geocodeResponse =
    await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

  const rawText =
    await geocodeResponse.text();

  let parsedData = null;

  try {
    parsedData =
      rawText
        ? JSON.parse(rawText)
        : null;
  } catch {
    throw new Error(
      `Geocodes devolvió una respuesta no válida. Código HTTP: ${geocodeResponse.status}.`
    );
  }

  if (!geocodeResponse.ok) {
    const message =
      parsedData?.message ||
      parsedData?.error ||
      `Geocodes respondió con código ${geocodeResponse.status}.`;

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  /*
   * Envia documenta normalmente:
   *
   * {
   *   success: true,
   *   data: {
   *     zipcode,
   *     city,
   *     state,
   *     country
   *   }
   * }
   *
   * También aceptamos una respuesta directa o un arreglo,
   * para evitar que una pequeña variación rompa la integración.
   */

  let location = null;

  if (
    parsedData &&
    typeof parsedData.data === "object" &&
    !Array.isArray(parsedData.data)
  ) {
    location =
      parsedData.data;
  } else if (
    Array.isArray(parsedData?.data) &&
    parsedData.data.length > 0
  ) {
    location =
      parsedData.data[0];
  } else if (
    parsedData &&
    typeof parsedData === "object"
  ) {
    location =
      parsedData;
  }

  if (!location) {
    throw new Error(
      "Envia no devolvió información para ese código postal."
    );
  }

  const city =
    normalizeText(
      location.city ||
      location.locality ||
      location.municipality
    );

  const state =
    normalizeText(
      location.state ||
      location.stateCode ||
      location.state_code
    );

  const returnedPostalCode =
    normalizeText(
      location.zipcode ||
      location.postalCode ||
      location.postal_code
    ) || postalCode;

  const country =
    normalizeText(
      location.country ||
      location.countryCode ||
      location.country_code
    ) || "MX";

  if (!city) {
    throw new Error(
      `Envia validó el código postal ${postalCode}, pero no devolvió la ciudad.`
    );
  }

  if (!state) {
    throw new Error(
      `Envia validó el código postal ${postalCode}, pero no devolvió el estado.`
    );
  }

  return {
    city,
    state,
    country,
    postalCode:
      returnedPostalCode
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
    Number(
      source.weight ??
      DEFAULT_PACKAGE.weight
    );

  const length =
    Number(
      source.dimensions?.length ??
      source.length ??
      DEFAULT_PACKAGE.dimensions.length
    );

  const width =
    Number(
      source.dimensions?.width ??
      source.width ??
      DEFAULT_PACKAGE.dimensions.width
    );

  const height =
    Number(
      source.dimensions?.height ??
      source.height ??
      DEFAULT_PACKAGE.dimensions.height
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
  const rateResponse =
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

  const rawText =
    await rateResponse.text();

  let data = null;

  try {
    data =
      rawText
        ? JSON.parse(rawText)
        : null;
  } catch {
    throw new Error(
      `${carrier}: Envia devolvió una respuesta no válida. Código HTTP: ${rateResponse.status}.`
    );
  }

  if (!rateResponse.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.meta ||
      `${carrier}: Envia respondió con código ${rateResponse.status}.`;

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (
    data?.data &&
    typeof data.data === "object"
  ) {
    return [data.data];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function normalizeRate(rate) {
  const possiblePrice =
    rate.totalPrice ??
    rate.total ??
    rate.price ??
    rate.cost;

  const totalPrice =
    Number(possiblePrice);

  return {
    carrier:
      rate.carrier || "",

    service:
      rate.service || "",

    serviceDescription:
      rate.serviceDescription ||
      rate.serviceName ||
      rate.service ||
      "Servicio de envío",

    deliveryEstimate:
      rate.deliveryEstimate ||
      rate.deliveryTime ||
      rate.transitDays ||
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
          "La variable ENVIA_TOKEN no está disponible en este despliegue."
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
      await getPostalCodeLocation(
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

    const carrierResults =
      await Promise.allSettled(
        CARRIERS.map(carrier => {
          return requestCarrierRate({
            token,
            carrier,
            destination:
              normalizedDestination,
            packageData
          });
        })
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
              const normalizedRate =
                normalizeRate(rate);

              if (
                normalizedRate.totalPrice > 0
              ) {
                rates.push(
                  normalizedRate
                );
              }
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
            "El código postal fue validado, pero ninguna mensajería devolvió una tarifa.",

          details:
            errors,

          validatedDestination: {
            city:
              normalizedDestination.city,

            state:
              normalizedDestination.state,

            postalCode:
              normalizedDestination.postalCode
          }
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
      "Error detallado en shipping-rates:",
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
