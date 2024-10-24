const axios = require('axios');

const apiUrls = {
  basico: "https://bitecingcom.ipage.com/testapi/basico.js",
  intermedio: "https://bitecingcom.ipage.com/testapi/intermedio.js",
  avanzado: "https://bitecingcom.ipage.com/testapi/avanzado.js",
};

const APIflights = async (level) => {
  try {
    const apiUrl = apiUrls[level] || apiUrls.basico;
    const response = await axios.get(apiUrl);

    // limpiar la response de acuerdo a la devolucion de datos que genera la peticion (eliminar comas antes de } y ] )
    const cleanedData = response.data
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    const flightsData = JSON.parse(cleanedData);

    if (Array.isArray(flightsData)) {
      return flightsData;
    } else {
      console.error('API returned an unexpected format:', flightsData);
      return [];
    }
  } catch (error) {
    console.error('Error fetching flights from API:', error);
    return [];
  }
};

module.exports = { APIflights };