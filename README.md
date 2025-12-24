# Playground Library

Personal digital library for managing and accessing our book and coloring collection remotely.


### Coming Soon
Will be adding simple games:
- Games will be tailored for children between the ages of 4-6
- Games will be educational games:
    - Math games
    - Reading games
    - Tic tac toe

## Features

- Browse library with cover images and metadata
- Upload books with PDF files and covers
- Delete books from collection
- Remote access via Tailscale
- Dark mode support

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (database & storage)
- Deployed on Raspberry Pi with PM2
- Tailscale for remote access

## Quick Reference

### Accessing the Library

| Device | URL |
|--------|-----|
| Raspberry Pi | `http://localhost:3000` |
| Phone/Remote | `http://100.88.146.75:3000` |

### Updating the App

    pm2 stop santo-amado-library
    git pull
    npm install
    npm run build
    pm2 restart santo-amado-library

### Managing PM2

    pm2 status                           # Check app status
    pm2 logs santo-amado-library         # View logs
    pm2 restart santo-amado-library      # Restart app

## Project Structure

    app/
    ├── page.tsx          # Home page
    ├── library/          # Browse books
    └── upload/           # Upload new books

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

Private project for personal use.