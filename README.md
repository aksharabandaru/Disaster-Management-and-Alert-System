# Disaster-Management-and-Alert-System

A comprehensive disaster management and alert system built with React and Spring Boot.

## Features

- Real-time disaster monitoring with GDACS API integration
- Multi-role dashboard (Admin, Responder, Citizen)
- Emergency request reporting and routing
- Task assignment and progress tracking
- Analytics and reporting dashboard
- Location-based alert filtering

## Technology Stack

### Frontend
- React 18
- React Router
- Axios
- CSS3 with modern design system

### Backend
- Spring Boot
- Spring Security
- JWT Authentication
- JPA/Hibernate
- Maven

## Installation

### Prerequisites
- Node.js 16+
- Java 11+
- Maven 3.6+

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

## Usage

1. Register as a user with appropriate role (Admin, Responder, Citizen)
2. Login to access role-specific dashboard
3. Admin: Manage alerts, assign tasks, view analytics
4. Responder: View assigned tasks, respond to emergencies
5. Citizen: Report emergencies, view official broadcasts

## Project Structure

```
dmas/
├── frontend/          # React frontend
├── backend/           # Spring Boot backend
├── CREATE_DATABASE.sql # Database setup
└── README.md         # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
