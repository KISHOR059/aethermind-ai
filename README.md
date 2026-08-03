# AetherMind AI

A full-stack task management application built with React, Express, TypeScript, MongoDB, and Turborepo.

This guide explains how beginners can clone and run the project on Windows.

## 1. Install the required software

Install:

1. Git for Windows: https://git-scm.com/download/win
2. Node.js 18 or newer (LTS recommended): https://nodejs.org/
3. MongoDB Community Server: https://www.mongodb.com/try/download/community
4. MongoDB Shell (mongosh): https://www.mongodb.com/try/download/shell

Open PowerShell and verify Node.js:

```powershell
node --version
npm --version
```

Install pnpm:

```powershell
npm install --global pnpm@9
pnpm --version
```

## 2. Clone the project

```powershell
git clone <YOUR_REPOSITORY_URL>
cd aethermind-ai
```

Replace <YOUR_REPOSITORY_URL> with the Git repository URL.

## 3. Install dependencies

From the project root:

```powershell
pnpm install
```

## 4. Install and start MongoDB

During MongoDB installation, choose Install MongoD as a Service if available.

Check the service:

```powershell
Get-Service MongoDB
```

If it is stopped, start it:

```powershell
Start-Service MongoDB
```

You can also open Windows Services, find MongoDB Server, and click Start.

Verify MongoDB:

```powershell
mongosh --eval "db.runCommand({ ping: 1 })"
```

The result should contain:

```text
{ ok: 1 }
```

## 5. Configure the API

Create this file:

```text
apps/api/.env
```

Add:

```env
PORT=4000
WEB_ORIGIN=http://localhost:5173
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/aethermind
JWT_ACCESS_SECRET=aethermind-development-access-secret-change-me
JWT_REFRESH_SECRET=aethermind-development-refresh-secret-change-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

The MongoDB URI connects to local MongoDB on port 27017 and uses the aethermind database.

For local Ollama, set these API environment variables:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_REQUEST_TIMEOUT_MS=180000
```

Start Ollama and pull the model before using the AI feature:

```powershell
ollama serve
ollama pull llama3.2:3b
```

To switch back to Gemini, set `AI_PROVIDER=gemini` and configure the Gemini
environment variables. No source code changes are required.

## 6. Configure the web app

Create:

```text
apps/web/.env
```

Add:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_NAME=AetherMind
VITE_APP_VERSION=1.0.0
```

## 7. Start the project

From the project root:

```powershell
pnpm dev
```

Open the web app at http://localhost:5173.

The API runs at http://localhost:4000.

Keep PowerShell open while using the application. Press Ctrl+C to stop the servers.

## 8. Check the API

Open:

```text
http://localhost:4000/api/v1/health
```

The response should contain:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## 9. View saved MongoDB data

Open MongoDB Shell:

```powershell
mongosh
```

Select the database and list collections:

```javascript
use aethermind
show collections
```

View tasks:

```javascript
db.tasks.find().pretty()
```

View registered users:

```javascript
db.users.find({}, { firstName: 1, lastName: 1, email: 1 }).pretty()
```

Exit:

```javascript
exit
```

MongoDB Compass connection string:

```text
mongodb://127.0.0.1:27017
```

Open the aethermind database, then the tasks or users collection.

## 10. Common problems

### pnpm is not recognized

Close and reopen PowerShell, then run:

```powershell
npm install --global pnpm@9
```

### MongoDB connection refused

```powershell
Get-Service MongoDB
Start-Service MongoDB
mongosh --eval "db.runCommand({ ping: 1 })"
```

### The web app cannot connect to the API

Confirm that the API is running on port 4000 and that apps/web/.env contains:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

Restart pnpm dev after changing an environment file.

### Port 5173 or 4000 is already in use

Stop the other application using the port and run pnpm dev again. Vite may choose another web port, but the API must use port 4000 unless PORT is changed in apps/api/.env.

## Useful commands

```powershell
pnpm dev
pnpm check-types
pnpm lint
pnpm format
```
