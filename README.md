# Cell Group Tracker | Member Monitoring & Growth Tracker

Cell Group Tracker is a specialized management system designed to track spiritual and professional growth within a team-based organization. It focuses on the "Ladder of Success" (SOL) framework, providing leaders with the tools to monitor progress, set goals, and provide personalized coaching.

## 🚀 Key Features

- **Role-Based Access Control**:
  - **Primary Leader (Admin)**: Full community overview, managing all Cell Leaders and their assigned groups.
  - **Cell Leader**: Dedicated dashboard for their specific team, tracking individual milestones and targets.
  - **Cell Member**: Personal progress view to track their own growth journey.
- **Ladder of Success (SOL) Monitoring**: Checklist-style tracking for key growth stages: **Win**, **Consolidate**, **Discipleship**, and **SOL**.
- **Active Goal Management**: Real-time tracking of specific tasks and follow-up actions for every member.
- **Smart Insights**: (AI-Powered) Personalized coaching focus points generated based on member history and progress.
- **Mobile-First Design**: Fully responsive monochrome interface optimized for both desktop management and on-the-go mobile updates.
- **Secure Data Storage**: Real-time synchronization with Firebase Firestore with strict role-based security rules.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **AI Integration**: [Genkit](https://github.com/firebase/genkit) (Gemini 1.5 Flash)
- **State Management**: React Hooks & Context API

## 📁 Project Structure

- `src/app`: Next.js pages and routing.
- `src/components`: Reusable UI components and specialized dashboard views.
- `src/firebase`: Firebase configuration, providers, and custom hooks for Firestore access.
- `src/ai`: Genkit flows for generating growth insights.
- `src/hooks`: Custom React hooks for authentication and data management.
- `src/lib`: Shared types, utility functions, and schema definitions.

## ⚙️ Setup & Configuration

### Environment Variables
Create a `.env` file in the root directory with your Firebase and Google Cloud credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

### Security Rules
The application relies on specific Firestore Security Rules. Ensure your `firestore.rules` are deployed to allow role-based listing and document access.

## 📈 Growth Stages
1. **Win**: The initial stage of engagement.
2. **Consolidate**: Building the foundation and strengthening commitment.
3. **Discipleship**: Active training and mentorship.
4. **SOL**: Reaching leadership maturity.

---
Developed as a professional monitoring solution for organized growth tracking.
