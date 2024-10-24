const db = require('../db/config');
const { APIflights } = require('../api/apiService');

const getFlight3 = async (req, res) => {
  const { Origin, Destination, maxFlights } = req.body;
  const maxConnections = maxFlights || 3;

  try {
    const [existingJourney] = await db.query(
      'SELECT * FROM Journey WHERE origin = ? AND destination = ?',
      [Origin, Destination]
    );

    if (existingJourney.length > 0) {
      const journeyId = existingJourney[0].id;
      const [flights] = await db.query(
        `SELECT f.origin, f.destination, f.price, t.FlightCarrier, t.FlightNumber 
         FROM Flight f
         JOIN Transport t ON f.transport_id = t.id
         JOIN JourneyFlight jf ON jf.flight_id = f.id
         WHERE jf.journey_id = ?`,
        [journeyId]
      );

      const route = flights.map(flight => ({
        Origin: flight.origin,
        Destination: flight.destination,
        Price: flight.price,
        Transport: {
          FlightCarrier: flight.FlightCarrier,
          FlightNumber: flight.FlightNumber
        }
      }));

      return res.json({
        message: 'Ruta recuperada de la base de datos.',
        Journey: {
          Origin,
          Destination,
          Price: existingJourney[0].price,
          Flights: route,
          CreatedAt: existingJourney[0].created_at
        }
      });
    }


    const flightsData = await APIflights('basico');
    if (!Array.isArray(flightsData) || flightsData.length === 0) {
      return res.status(500).json({ message: 'Unexpected API response format or empty flights data' });
    }

    const route = [];
    let currentOrigin = Origin;
    let totalPrice = 0;

    for (let i = 0; i < maxConnections; i++) {
      const nextFlight = flightsData.find(flight => 
        flight.DepartureStation === currentOrigin && flight.ArrivalStation !== Destination
      );

      if (!nextFlight) {
        const directFlight = flightsData.find(flight => 
          flight.DepartureStation === currentOrigin && flight.ArrivalStation === Destination
        );
        
        if (directFlight) {
          route.push({
            Origin: directFlight.DepartureStation,
            Destination: directFlight.ArrivalStation,
            Price: directFlight.Price,
            Transport: {
              FlightCarrier: directFlight.FlightCarrier,
              FlightNumber: directFlight.FlightNumber
            }
          });
          totalPrice += directFlight.Price;
          break; 
        } else {
          return res.status(404).json({ message: `No flight found from ${currentOrigin}` });
        }
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

      currentOrigin = nextFlight.ArrivalStation; 

      if (currentOrigin === Destination) {
        break; 
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
      message: 'Ruta creada y guardada en la base de datos.',
      Journey: {
        Origin,
        Destination,
        Price: totalPrice,
        Flights: route,
        CreatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error calculating or retrieving route", error.message);
    res.status(500).json({ message: 'Error calculating or retrieving route', error });
  }
};

module.exports = { getFlight3 };
