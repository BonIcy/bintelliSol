const db = require('../db/config');
const { APIflights } = require('../api/apiService');

// esto es para el punto 3, decidi hacer un controlador aparte en vez de seguir con el del punto 2
const getFlight3 = async (req, res) => {
  const { Origin, Destination, maxFlights } = req.body; 
  const maxConnections = maxFlights || 3; 

  try {
    const flightsData = await APIflights('basico');

    if (!Array.isArray(flightsData) || flightsData.length === 0) {
      return res.status(500).json({ message: 'Unexpected API response format or empty flights data' });
    }

    const route = [];
    let currentOrigin = Origin;
    let totalPrice = 0;

    for (let i = 0; i < maxConnections; i++) {
      const nextFlight = flightsData.find(flight => flight.DepartureStation === currentOrigin);

      if (!nextFlight) {
        return res.status(404).json({ message: `No flight found from ${currentOrigin}` });
      }

      route.push({
        Origin: nextFlight.DepartureStation,
        Destination: nextFlight.ArrivalStation,
        Price: nextFlight.Price,
        Transport: {
          FlightCarrier: nextFlight.FlightCarrier,
          FlightNumber: nextFlight.FlightNumber
        }
      });

      totalPrice += nextFlight.Price;

      if (nextFlight.ArrivalStation === Destination) {
        break;
      }

      currentOrigin = nextFlight.ArrivalStation;

      if (i === maxConnections - 1 && currentOrigin !== Destination) {
        return res.status(400).json({ message: 'Maximum connections reached without finding destination' });
      }
    }

    const [journeyResult] = await db.query(
      'INSERT INTO Journey (origin, destination, price) VALUES (?, ?, ?)',
      [Origin, Destination, totalPrice]
    );
    const journeyId = journeyResult.insertId;

    for (const flight of route) {
      const [transportResult] = await db.query(
        'INSERT INTO Transport (FlightCarrier, FlightNumber) VALUES (?, ?)',
        [flight.Transport.FlightCarrier, flight.Transport.FlightNumber]
      );
      const transportId = transportResult.insertId;

      const [flightResult] = await db.query(
        'INSERT INTO Flight (transport_id, origin, destination, price) VALUES (?, ?, ?, ?)',
        [transportId, flight.Origin, flight.Destination, flight.Price]
      );
      const flightId = flightResult.insertId;

      await db.query(
        'INSERT INTO JourneyFlight (journey_id, flight_id) VALUES (?, ?)',
        [journeyId, flightId]
      );
    }

    res.json({
      Journey: {
        Origin,
        Destination,
        Price: totalPrice,
        Flights: route
      }
    });

  } catch (error) {
    console.error("Error calculating route", error.message);
    res.status(500).json({ message: 'Error calculating route', error });
  }
};

module.exports = { getFlight3 };
