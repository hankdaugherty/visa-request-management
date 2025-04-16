# Visa Request Management System

A web application for managing visa requests and applications.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Environment Variables
Create a `.env` file in the backend directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd visa-request-management
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev  # for development
# or
npm start    # for production
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

### Deployment

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Set up your production environment variables
3. Deploy the backend to your chosen hosting platform
4. Deploy the frontend build to your static hosting service

## Features
- User authentication and authorization
- Application submission and management
- Admin dashboard for application review
- CSV import functionality
- Meeting management
- Document upload and management

## Technology Stack

- **Frontend**
  - React with TypeScript
  - Tailwind CSS for styling
  - React Router for navigation

- **Backend**
  - Node.js with Express
  - MongoDB with Mongoose
  - JWT for authentication

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Applications
- `GET /api/applications` - Get user's applications
- `POST /api/applications` - Create new application
- `GET /api/applications/:id` - Get specific application
- `PUT /api/applications/:id` - Update application

### Meetings
- `GET /api/meetings` - Get all meetings
- `POST /api/meetings` - Create new meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Admin Routes
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and Node.js
- Styled with Tailwind CSS
- Database powered by MongoDB

