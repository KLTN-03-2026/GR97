# GR97 Health System

Welcome to the GR97 Health System project! This project is designed to provide a comprehensive health management solution with various functionalities for users, doctors, and administrators.

## Project Structure

The project is organized into several key directories:

- **backend/**: Contains the server-side code, including configuration, controllers, models, routes, services, middlewares, and utilities.
- **frontend/**: Contains the client-side code built with React, including components, pages, and styles.
- **admin/**: Contains the admin panel frontend code.
- **doctor/**: Contains the doctor panel frontend code.
- **features/**: Contains distinct functionalities, each organized into its own folder for better maintainability.

## Functionalities

The GR97 Health System includes the following functionalities:

1. **Authentication**: User login and registration.
2. **Appointments**: Scheduling and managing appointments.
3. **Chat**: Real-time chat functionality between users and doctors.
4. **Doctors**: Viewing and managing doctor profiles.
5. **Admin Dashboard**: Admin functionalities for managing users and doctors.
6. **Payments**: Handling payment processing for appointments and services.
7. **Medical Records**: Managing and viewing medical records.
8. **Video Consultation**: Enabling video consultations between users and doctors.

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd GR97-health-system
   ```

3. Install dependencies for the backend:
   ```
   cd backend
   npm install
   ```

4. Install dependencies for the frontend:
   ```
   cd ../frontend
   npm install
   ```

5. Start the backend server:
   ```
   cd ../backend
   node server.js
   ```

6. Start the frontend application:
   ```
   cd ../frontend
   npm run dev
   ```

## Documentation

For more detailed information about the architecture and design decisions, please refer to the [architecture documentation](docs/architecture.md).

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.