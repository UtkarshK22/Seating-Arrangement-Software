# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this repository.

## Project Overview

This is a full-stack SaaS seating arrangement application with:
- **Frontend**: React 19 + TypeScript + Vite (port 5173)
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL (port 3000)
- **Architecture**: Multi-tenant SaaS with role-based access control

## Development Commands

### Frontend (React/Vite)
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (NestJS)
```bash
cd backend
npm run start        # Start production server
npm run start:dev    # Start development server with watch mode
npm run build        # Build the application
npm test             # Run all tests
npm test:watch       # Run tests in watch mode
npm test:e2e         # Run end-to-end tests
```

### Running Single Tests
```bash
# Backend - specific test file
cd backend
npm test -- seat-assignments.service.spec.ts

# Backend - specific test name
npm test -- --testNamePattern="should assign seat"
```

## Code Style Guidelines

### TypeScript Configuration
- **Frontend**: Strict mode enabled, ES2022 target, React JSX
- **Backend**: CommonJS modules, experimental decorators enabled
- Always use explicit return types for public methods
- Prefer interfaces over types for object shapes

### Import Patterns

#### Frontend
```typescript
// React imports first
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Then third-party libraries
import axios from "axios";

// Then local imports (absolute if possible, relative otherwise)
import { api } from "./api/http";
import { Floor } from "./types";
```

#### Backend
```typescript
// NestJS imports first
import { Injectable, BadRequestException } from '@nestjs/common';
import { Controller, Get, Post, Body } from '@nestjs/common';

// Then third-party libraries
import { Prisma } from '@prisma/client';

// Then local imports
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeatAssignmentDto } from './dto/create-seat-assignment.dto';
```

### Naming Conventions

#### Files
- **Components**: kebab-case (seat-map.tsx)
- **Services**: kebab-case with suffix (seat-assignments.service.ts)
- **DTOs**: kebab-case with action suffix (create-building.dto.ts)
- **Types**: PascalCase (FloorMap.ts)

#### Code
- **Variables**: camelCase with descriptive names
- **Classes**: PascalCase
- **Methods**: camelCase with verb prefixes (assignSeat, unassignSeat, getBuilding)
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with 'I' prefix optional (IUserRepository)

### Error Handling Patterns

#### Frontend
```typescript
// Always type-check errors
try {
  const data = await api<FloorMapResponse>(`/floors/${FLOOR_ID}/map`);
  setFloor(data.floor);
} catch (err) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError("Failed to load floor map");
  }
}
```

#### Backend
```typescript
// Use NestJS built-in exceptions
if (existingUserAssignment) {
  throw new BadRequestException('User already has an active seat');
}

// For unexpected errors
catch (error) {
  throw new InternalServerErrorException('Failed to assign seat');
}
```

### Database Patterns

#### Prisma Usage
- Always use transactions for multi-step operations
- Use soft delete patterns where appropriate
- Include proper error handling for database constraints
```typescript
async assignSeat(userId: string, seatId: string) {
  return this.prisma.$transaction(async (tx) => {
    // Validate and assign atomically
  });
}
```

### Testing Guidelines

#### Backend Testing
- Use NestJS testing module
- Mock external dependencies (PrismaService)
- Test both success and error cases
- Include integration tests for database operations

```typescript
describe('SeatAssignmentsService', () => {
  let service: SeatAssignmentsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SeatAssignmentsService, PrismaService],
    }).compile();
    
    service = module.get<SeatAssignmentsService>(SeatAssignmentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });
});
```

### Security Guidelines

- Always validate input with class-validator
- Use JWT authentication with proper guards
- Implement role-based access control
- Never expose sensitive data in responses
- Use bcrypt for password hashing

### API Design Patterns

#### RESTful Conventions
- GET /resources - List resources
- GET /resources/:id - Get specific resource
- POST /resources - Create resource
- PUT /resources/:id - Update resource
- DELETE /resources/:id - Delete resource

#### Response Format
```typescript
// Success responses
{
  data: T,
  message?: string
}

// Error responses (handled by NestJS)
{
  statusCode: number,
  message: string,
  error: string
}
```

### Frontend Component Patterns

#### Custom Hooks
```typescript
const useFloorMap = (floorId: string) => {
  const [floor, setFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch logic
  }, [floorId]);

  return { floor, loading, error };
};
```

#### State Management
- Use useState for simple local state
- Use useEffect for side effects
- Prefer custom hooks for complex state logic
- Avoid prop drilling by lifting state up

### Code Organization

#### Backend Structure
```
src/
├── modules/
│   ├── seat-assignments/
│   │   ├── seat-assignments.service.ts
│   │   ├── seat-assignments.controller.ts
│   │   ├── dto/
│   │   └── seat-assignments.module.ts
├── common/
├── prisma/
└── app.module.ts
```

#### Frontend Structure
```
src/
├── components/
├── pages/
├── hooks/
├── types/
├── api/
└── utils/
```

### Development Workflow

1. Always run linting before committing
2. Run tests after making changes
3. Use TypeScript strict mode
4. Follow the existing code patterns
5. Write meaningful commit messages

### Environment Variables

#### Backend (.env)
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
PORT=3000
```

#### Frontend (.env)
```
VITE_API_URL="http://localhost:3000"
```

## Common Pitfalls to Avoid

- Don't forget to handle async errors properly
- Don't use any type without justification
- Don't commit environment variables
- Don't ignore TypeScript errors
- Don't forget to test error cases
- Don't use console.log in production code
- Don't make database calls in controllers (use services)

## Technology-Specific Notes

### NestJS
- Use dependency injection properly
- Create modules for feature organization
- Use guards for authentication/authorization
- Leverage pipes for validation

### React
- Use functional components with hooks
- Prefer useEffect over componentDidMount
- Use proper dependency arrays
- Handle cleanup in useEffect

### Prisma
- Always use transactions for multi-step operations
- Use proper error handling for unique constraints
- Include relations when needed
- Use proper types from @prisma/client

This file should be updated as the codebase evolves and new patterns emerge.