const db = require('../db/config');
const { APIflights } = require('../api/apiService');


const getFlightRoute = async (req, res) => {
  const { origin, destination, level } = req.query;

  let connection;
  try {
    connection = await db.getConnection();
    
    const [existingJourney] = await connection.query(
      `SELECT j.*, f.origin as flightOrigin, f.destination as flightDestination, 
               f.price as flightPrice, t.FlightCarrier, t.FlightNumber
       FROM Journey j
       JOIN JourneyFlight jf ON j.id = jf.journey_id
       JOIN Flight f ON jf.flight_id = f.id
       JOIN Transport t ON f.transport_id = t.id
       WHERE j.origin = ? AND j.destination = ?`, 
      [origin, destination]
    );

    if (existingJourney.length > 0) {
      const routeDetails = existingJourney.map(journey => ({
        flightOrigin: journey.flightOrigin,
        flightDestination: journey.flightDestination,
        flightPrice: journey.flightPrice,
        transport: {
          FlightCarrier: journey.FlightCarrier,
          FlightNumber: journey.FlightNumber
        }
      }));

      return res.json({ message: 'Route already exists', route: routeDetails, CreatedAt: existingJourney[0].created_at });
    }

    const flightsData = await APIflights(level || 'basico');
    const matchingFlights = flightsData.filter(flight => 
      flight.DepartureStation === origin && flight.ArrivalStation === destination
    );

    if (matchingFlights.length === 0) {
      return res.status(404).json({ message: 'No matching route found' });
    }

    const transport = matchingFlights[0].FlightCarrier;
    const flightNumber = matchingFlights[0].FlightNumber;
    const price = matchingFlights[0].Price;

    const [transportResult] = await connection.query(
      'INSERT INTO Transport (FlightCarrier, FlightNumber) VALUES (?, ?)',
      [transport, flightNumber]
    );
    const transportId = transportResult.insertId;

    const [flightResult] = await connection.query(
      'INSERT INTO Flight (transport_id, origin, destination, price) VALUES (?, ?, ?, ?)',
      [transportId, origin, destination, price]
    );
    const flightId = flightResult.insertId;

    const [journeyResult] = await connection.query(
      'INSERT INTO Journey (origin, destination, price, created_at) VALUES (?, ?, ?, NOW())',
      [origin, destination, price]
    );
    const journeyId = journeyResult.insertId;

    await connection.query(
      'INSERT INTO JourneyFlight (journey_id, flight_id) VALUES (?, ?)',
      [journeyId, flightId]
    );

    res.json({
      message: 'Route calculated and saved',
      journey: {
        origin,
        destination,
        price,
        flightDetails: {
          FlightCarrier: transport,
          FlightNumber: flightNumber
        },
        CreatedAt: new Date().toISOString() 
      }
    });

  } catch (error) {
    console.error("Error calculating route", error.message);
    res.status(500).json({ message: 'Error calculating route', error });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = { getFlightRoute };
