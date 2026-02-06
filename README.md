# Seating Arrangement SaaS

A comprehensive multi-tenant seating arrangement management system designed for modern organizations to efficiently manage office seating, track allocations, and maintain audit trails.

## 🏗️ Architecture

### Technology Stack

**Backend**
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **File Storage**: AWS S3 for floor plan images and exports
- **Validation**: Class-validator and class-transformer

**Frontend**
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: CSS with modern practices
- **State Management**: React hooks and context

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Support for multiple organizations with complete data isolation
- **Role-based Access Control**: Granular permissions (Owner, Admin, HR, Manager, Employee, Guest)
- **Interactive Floor Maps**: Visual seat management with drag-and-drop functionality
- **Real-time Seat Assignment**: Dynamic seat allocation and reassignment
- **Audit Trail**: Complete tracking of all seat changes and administrative actions
- **Bulk Operations**: Efficient bulk seat assignments and management
- **Analytics Dashboard**: Comprehensive seating analytics and utilization reports
- **Export Functionality**: CSV exports for seat allocations and audit logs

### User Management
- User registration and authentication
- Organization-based membership management
- Permission-based feature access
- Profile management

### Seat Management
- Visual floor plan upload and management
- Interactive seat positioning and configuration
- Seat locking/unlocking capabilities
- Assignment history tracking
- Bulk seat operations

## 📋 Database Schema

The application uses a well-structured PostgreSQL database with the following key entities:

- **Organizations**: Multi-tenant container for all data
- **Users**: Global user identities with organization memberships
- **Buildings & Floors**: Physical office structure hierarchy
- **Seats**: Individual seat positions with metadata
- **Seat Assignments**: User-seat relationships with temporal tracking
- **Audit Logs**: Append-only tracking of all seat operations
- **Export Logs**: Tracking of data export operations

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- AWS S3 bucket (for file storage)
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seat-saas
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   
   **Backend (.env)**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/seat_saas"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3000
   
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="your-aws-region"
   AWS_S3_BUCKET="your-s3-bucket-name"
   ```
   
   **Frontend (.env)**
   ```env
   VITE_API_URL="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

## 🚦 Running the Application

### Development Mode

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run start:dev
   ```
   The backend will be available at `http://localhost:3000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

### Production Build

1. **Build the Backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Build the Frontend**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

## 📁 Project Structure

```
seat-saas/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── auth/              # Authentication & authorization
│   │   ├── users/             # User management
│   │   ├── organizations/     # Organization management
│   │   ├── buildings/         # Building management
│   │   ├── floors/            # Floor management
│   │   ├── seats/             # Seat management
│   │   ├── seat-assignments/  # Seat assignment logic
│   │   ├── seat-audit/        # Audit trail management
│   │   ├── analytics/         # Analytics and reporting
│   │   └── export-logs/       # Export functionality
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   └── package.json
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── api/              # API service layer
│   │   ├── utils/            # Utility functions
│   │   └── types/            # TypeScript type definitions
│   └── package.json
├── .gitignore                 # Git ignore rules
└── README.md                 # This file
```

## 🔐 Authentication & Authorization

The application implements a robust authentication and authorization system:

- **JWT-based Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions based on user roles
- **Organization Isolation**: Complete data separation between organizations
- **API Protection**: All protected endpoints require valid JWT tokens

### User Roles
- **Owner**: Full access to all organization features
- **Admin**: Administrative access with user management
- **HR**: Human resources access for seat management
- **Manager**: Department-level seat management
- **Employee**: Basic seat viewing and self-service
- **Guest**: Read-only access to floor maps

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/protected` - Protected route test

### Seat Management
- `GET /seats` - List seats
- `POST /seats` - Create seat
- `PUT /seats/:id` - Update seat
- `DELETE /seats/:id` - Delete seat

### Seat Assignments
- `GET /seat-assignments` - List assignments
- `POST /seat-assignments/assign` - Assign seat
- `POST /seat-assignments/unassign` - Unassign seat
- `POST /seat-assignments/reassign` - Reassign seat

### Analytics
- `GET /analytics/occupancy` - Occupancy statistics
- `GET /analytics/utilization` - Seat utilization reports

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:e2e           # Run end-to-end tests
```

### Frontend Testing
```bash
cd frontend
npm test                   # Run tests
npm run test:coverage     # Run tests with coverage
```

## 📦 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Run database migrations: `npx prisma migrate deploy`
4. Start the production server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your preferred hosting platform

## 🔧 Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint for code linting
- Consistent naming conventions
- Comprehensive error handling

### Git Workflow
1. Create feature branches from main
2. Write meaningful commit messages
3. Run tests before committing
4. Create pull requests for review

### Database Changes
1. Update Prisma schema
2. Generate migration: `npx prisma migrate dev`
3. Update TypeScript types: `npx prisma generate`
4. Test migration thoroughly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues for solutions

## 🗺️ Roadmap

- [ ] Mobile application development
- [ ] Advanced analytics and reporting
- [ ] Integration with calendar systems
- [ ] Real-time collaboration features
- [ ] Advanced floor plan editing tools
- [ ] Multi-language support
- [ ] Advanced notification system 
