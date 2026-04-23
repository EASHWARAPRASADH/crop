# Dependencies & Requirements Document

## System Requirements

### Minimum Requirements
- **OS**: macOS 10.15+ / Windows 10+ / Linux (Ubuntu 20.04+)
- **RAM**: 8 GB (16 GB recommended for large batch processing)
- **Storage**: 2 GB free space
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## Core Dependencies

### Runtime Dependencies (Production)

| Package | Version | Purpose |
|---------|---------|---------|
| **react** | ^18.3.1 | UI framework |
| **react-dom** | ^18.3.1 | React DOM renderer |
| **react-router-dom** | ^6.30.1 | Client-side routing |
| **@tanstack/react-query** | ^5.83.0 | Data fetching & caching |
| **zustand** | ^5.0.11 | State management |

### Backend & Database

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^5.2.1 | Node.js web framework |
| **mongodb** | ^7.1.1 | MongoDB driver |
| **multer** | ^2.1.1 | File upload handling |
| **cors** | ^2.8.6 | Cross-origin requests |
| **dotenv** | ^17.3.1 | Environment variables |

### UI Components & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| **@radix-ui/react-* (30+ packages)** | various | Accessible UI primitives |
| **tailwindcss** | ^3.4.17 | Utility-first CSS |
| **tailwind-merge** | ^2.6.0 | Tailwind class merging |
| **tailwindcss-animate** | ^1.0.7 | Animation utilities |
| **class-variance-authority** | ^0.7.1 | Component variants |
| **clsx** | ^2.1.1 | Conditional classes |
| **lucide-react** | ^0.462.0 | Icon library |
| **framer-motion** | ^12.35.2 | Animations |
| **next-themes** | ^0.3.0 | Theme management |

### File Processing & Documents

| Package | Version | Purpose |
|---------|---------|---------|
| **xlsx** | ^0.18.5 | Excel file reading/writing |
| **papaparse** | ^5.5.3 | CSV parsing |
| **mammoth** | ^1.11.0 | Word document processing |
| **pdfjs-dist** | ^5.5.207 | PDF processing |
| **jspdf** | ^3.0.3 | PDF generation |
| **pdf-lib** | ^1.17.1 | PDF manipulation |
| **html2canvas** | ^1.4.1 | HTML to canvas/image |
| **file-saver** | ^2.0.5 | File download handling |
| **jszip** | ^3.10.1 | ZIP file creation |

### Image & Canvas Processing

| Package | Version | Purpose |
|---------|---------|---------|
| **@imgly/background-removal** | ^1.7.0 | AI background removal |
| **konva** | 9.3.18 | Canvas library |
| **react-konva** | 18.2.10 | React Konva bindings |
| **fabric** | ^6.7.1 | Canvas library (alternative) |
| **ag-psd** | ^28.4.1 | Photoshop file handling |
| **psd** | ^3.4.0 | PSD file parsing |
| **psd.js** | ^3.9.2 | PSD manipulation |

### AI & QR Code

| Package | Version | Purpose |
|---------|---------|---------|
| **qrcode** | ^1.5.4 | QR code generation |
| **jsbarcode** | ^3.12.3 | Barcode generation |

### Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| **react-hook-form** | ^7.61.1 | Form management |
| **@hookform/resolvers** | ^3.10.0 | Form validation |
| **zod** | ^3.25.76 | Schema validation |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| **axios** | ^1.13.6 | HTTP client |
| **date-fns** | ^3.6.0 | Date formatting |
| **uuid** | ^13.0.0 | UUID generation |
| **sonner** | ^1.7.4 | Toast notifications |
| **cmdk** | ^1.1.1 | Command palette |
| **embla-carousel-react** | ^8.6.0 | Carousel/slider |
| **recharts** | ^2.15.4 | Charts & graphs |
| **vaul** | ^0.9.9 | Drawer component |
| **input-otp** | ^1.4.2 | OTP input |
| **react-day-picker** | ^8.10.1 | Date picker |
| **react-resizable-panels** | ^2.1.9 | Resizable panels |

---

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **vite** | ^5.4.19 | Build tool & dev server |
| **@vitejs/plugin-react-swc** | ^3.11.0 | SWC-based React plugin |
| **typescript** | ^5.8.3 | TypeScript compiler |
| **@types/* (multiple)** | various | Type definitions |
| **eslint** | ^9.32.0 | Linting |
| **eslint-plugin-react-hooks** | ^5.2.0 | React hooks linting |
| **eslint-plugin-react-refresh** | ^0.4.20 | Fast refresh linting |
| **typescript-eslint** | ^8.38.0 | TypeScript ESLint |
| **postcss** | ^8.5.6 | CSS processing |
| **autoprefixer** | ^10.4.21 | CSS autoprefixing |
| **@tailwindcss/typography** | ^0.5.16 | Typography plugin |
| **concurrently** | ^9.2.1 | Run multiple commands |
| **lovable-tagger** | ^1.1.10 | Lovable integration |
| **globals** | ^15.15.0 | Global types |
| **@eslint/js** | ^9.32.0 | ESLint config |

---

## External Services (Optional)

| Service | Purpose | Required |
|---------|---------|----------|
| **MongoDB** | Database | Yes (local or Atlas) |
| **Cloud Storage** | File hosting | Optional |

---

## Installation Commands

```bash
# Install all dependencies
npm install

# Install specific package
npm install <package-name>

# Install dev dependency
npm install -D <package-name>
```

---

## Environment Setup

Create `.env.local` file:

```env
# API Keys (Optional)
VITE_GEMINI_API_KEY="your-gemini-key"

# Backend URL
VITE_API_URL="/api"
```

---

## Package.json Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 8080) |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run server` | Start Node.js backend (port 5001) |
| `npm run start:all` | Start frontend + backend together |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Common Installation Issues

### macOS
```bash
# If node_modules permission issues
sudo chown -R $(whoami) ~/.npm
```

### Windows
```powershell
# If PowerShell execution policy blocks scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node Version Issues
```bash
# Check Node version
node -v  # Should be v18+

# Use nvm to switch versions
nvm use 18
```

---

## Total Bundle Size

- **Dependencies**: ~95 packages
- **Dev Dependencies**: ~20 packages
- **Estimated node_modules size**: ~500 MB
