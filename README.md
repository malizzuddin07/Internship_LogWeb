# InternLog - Internship Management System

A professional full-stack platform for students to log daily internship activities and for admins to manage, analyze, and export logs to Excel.

## 🚀 Features
- **Student Portal**: Log daily tasks, skills learned, and problems faced.
- **Admin Dashboard**: Manage student accounts, view all logs, and see real-time analytics.
- **Excel Export**: Generate professional internship reports with one click.
- **Cloud Database**: Powered by Firebase Firestore for real-time data persistence.
- **Secure Auth**: JWT-based authentication with encrypted passwords.

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Recharts.
- **Backend**: Node.js, Express.
- **Database**: Firebase Firestore.
- **Icons**: Lucide React.

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-github-repo-url>
   cd internlog
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Firebase Setup**:
   Ensure you have a `firebase-applet-config.json` file in the root directory with your Firebase credentials.

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 🌐 Deployment

### Cloud Run (Recommended)
This app is designed to run in a container. You can deploy it directly to Google Cloud Run using the AI Studio "Deploy" button or via the Google Cloud CLI.

### Vercel / Render
1. Connect your GitHub repository.
2. Set the **Build Command** to `npm run build`.
3. Set the **Start Command** to `node server.ts`.
4. Add your Firebase configuration as environment variables.

## 📄 License
MIT
