# Visa Request Management System

A web application for managing visa requests and meeting registrations. This system allows users to submit visa applications for specific meetings, while administrators can manage meetings, users, and review applications.

## Features

- **User Management**
  - User registration and authentication
  - Role-based access control (Admin/User)
  - Profile management

- **Application Management**
  - Submit visa applications for specific meetings
  - Track application status
  - Upload supporting documents
  - View application history

- **Admin Features**
  - Manage meetings (create, edit, delete)
  - Review and process visa applications
  - User management with role assignment
  - View comprehensive application statistics

- **Meeting Management**
  - Create and manage upcoming meetings
  - Set meeting dates and locations
  - Control meeting visibility and status

## Technology Stack

- **Frontend**
  - React with TypeScript
  - Tailwind CSS for styling
  - React Router for navigation

- **Backend**
  - Node.js with Express
  - MongoDB with Mongoose
  - JWT for authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd visa-request-management
```

2. Install dependencies for both frontend and backend
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```bash
# Backend (.env)
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

4. Start the development servers
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in a new terminal)
cd frontend
npm run dev
```

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

