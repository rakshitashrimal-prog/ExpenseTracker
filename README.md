# Expense Tracker (Supabase database version)

A personal expense tracker using HTML, CSS, JavaScript, and Supabase PostgreSQL.

## One-time setup

1. In Supabase, create the `public.transactions` table using the SQL supplied in the ChatGPT setup steps. The table needs `id`, `user_id`, `type`, `description`, `amount`, `category`, and `transaction_date` columns, with Row Level Security enabled and per-user policies.
2. Open `script.js`.
3. Replace `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE` with the project's **Publishable key** (or legacy `anon` public key). Do not use a `service_role` or secret key.
4. Keep the project URL as `https://icbtdkqrlumfnftxsysj.supabase.co` only if that is the Supabase project you created. Otherwise replace it with your own Project URL.
5. Publish the updated files to your GitHub repository and redeploy on Vercel.

## Features
- Sign up and sign in with Supabase Auth
- Add income and expenses to PostgreSQL
- View, filter, and delete transactions
- Summary totals and balance
- User-specific data protected by Row Level Security

## Run
Open `index.html` in a browser after completing the Supabase configuration. For deployment, use a static hosting service such as Vercel.
