This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Repo structure

This is a monorepo bundling two independently deployed Next.js apps:

- **/** — the storefront (this app), deployed at `shop.tumirathumela.com`.
- **/cms** — TumiraCMS, the admin/content backend, deployed separately at
  `admin.tumirathumela.com`. See `cms/README.md`.

Both run as separate cPanel "Setup Node.js App" (Passenger) processes on the
same server; see `SERVER-ACCESS.md` (local, gitignored) for deploy details.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

This project deploys to a self-hosted cPanel/WHM server, not Vercel. See
`SERVER-ACCESS.md` (local, gitignored) for access details and deploy steps.
