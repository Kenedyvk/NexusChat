# NexusChat

NexusChat is a functional internal communication and resource-management prototype built to centralize messaging, room scheduling and operational information in one application.

## Current capabilities

- direct conversations and channels;
- message delivery through a REST API;
- internal people and department directory;
- meeting-room scheduling with conflict detection;
- department-based meeting visibility;
- operational indicators in Central Nexus;
- real-time updates with Socket.IO;
- local execution with Node.js or Docker.

## Tech stack

- Node.js 24
- Fastify
- Socket.IO
- HTML, CSS and JavaScript
- Docker

## Running locally

With Node.js 24:

```bash
npm install
npm start
```

Open `http://localhost:8080`.

With Docker:

```bash
docker compose up --build
```

On Windows, `start.bat` can choose between Docker and Node.js automatically.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Application health |
| GET | `/api/me` | Demo user |
| GET | `/api/conversations` | Conversations and channels |
| GET | `/api/messages/:conversationId` | Conversation history |
| POST | `/api/messages` | Send message |
| GET | `/api/people` | Internal directory |
| GET | `/api/rooms` | Available rooms |
| GET | `/api/meetings` | Meetings visible to the user |
| POST | `/api/meetings` | Create a room reservation |
| GET | `/api/admin/metrics` | Demo operational metrics |

## Production roadmap

The current version uses demonstration data in memory and must not be used with real organizational data. The production-oriented evolution is being developed separately as **Nexus Platform**, with persistent storage, authentication, authorization, auditing and automated tests.

This repository is kept as the functional prototype that validated the original product experience and real-time interaction model.
