# Asher Admin Dashboard - Integration Guide

## Overview

This guide documents the integration of the `asher-admin` dashboard with the `AsherLandlordFE` (Rent Management System) backend. The admin dashboard can now:

1. ✅ **Create users** for AsherLandlordFE that can login
2. ✅ **Receive tickets** raised from FE
3. ✅ **Receive emails** sent from FE
4. ✅ **Upload files** to FE document library

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  asher-admin    │ ──────> │  AsherLandlordBE │ <────── │ AsherLandlordFE │
│  (Admin Panel)  │  API    │   (Backend API)  │  API    │  (Frontend App)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

---

## 📁 File Structure

```
asher-admin/
├── config/
│   └── api.ts                    # API configuration and request wrapper
├── services/
│   ├── authService.ts           # Authentication (login, create user)
│   ├── ticketService.ts         # Ticket management
│   ├── emailService.ts          # Email management
│   ├── fileService.ts           # File uploads
│   ├── userService.ts           # User management
│   └── index.ts                 # Service exports
├── pages/
│   └── Login.tsx                # Admin login page
└── components/
    ├── UserManagement.tsx       # User management (needs API integration)
    ├── TicketSystem.tsx         # Ticket system (needs API integration)
    ├── EmailSystem.tsx          # Email system (needs API integration)
    └── FileLibrary.tsx          # File library (needs API integration)
```

---

## 🔐 Authentication

### Admin Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@nexusprop.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

**Usage:**
```typescript
import { login } from './services/authService';

const response = await login({ email, password });
if (response.success) {
  // Token stored in localStorage
  // Redirect to dashboard
}
```

### Token Management

- Token stored in `localStorage` as `admin_token`
- Automatically included in all API requests via `Authorization: Bearer <token>`
- Use `isAuthenticated()` to check auth status
- Use `logout()` to clear token

---

## 👥 User Management

### Create User for AsherLandlordFE

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "LANDLORD",  // or "TENANT", "VENDOR", "WEBUSER"
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "isVerified": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "role": ["LANDLORD"],
    ...
  },
  "message": "User registered successfully, check your email for verification code"
}
```

**Usage:**
```typescript
import { createUserForFE } from './services/userService';

const newUser = await createUserForFE({
  email: 'user@example.com',
  password: 'password123',
  role: 'LANDLORD',
  firstName: 'John',
  lastName: 'Doe'
});
```

**Note:** Created users can immediately login to AsherLandlordFE using the same credentials.

---

## 🎫 Ticket System

### Get All Tickets (from FE)

**Endpoint:** `GET /api/landlord/supports/all-tickets?page=1&limit=50&search=`

**Response:**
```json
{
  "data": [
    {
      "id": "ticket_id",
      "subject": "Login Issue",
      "description": "Cannot login to the system",
      "type": "SUPPORT",
      "priority": "HIGH",
      "status": "OPEN",
      "raisedById": "landlord_id",
      "raisedByTenantId": null,
      "attachments": [],
      "createdAt": "2024-01-01T00:00:00Z",
      "raisedBy": { ... }
    }
  ],
  "total": 100
}
```

**Usage:**
```typescript
import { getAllTickets } from './services/ticketService';

const { data: tickets, total } = await getAllTickets(1, 50, '');
```

### Update Ticket Status

**Endpoint:** `PATCH /api/landlord/supports/status/:ticketId`

**Request:**
```json
{
  "status": "RESOLVED"  // or "OPEN", "IN_PROGRESS", "CLOSED"
}
```

**Usage:**
```typescript
import { updateTicketStatus } from './services/ticketService';

await updateTicketStatus(ticketId, 'RESOLVED');
```

---

## 📧 Email System

### Get Inbox (Emails from FE)

**Endpoint:** `GET /api/emails?page=1&limit=50&search=`

**Response:**
```json
{
  "data": [
    {
      "id": "email_id",
      "subject": "Property Inquiry",
      "body": "I'm interested in...",
      "senderEmail": "tenant@example.com",
      "receiverEmail": "admin@nexusprop.com",
      "attachment": [],
      "isReadByReceiver": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "sender": { ... }
    }
  ],
  "total": 50
}
```

**Usage:**
```typescript
import { getInbox } from './services/emailService';

const { data: emails, total } = await getInbox(1, 50, '');
```

### Send Email

**Endpoint:** `POST /api/emails` (with FormData for attachments)

**Request:**
```json
{
  "subject": "Response to Inquiry",
  "body": "Thank you for your inquiry...",
  "receiverEmail": "tenant@example.com",
  "attachment": ["url1", "url2"],
  "isDraft": false
}
```

**Usage:**
```typescript
import { createEmail } from './services/emailService';

await createEmail({
  subject: 'Response',
  body: 'Thank you...',
  receiverEmail: 'tenant@example.com'
}, [file1, file2]); // Optional files
```

---

## 📁 File Management

### Upload File to Document Library

**Endpoint:** `POST /api/landlord/documents` (FormData)

**Request (FormData):**
```
files: [File]
documentName: "Document Name"
docType: "TEMPLATE" (optional)
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "doc_id",
      "documentName": "Document Name",
      "documentUrl": ["https://cloudinary.com/..."],
      "type": "application/pdf",
      "size": "1024",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Usage:**
```typescript
import { uploadDocument } from './services/fileService';

const document = await uploadDocument(
  file,
  'Template Document',
  'TEMPLATE'
);
```

### Get All Documents

**Endpoint:** `GET /api/landlord/documents/docs`

**Usage:**
```typescript
import { getDocuments } from './services/fileService';

const documents = await getDocuments();
```

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` in `asher-admin/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### API Base URL

The API base URL is configured in `config/api.ts` and defaults to `http://localhost:5000/api` if not set.

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd asher-admin
npm install
```

### 2. Configure Environment

Create `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Login

- Navigate to login page
- Use admin credentials (must have ADMIN role in backend)
- Token will be stored automatically

---

## 📝 Component Integration

### Update UserManagement Component

Replace mock data with API calls:

```typescript
import { useEffect, useState } from 'react';
import { getAllUsers, createUserForFE } from '../services/userService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      const newUser = await createUserForFE(userData);
      setUsers([newUser, ...users]);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // ... rest of component
};
```

### Update TicketSystem Component

Replace mock data with API calls:

```typescript
import { useEffect, useState } from 'react';
import { getAllTickets, updateTicketStatus } from '../services/ticketService';

const TicketSystem: React.FC = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const { data } = await getAllTickets(1, 50, '');
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await updateTicketStatus(ticketId, status);
      await loadTickets(); // Refresh
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  // ... rest of component
};
```

---

## ✅ Integration Checklist

- [x] API service layer created
- [x] Authentication service implemented
- [x] User creation service implemented
- [x] Ticket service implemented
- [x] Email service implemented
- [x] File service implemented
- [ ] Login page created
- [ ] UserManagement component updated
- [ ] TicketSystem component updated
- [ ] EmailSystem component updated
- [ ] FileLibrary component updated
- [ ] Admin role endpoint created in backend
- [ ] CORS configured for admin domain

---

## 🔒 Security Notes

1. **Admin Role Required**: Admin users must have `ADMIN` role in backend
2. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
3. **CORS**: Backend must allow requests from admin domain
4. **Rate Limiting**: Backend has rate limiting on auth endpoints

---

## 🐛 Troubleshooting

### "Unauthorized" Errors

- Check if token is stored: `localStorage.getItem('admin_token')`
- Verify token is sent in headers
- Check if user has ADMIN role

### CORS Errors

- Add admin domain to backend CORS whitelist
- Check `cors()` configuration in `AsherLandlordBE/src/index.ts`

### API Connection Errors

- Verify `VITE_API_BASE_URL` is correct
- Check if backend server is running
- Verify network connectivity

---

## 📚 Next Steps

1. **Create Admin Role Endpoint**: Add endpoint to create admin users
2. **Update Components**: Replace all mock data with API calls
3. **Add Error Handling**: Implement proper error handling and user feedback
4. **Add Loading States**: Show loading indicators during API calls
5. **Add Real-time Updates**: Use WebSockets for real-time ticket/email updates
6. **Add Pagination**: Implement pagination for large datasets
7. **Add Search/Filter**: Enhance search and filter functionality

---

## 📞 Support

For issues or questions:
1. Check backend API documentation
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Verify authentication token is valid

---

**Integration Status: ✅ Services Created - Components Need API Integration**

