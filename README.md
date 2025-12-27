# AI Bytes Learning Platform

This is the frontend application for the AI Bytes Learning platform, a modern learning environment for AI-related courses. This project is built with Next.js, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (v16+)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) (using `class-variance-authority` and `lucide-react`)
- **Content Parsing**: [Cheerio](https://cheerio.js.org/), [@mozilla/readability](https://github.com/mozilla/readability)
- **Linting/Formatting**: ESLint

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ai-bytes-learning
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a new file named `.env.local` in the root of the project by copying the example file:
    ```bash
    cp .env.example .env.local
    ```
    Now, open `.env.local` and add your News API key. You can get a free key from [newsapi.org](https://newsapi.org).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

A brief overview of the key directories:

-   `/app`: Contains all the routes and pages for the application, following the Next.js App Router structure.
-   `/components`: Contains all shared React components, such as the Header, UI elements (Buttons, Cards), etc.
-   `/lib`: Contains library code and utility functions.
-   `/public`: Contains static assets like images and fonts.

## Key Features Implemented

-   **Dynamic News Feed**: The homepage features a "Trending in AI" section that fetches and displays the latest AI-related news from a live API.
-   **Article Scraping & Display**: Clicking a news article opens a page within the application that displays the full, cleaned article content, scraped from the source.
-   **Robust Error Handling**: If an article cannot be scraped, the page displays a user-friendly message with a direct link to the original source.
-   **Responsive Design**: The application is designed to be fully responsive across mobile, tablet, and desktop devices.
-   **Theme Switching**: Supports light and dark mode themes.