# Dhanalakshmi Furnitures Admin Panel

This is the admin panel for Dhanalakshmi Furnitures, built with React, TypeScript, and Vite.

## Technologies Used

- **Frontend Framework**: React
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-ui
- **Icons**: Lucide React
- **State Management**: React Query

## Getting Started

To get started with development locally, follow these steps:

### Prerequisites

- Node.js & npm installed

### Installation

1.  Clone the repository:
    ```sh
    git clone <YOUR_GIT_URL>
    ```

2.  Navigate to the project directory:
    ```sh
    cd client
    ```

3.  Install dependencies:
    ```sh
    npm install
    ```

4.  Create a `.env` file in the `client` directory with the following variables:
    ```env
    VITE_API_URL=http://localhost:30036/api
    VITE_ADMIN_EMAIL=admin@gmail.com
    VITE_ADMIN_PASSWORD=Dhana@123
    ```

5.  Start the development server:
    ```sh
    npm run dev
    ```

## Project Structure

- `src/components`: Reusable UI components
- `src/pages`: Application pages (Admin Dashboard, Products, etc.)
- `src/contexts`: React Contexts (Auth, etc.)
- `src/lib`: Utility functions and API clients
- `src/types`: TypeScript interfaces and types

## Deployment

Build the application for production:

```sh
npm run build
```

The build artifacts will be stored in the `dist/` directory.
