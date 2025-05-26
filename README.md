This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deployment

Deployment to production is automatically triggered when changes are merged into the `master` branch.
The production website is available at [ravebanner.org](https://ravebanner.org) or [ravebanner.com](https://ravebanner.com).

## Build and Test Instructions

### Build
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```

### Test
1. Run the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Navigate to `/submit` to test the flag submission page.
4. Navigate to `/admin` to access the admin console.

### Notes
- Ensure your `.env.local` file is properly configured with Firebase credentials.
- Use `npm run lint` to check for linting issues.

## High Level Design

This website is built using the [Next.js](https://nextjs.org/) framework for the frontend, providing a modern, performant React-based user experience.

The backend is powered by Google Cloud Firebase:
-   **Firestore**: Used as a NoSQL document database to store application data, such as user submissions and flag details.
-   **Firebase Storage**: Used for storing user-uploaded files, like images or other media related to the flags.

This architecture allows for a scalable and serverless backend, with real-time data synchronization capabilities provided by Firebase.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
