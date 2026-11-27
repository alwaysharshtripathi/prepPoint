# PrepPoint – Online Assessment & Placement Preparation Platform

PrepPoint is an online assessment platform designed to help students prepare for placement examinations through structured mock assessments. It provides an environment where users can attempt questions across different categories, evaluate their performance, and track their progress over time.

## Features

- **User Authentication:** Secure registration and login using Supabase Authentication.
- **Assessment Dashboard:** Access available assessment modes and view assessment-related information.
- **Timed Assessments:** Attempt questions within a predefined time limit.
- **Multiple Categories:** Questions covering Technical, Logical Reasoning, Aptitude, and Communication.
- **Difficulty Levels:** Questions organized into Easy, Medium, Hard, and Mixed difficulty levels.
- **Performance Analysis:** View assessment results and analyze performance.
- **Assessment History:** Access previous attempts and track performance over time.
- **Profile Management:** View account information and personal assessment statistics.
- **Anti-Cheating Measures:** Full-screen monitoring with visibility warnings and automatic submission after repeated violations.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Application framework |
| React 19 | User interface |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling and responsive design |
| Supabase | Database and authentication |
| PostgreSQL | Relational database |

## Assessment Structure

The assessment engine is designed around the following structure:

| Parameter | Details |
|---|---|
| Duration | 60 Minutes |
| Total Questions | 45 |
| Question Bank | 400+ Questions |
| Categories | Technical, Logical, Aptitude, Communication |
| Difficulty | Easy, Medium, Hard, Mixed |

## Getting Started

Follow these steps to run PrepPoint locally.

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git
- A Supabase account

### 1. Clone the Repository

```bash
git clone https://github.com/alwaysharshtripathi/prepPoint.git
```

### 2. Navigate to the Project Directory

```bash
cd prepPoint
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory and add your Supabase project credentials.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Use the variable names expected by your Supabase client configuration. Never expose your Supabase secret or service role key.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

## Project Structure

```text
prepPoint/
│
├── public/              # Static assets
├── src/                 # Application source code
├── .gitignore           # Git ignored files
├── import_data.json     # Assessment import data
├── questions.csv        # Question bank data
├── seed.js              # Database seeding script
├── package.json         # Project dependencies
├── package-lock.json    # Dependency lock file
├── next.config.ts       # Next.js configuration
└── tsconfig.json        # TypeScript configuration
```

## Future Improvements

- Additional assessment categories and question sets.
- More detailed performance analytics.
- Improved assessment recommendations based on previous attempts.
- Additional placement preparation resources.

## Author

**Harsh Tripathi**

- GitHub: [@alwaysharshtripathi](https://github.com/alwaysharshtripathi)

---

*PrepPoint – Practice, Evaluate, Improve.*
