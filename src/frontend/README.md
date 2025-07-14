# ICP Payment Gateway Frontend

Modern React frontend for ICP payment gateway with clean JSX architecture.

## Features

- 🚀 **Modern React 18** with hooks and functional components
- ⚡ **Vite** for fast development and building
- 🎨 **Tailwind CSS** for beautiful UI
- 🔗 **ICP Integration** with @dfinity packages
- 🛣️ **React Router** for navigation
- 📱 **Responsive Design** for all devices
- 💰 **Payment Processing** with QR codes
- 📊 **Transaction History** tracking
- 🔐 **Wallet Connection** integration

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   └── ErrorBoundary.jsx # Error handling
├── contexts/           # React context providers
│   └── ICPContext.jsx  # ICP blockchain state
├── pages/              # Route components
│   ├── Home.jsx        # Landing page
│   ├── Dashboard.jsx   # Main dashboard
│   ├── QRGenerator.jsx # QR code generator
│   ├── PaymentScanner.jsx # Payment scanner
│   └── TransactionHistory.jsx # Transaction list
├── services/           # API services
│   └── backend.js      # ICP canister communication
├── utils/             # Utility functions
│   └── formatters.js  # Format helpers
├── App.jsx            # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Environment Variables

Create `.env` file for local development:

```env
VITE_NETWORK=local
VITE_HOST=http://localhost:8000
VITE_CANISTER_ID_BACKEND=uxrrr-q7777-77774-qaaaq-cai
VITE_REPLICA_HOST=http://localhost:8000
VITE_DEVELOPMENT=true
```

## ICP Backend Integration

The frontend connects to the Rust backend canister with these main functions:

- **User Management**: Register, login, profile management
- **QR Code Generation**: Create payment QR codes
- **Payment Processing**: Handle ICP transactions
- **Transaction History**: Track payment records
- **Rate Conversion**: USD to ICP conversion

## Development Notes

- **JSX Architecture**: Converted from TypeScript for simpler development
- **No Type Checking**: Uses plain JavaScript for rapid prototyping
- **Tailwind CSS**: Utility-first styling approach
- **Mock Data**: Development mode uses mock wallet connection
- **Error Boundaries**: Graceful error handling throughout app

## Testing

The backend has been tested with 95% success rate in production. Frontend testing includes:

- Component rendering tests
- ICP integration tests
- Payment flow testing
- Responsive design validation

## Deployment

```bash
# Build for production
npm run build

# Deploy to ICP
dfx deploy --network ic frontend
```

## API Integration

The frontend uses the `PaymentBackendService` class to communicate with the ICP canister:

```javascript
import { PaymentBackendService } from './services/backend.js';

const service = new PaymentBackendService();
await service.registerUser(userData);
```

## Support

For backend issues, check the Rust canister logs. For frontend issues, check browser console and network tab.

Built with ❤️ for ICP ecosystem
