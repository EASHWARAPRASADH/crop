# UniCard Solutions - ID Card Management System

## Overview

Professional ID card creation and management platform for schools and organizations with AI-powered photo processing and validation capabilities.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + MongoDB
- **AI Processing:** Local in-browser image processing with @imgly/background-removal

## How to Run

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (running locally or via connection string)

### Installation

```bash
# Clone the repository
git clone https://github.com/EASHWARAPRASADH/aircrop.git
cd aircrop

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Setup Environment Variables

Create `.env.local` in the root directory:

```env
VITE_API_URL="http://localhost:5000/api"
```

Create `.env` in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/unicard
JWT_SECRET=your-secret-key-here
```

### Start the Application

**Option 1: Run both servers separately**

```bash
# Terminal 1 - Start backend API
cd server
npm start

# Terminal 2 - Start frontend dev server
npm run dev
```

**Option 2: Run with npm scripts**

```bash
# Start backend
npm run server

# Start frontend (in another terminal)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Build for Production

```bash
# Build frontend
npm run build

# Start production server
npm run preview
```

## How to Work with the System

### 1. User Roles

The system has three main user roles:
- **Admin:** Full access to all features, school management, and system settings
- **School:** Can create projects, manage students, and generate ID cards
- **Viewer:** Read-only access to view generated ID cards

### 2. Validation Hub Workflow

The Validation Hub is the central hub for importing data and processing photos. Follow this workflow:

#### Step 1: Dataset Import (Tab 1)

1. Navigate to Validation Hub from the dashboard
2. Click **1. Dataset Import** tab
3. **Upload Excel/CSV:**
   - Click the upload area or drag-drop your Excel file
   - Supported formats: .xlsx, .xls, .csv
   - Required columns: `student_name`, `class`
   - Optional columns: `father_name`, `roll_number`, `student_id`, `date_of_birth`, `address`, `gender`, `phone_number`, `blood_group`
4. **Review Mapped Data:**
   - The system auto-maps columns
   - Review the mapping in the table
   - Click column headers to change mapping if needed
5. **Upload ZIP of Processed Photos:**
   - After importing student data, upload a ZIP file containing processed photos
   - Photos should be named to match student IDs, roll numbers, or names
   - Supported formats: .jpg, .jpeg, .png, .webp
6. **Run Process & Match:**
   - Click the "Run Process & Match" button
   - This uploads student data to the database
   - Photos are automatically matched to students by filename

#### Step 2: AI Photo Processing (Tab 2)

1. Navigate to **2. AI Photo Processing** tab
2. **Upload Photos:**
   - Click upload area or drag-drop photos
   - Select multiple photos at once
3. **Process Photos:**
   - Select photo size preset (Passport, Visa, ID Card, or Custom)
   - Click "Process All" to process all photos
   - Processing includes:
     - Smart face detection and cropping
     - Background removal (automatic at the end)
     - Image enhancements (brightness, contrast, etc.)
4. **Manual Matching:**
   - After processing, photos are automatically matched to students by filename
   - Use the "Manual Match" dropdown to manually link photos to students if needed
5. **Download Processed Photos:**
   - Click "Download ZIP" to get all processed photos
   - Upload this ZIP in the Dataset Import tab for final matching

### 3. ID Card Customization

1. Go to **Projects** from the dashboard
2. Click on a project to open the customizer
3. **Setup Mode:**
   - Choose card dimensions
   - Select background template
   - Add school logo
4. **Design Mode:**
   - Add text fields (name, class, roll number, etc.)
   - Position elements by dragging
   - Customize fonts and colors
5. **Export Mode:**
   - Preview generated ID cards
   - Export as PDF or individual images

### 4. Data Persistence

- Data in the **Dataset Import** tab persists when switching between tabs
- You can switch to AI Photo Processing and back without losing your imported data
- Processed photos in AI Photo Processing tab also persist

## Important Notes

### Student Data Loading

- The AI Photo Processing tab requires students to exist in the database
- Always import student data via Dataset Import first
- Click "Run Process & Match" to upload students to the database
- Then students will appear in PhotoProcessor for manual matching

### Photo Processing

- Photo processing happens entirely in the browser (no server needed)
- Background removal uses @imgly/background-removal library
- Processing time depends on image size and browser performance
- Processed photos can be downloaded as ZIP

### Database

- MongoDB is used to store:
  - Users and authentication data
  - Projects and orders
  - Student records
  - Generated ID card configurations

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components (Sidebar, Header)
│   ├── validation/      # Validation Hub components
│   │   ├── DataMapper.tsx    # Dataset Import
│   │   └── PhotoProcessor.tsx # AI Photo Processing
│   ├── customizer/     # ID Card Customizer components
│   └── ...
├── pages/              # Route pages
│   ├── AdminDashboard.tsx
│   ├── SchoolDashboard.tsx
│   ├── Validation.tsx  # Validation Hub
│   ├── Customizer.tsx  # ID Card Customizer
│   ├── Projects.tsx
│   └── ...
├── services/           # API services
│   ├── authService.ts
│   ├── dataService.ts
│   ├── aiImageProcessor.ts
│   └── faceDetectionService.ts
├── hooks/              # React hooks
├── store/              # Zustand stores
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## Available Scripts

- `npm run dev` - Start Vite dev server (frontend)
- `npm run server` - Start Node.js backend API
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm start` - Start backend API (in server directory)

## Troubleshooting

### Students not showing in PhotoProcessor
- Ensure student data has been imported via Dataset Import
- Click "Run Process & Match" to upload to database
- Check browser console for errors

### Data lost when switching tabs
- This should not happen - data persistence is implemented
- If it happens, check browser console for errors
- Refresh the page to reload data from database

### Background removal not working
- Ensure you have a stable internet connection (models load from CDN)
- Check browser console for model loading errors
- Try processing one image at a time

## License

MIT
# id_cropping_tool
