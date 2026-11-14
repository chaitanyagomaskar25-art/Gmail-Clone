# SmartMail - Nodemailer Workspace with Real-Time Socket.IO & Voice Assistant

Full-stack email suite built with Node.js, Express, Nodemailer SMTP, Socket.IO, MongoDB, and modern React (Vite).

## 🚀 Features

### ✉️ Nodemailer SMTP Mail Engine
- Standard Nodemailer SMTP configuration using Gmail credentials (`EMAIL_USER`, `EMAIL_PASS`).
- Dispatches outgoing emails directly through Nodemailer to any recipient email address.
- Delivers incoming mail directly into the recipient's in-app Inbox.
- Mail tracking, pagination, soft deletion, and search.

### 🔌 Socket.IO Real-Time Integration
- **Authenticated Socket Handshake**: Validates JWT access tokens on WebSocket connection.
- **User-Specific Rooms**: Sockets automatically join user rooms (`user:${userId}`).
- **Instant Mail Delivery**: When an email is sent to an app user, it appears in their Inbox instantly via the `new_email` event without refreshing.
- **Dynamic Unread Counter**: Emits `update_unread_count` on incoming mail, marking as read/unread, and deletion.
- **Connection Indicator**: Live status light in the top header.

### 🎙️ Voice Assistant
- **New Email Announcements**: Announces incoming emails aloud ("New email received from [Sender]. Subject: [Subject].").
- **Read Complete Email**: On-demand playback of the full email (Sender, Recipient, Subject, and full body text).
- **Playback Controls**:
  - **Pause**: Pause ongoing speech.
  - **Resume**: Continue speech.
  - **Stop**: Cancel speech immediately.
- **Mute Settings**:
  - Global Mute toggle button in the header.
  - Setting persisted in `localStorage`.
- **Floating Audio Player**: Glassmorphism bottom bar with animated sound waves.

---

## 🛠️ Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
# Starts API and Socket.IO server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Starts Vite client on http://localhost:5173
```
