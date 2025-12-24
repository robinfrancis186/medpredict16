# MedPredict - AI-Powered Medical Diagnostics Platform

<div align="center">
  
  ![MedPredict](https://img.shields.io/badge/MedPredict-Healthcare%20AI-0066cc?style=for-the-badge)
  ![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6?style=for-the-badge&logo=typescript)
  ![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase)

  **A comprehensive healthcare management system with AI-powered medical image analysis and patient monitoring**
  
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [User Roles & Access](#-user-roles--access)
- [Features by Role](#-features-by-role)
- [Development](#-development)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**MedPredict** is a modern, AI-powered medical diagnostics and patient management platform designed to streamline healthcare workflows. The application provides healthcare professionals with advanced tools for medical image analysis, patient monitoring, and comprehensive health records management.

### What Makes MedPredict Special?

- **AI-Powered Diagnostics**: Advanced machine learning models for analyzing medical images (X-rays, CT scans, MRI, ECG, Ultrasound)
- **Real-time Monitoring**: Track patient vitals and receive instant risk assessments
- **Multi-Role Support**: Tailored experiences for doctors, nurses, and patients
- **Comprehensive Records**: Centralized medical records management system
- **Risk Assessment**: Intelligent risk scoring based on multiple health factors
- **Report Generation**: Automated PDF report generation for analysis results

---

## ✨ Key Features

### 🏥 For Healthcare Professionals

- **Dashboard Analytics**: Real-time overview of patients, scans, and high-risk cases
- **Patient Management**: Complete patient profiles with medical history, allergies, and chronic conditions
- **Medical Image Analysis**: 
  - Chest X-Ray (Pneumonia & lung analysis)
  - CT Scan (Tissue & organ imaging)
  - MRI Scan (Detailed soft tissue)
  - ECG Analysis (Heart rhythm monitoring)
  - Ultrasound (Real-time imaging)
- **Vitals Monitoring**: Track SpO2, temperature, heart rate, respiratory rate, and blood pressure
- **Lab Results Management**: Store and manage laboratory test results
- **Appointment Scheduling**: Manage patient appointments efficiently
- **Medical Records**: Upload and organize discharge summaries, diagnoses, prescriptions, and reports
- **PDF Report Generation**: Generate comprehensive analysis reports with patient data and AI insights

### 👥 For Patients

- **Patient Portal**: Secure access to personal health information
- **Medical History**: View past diagnoses, treatments, and medications
- **Appointment Tracking**: View upcoming and past appointments
- **Lab Results Access**: Review laboratory test results
- **Document Access**: Download medical records and reports

### 🤖 AI Features

- **Pneumonia Detection**: ML-powered chest X-ray analysis
- **Abnormality Scoring**: Quantitative assessment of medical images
- **Risk Level Classification**: Low, Medium, High risk categorization
- **Confidence Scoring**: AI model confidence metrics
- **Inference Time Tracking**: Performance monitoring for AI models
- **Explainable AI**: Detailed explanations of diagnostic factors

---

## 🛠 Technology Stack

### Frontend

- **React 18.3.1** - Modern UI library
- **TypeScript 5.8.3** - Type-safe development
- **Vite 5.4.19** - Fast build tool and dev server
- **React Router 6.30.1** - Client-side routing
- **TanStack Query 5.83.0** - Data fetching and caching

### UI Components & Styling

- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful component library
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **Lucide React** - Icon library
- **Recharts 2.15.4** - Data visualization

### Backend & Database

- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Storage for medical images

### Form Handling & Validation

- **React Hook Form 7.61.1** - Form management
- **Zod 3.25.76** - Schema validation

### Document Generation

- **jsPDF 3.0.4** - PDF generation
- **jsPDF AutoTable 5.0.2** - Table generation for PDFs

### Development Tools

- **ESLint 9.32.0** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS transformation

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Supabase Account** - [Sign up](https://supabase.com/)

### Optional but Recommended

- **nvm** (Node Version Manager) - [Installation guide](https://github.com/nvm-sh/nvm#installing-and-updating)
- **VS Code** - [Download](https://code.visualstudio.com/)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/robinfrancis186/medpredict16.git
cd medpredict16
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using bun (faster alternative):
```bash
bun install
```

---

## ⚙️ Environment Setup

### 1. Create Environment File

Create a `.env` file in the root directory:

```bash
touch .env
```

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For development
VITE_API_URL=http://localhost:8080
```

### 3. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Navigate to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**
5. Paste them into your `.env` file

---

## 🗄️ Database Setup

### 1. Run Migrations

The project includes migration files in `supabase/migrations/`. To set up your database:

#### Option A: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option B: Manual Setup

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order (sorted by timestamp)

### 2. Database Schema Overview

The database includes the following main tables:

- **profiles** - User profile information
- **user_roles** - Role-based access control (doctor, nurse, patient)
- **patients** - Patient demographic and medical information
- **vitals** - Patient vital signs records
- **medical_scans** - Medical imaging data and AI analysis results
- **medical_records** - Document storage and categorization
- **analysis_reports** - Generated PDF reports

### 3. Set Up Row Level Security (RLS)

Ensure RLS policies are enabled for secure data access based on user roles.

---

## 🏃 Running the Application

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Development Build

Build with development settings:

```bash
npm run build:dev
```

---

## 📁 Project Structure

```
medpredict16/
├── public/                 # Static assets
│   └── robots.txt
├── src/
│   ├── components/        # Reusable React components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # shadcn/ui components
│   ├── contexts/         # React Context providers
│   │   └── AuthContext.tsx
│   ├── data/             # Static data and constants
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service integrations
│   │   └── supabase/    # Supabase client and types
│   ├── lib/              # Utility functions
│   │   ├── pdfGenerator.ts
│   │   └── utils.ts
│   ├── pages/            # Application pages/routes
│   │   ├── Dashboard.tsx
│   │   ├── Patients.tsx
│   │   ├── XRayAnalysis.tsx
│   │   ├── VitalsMonitor.tsx
│   │   ├── MedicalRecords.tsx
│   │   ├── Appointments.tsx
│   │   ├── LabResults.tsx
│   │   └── PatientPortal.tsx
│   ├── types/            # TypeScript type definitions
│   │   └── medical.ts
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── supabase/
│   ├── migrations/       # Database migration files
│   ├── functions/        # Edge functions
│   └── config.toml       # Supabase configuration
├── .env                  # Environment variables (create this)
├── .gitignore           # Git ignore rules
├── components.json      # shadcn/ui configuration
├── eslint.config.js     # ESLint configuration
├── index.html           # HTML template
├── package.json         # Project dependencies
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

---

## 👥 User Roles & Access

MedPredict supports three user roles with different access levels:

### 1. 👨‍⚕️ Doctor

- **Full Access** to all features
- Can view and manage all patients
- Can perform medical image analysis
- Can create and edit medical records
- Can manage appointments
- Can access all analytics and reports

### 2. 👩‍⚕️ Nurse

- **Limited Staff Access**
- Can view patient information
- Can record vitals
- Can view medical records
- Can manage appointments
- Cannot perform certain administrative tasks

### 3. 🧑‍🦱 Patient

- **Personal Portal Access** only
- Can view own medical history
- Can access own lab results
- Can view appointments
- Can download personal medical records
- Cannot access other patients' data

---

## 🎨 Features by Role

### Doctor Features

- ✅ Dashboard with analytics
- ✅ Patient management (CRUD)
- ✅ Medical image analysis (X-ray, CT, MRI, ECG, Ultrasound)
- ✅ Vitals monitoring and recording
- ✅ Medical records management
- ✅ Lab results management
- ✅ Appointment scheduling
- ✅ PDF report generation
- ✅ Risk assessment and scoring

### Nurse Features

- ✅ Dashboard (view-only analytics)
- ✅ Patient list (view-only)
- ✅ Vitals recording
- ✅ Medical records viewing
- ✅ Appointment management
- ❌ Medical image analysis
- ❌ Patient creation/deletion

### Patient Features

- ✅ Personal health dashboard
- ✅ View medical history
- ✅ Access lab results
- ✅ View appointments
- ✅ Download medical documents
- ❌ Access other patients' data
- ❌ Modify medical records

---

## 💻 Development

### Code Style

This project uses ESLint for code linting. Run the linter:

```bash
npm run lint
```

### Type Checking

TypeScript is configured for strict type checking. The project uses:

- Strict mode enabled
- Path aliases (`@/` for `src/`)
- React types included

### Component Development

- Components use TypeScript for type safety
- UI components from shadcn/ui are in `src/components/ui/`
- Custom components are in `src/components/`
- Follow the existing component patterns

### State Management

- React Context for authentication and global state
- TanStack Query for server state management
- Local state with useState for component-specific state

### Styling

- Tailwind CSS for utility-first styling
- Custom theme configuration in `tailwind.config.ts`
- Dark mode support with next-themes
- Responsive design patterns

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 8080 |
| `npm run build` | Build for production |
| `npm run build:dev` | Build with development settings |
| `npm run lint` | Run ESLint to check code quality |
| `npm run preview` | Preview production build locally |

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

### Deploy to Netlify

1. Build the project: `npm run build`
2. Drag and drop the `dist` folder to [Netlify](https://netlify.com)
3. Or use Netlify CLI:

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Environment Variables in Production

Ensure you set the following environment variables in your hosting platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Write clean, maintainable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly
- Ensure TypeScript types are correct

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Backend by [Supabase](https://supabase.com)

---

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

## 🔒 Security

- All patient data is encrypted at rest and in transit
- Row Level Security (RLS) enforced at database level
- Role-based access control (RBAC)
- Secure authentication with Supabase Auth
- HIPAA compliance considerations built-in

---

## 🔮 Future Roadmap

- [ ] Mobile application (React Native)
- [ ] Telemedicine integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Voice-to-text for clinical notes
- [ ] Integration with hospital systems (HL7/FHIR)
- [ ] Prescription management
- [ ] Billing and insurance integration

---

<div align="center">
  
  **Made with ❤️ for better healthcare**
  
  [Report Bug](https://github.com/robinfrancis186/medpredict16/issues) · [Request Feature](https://github.com/robinfrancis186/medpredict16/issues)
  
</div>
