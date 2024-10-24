create DATABASE bintelli

use bintelli 

CREATE TABLE Transport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    FlightCarrier VARCHAR(255) NOT NULL,
    FlightNumber VARCHAR(255) NOT NULL
);

CREATE TABLE Flight (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transport_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    price DOUBLE NOT NULL,
    FOREIGN KEY (transport_id) REFERENCES Transport(id)
);

CREATE TABLE Journey (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    price DOUBLE NOT NULL

);

CREATE TABLE JourneyFlight (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journey_id INT NOT NULL,
    flight_id INT NOT NULL,
    FOREIGN KEY (journey_id) REFERENCES Journey(id),
    FOREIGN KEY (flight_id) REFERENCES Flight(id)
);

CREATE INDEX idx_journey_origin_destination ON Journey (origin, destination);
CREATE INDEX idx_flight_origin_destination ON Flight (origin, destination);
ALTER TABLE Journey 
ADD created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
