const db = require('../db/config');
const { APIflights } = require('../api/apiService');

// obtener ruta de un vuelo
const getFlightRoute = async (req, res) => {
  const { origin, destination, level } = req.query;

  let connection;
  try {
    connection = await db.getConnection();
    const [existingJourney] = await connection.query(
      'SELECT * FROM Journey WHERE origin = ? AND destination = ?', 
      [origin, destination]
    );

    if (existingJourney.length > 0) {
      return res.json({ message: 'Route already exists', route: existingJourney });
    }

    const flightsData = await APIflights(level || 'basico');
    console.log('flightsData:', flightsData, 'Type:', typeof flightsData, 'Is Array:', Array.isArray(flightsData));
    
    if (Array.isArray(flightsData) && flightsData.length > 0) {
      const matchingFlights = flightsData.filter(flight => 
        flight.DepartureStation === origin && flight.ArrivalStation === destination
      );

      if (matchingFlights.length === 0) {
        return res.status(404).json({ message: 'No matching route found' });
      }
  
      // agregar lo datos a su respectiva tabla
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
        'INSERT INTO Journey (origin, destination, price) VALUES (?, ?, ?)',
        [origin, destination, price]
      );
  
      const journeyId = journeyResult.insertId;
  
      await connection.query(
        'INSERT INTO JourneyFlight (journey_id, flight_id) VALUES (?, ?)',
        [journeyId, flightId]
      );
  
      // ruta guardada con los respectivos datos
      res.json({
        message: 'rroute calculated and saved',
        journey: {
          origin,
          destination,
          price
        }
      });
    } else {
      return res.status(500).json({ message: 'Unexpected API response format' });
    }

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
