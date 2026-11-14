# Socket.IO & Real-Time Communication — Study Notes

## 1. Client and Server

### What is a Client?
- A client is an application or device that sends requests to a server.
- Examples:
  - React application
  - Web browser
  - Mobile application

### What is a Server?
- A server receives client requests, processes them and sends responses.
- In MERN applications, Node.js and Express are commonly used to create the backend server.

### Basic communication flow

1. Client sends a request.
2. Server receives the request.
3. Server processes the request.
4. Server may communicate with the database.
5. Server sends a response.
6. Client displays the result.

Example:

React → Express/Node.js → MongoDB → Express/Node.js → React

---

## 2. HTTP (HyperText Transfer Protocol)

### What is HTTP?
HTTP is a communication protocol used by clients and servers to exchange information.

It normally follows a request-response model.

### How HTTP works

1. Client sends an HTTP request.
2. Server processes the request.
3. Server sends an HTTP response.
4. Client receives the response.

### HTTP request contains

- URL: Where the request is sent.
- Method: What action the client wants.
- Headers: Additional information.
- Body: Data sent to the server (when needed).

### Important HTTP methods

| Method | Purpose |
|---|---|
| GET | Retrieve data |
| POST | Create data |
| PUT | Replace or completely update data |
| PATCH | Partially update data |
| DELETE | Delete data |

### Important HTTP status codes

| Status | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

### What is Polling?

Polling means the client repeatedly sends requests to the server to check whether something has changed.

Example:
- A client checks an order's status every 5 seconds.
- If the order status changes, the client receives the updated information on its next request.

### Types of polling

1. Short Polling:
   - Client sends requests at fixed intervals.
   - Example: Every 5 seconds.

2. Long Polling:
   - Server keeps a request open until new information is available or a timeout occurs.
   - Client sends another request after receiving a response.

### Limitation of HTTP polling
- Repeated requests create unnecessary network traffic.
- Updates may be delayed until the next request.
- It is not ideal for applications requiring frequent real-time updates.

---

## 3. Real-Time Communication

### What is Real-Time Communication?

Real-time communication means exchanging information between clients and servers with very little delay.

Examples:
- WhatsApp messaging
- Online multiplayer games
- Live order tracking
- Video conferencing
- Live notifications
- Chat applications

### Example: Food Delivery Application

1. Customer places an order.
2. Restaurant receives the order.
3. Restaurant accepts the order.
4. Backend updates the order status.
5. Customer receives the updated status without refreshing the page.

### Technologies used for real-time communication

- WebSocket
- Socket.IO
- Server-Sent Events (SSE)

---

## 4. WebSocket

### What is WebSocket?

WebSocket is a communication protocol that establishes a persistent, bidirectional connection between a client and a server.

### Important concepts

**1. Persistent Connection**
- Once established, the connection remains open until it is closed.
- The client does not need to create a new connection for every message.

**2. Bidirectional Communication**
- Both client and server can send information independently.

**3. Full-Duplex Communication**
- Both sides can send and receive data at the same time.

**4. Handshake**
- WebSocket starts with an HTTP handshake.
- The client requests an upgrade to the WebSocket protocol.
- If accepted, communication continues using WebSocket frames.

**5. WebSocket URLs**
- `ws://` — Unencrypted WebSocket connection.
- `wss://` — Secure WebSocket connection.

### Basic WebSocket client example

```javascript
const socket = new WebSocket("ws://localhost:5000");

socket.onopen = () => {
    socket.send("Hello Server!");
};

socket.onmessage = (event) => {
    console.log(event.data);
};

socket.onclose = () => {
    console.log("Connection closed");
};
```

### Basic WebSocket server example

```javascript
const WebSocket = require("ws");

const server = new WebSocket.Server({
    port: 5000
});

server.on("connection", (socket) => {

    console.log("Client connected");

    socket.on("message", (message) => {
        console.log(message.toString());

        socket.send("Hello Client!");
    });

    socket.on("close", () => {
        console.log("Client disconnected");
    });
});
```

### Advantages
- Real-time communication.
- Bidirectional communication.
- No repeated polling requests.
- Efficient for frequent updates.

### Limitations
- Connection management must be handled.
- Reconnection logic needs to be implemented.
- Rooms and broadcasting need to be implemented separately.
- Scaling many simultaneous connections requires planning.

---

## 5. Socket.IO

### What is Socket.IO?

Socket.IO is a JavaScript library that enables real-time, bidirectional and event-based communication between clients and servers.

It provides features that make real-time application development easier.

### Important features

- Event-based communication.
- Automatic reconnection.
- Broadcasting.
- Rooms.
- Namespaces.
- Acknowledgements.
- HTTP long-polling fallback.

### Important point

Socket.IO is NOT the same as WebSocket.

- WebSocket is a communication protocol.
- Socket.IO is a communication library.
- Socket.IO can use WebSocket or HTTP long-polling as its transport.
- A normal WebSocket client cannot directly communicate with a Socket.IO server.

### How Socket.IO connects

By default, Socket.IO can start with HTTP long-polling and attempt to upgrade to WebSocket.

If WebSocket is unavailable, it can continue using polling.

---

## 6. Understanding io, socket and server

These three terms are very important.

### 1. server

The actual HTTP server created by Node.js.

```javascript
const server = http.createServer(app);
```

It handles HTTP requests and provides the server that Socket.IO attaches to.

### 2. io

The Socket.IO server instance.

```javascript
const io = new Server(server);
```

- Manages Socket.IO connections.
- Sends events to clients.
- Supports broadcasting, rooms and namespaces.

### 3. socket

Represents one connected client's Socket.IO connection.

```javascript
io.on("connection", (socket) => {
    console.log(socket.id);
});
```

Each connected client has its own socket object.

### Simple difference

| Term | Meaning |
|---|---|
| server | HTTP server |
| io | Socket.IO server instance |
| socket | Individual client connection |

### Understanding app.listen()

```javascript
const server = app.listen(5001);
const io = new Server(server);
```

- `app.listen(5001)` creates and starts an HTTP server.
- It returns the HTTP server instance.
- We pass that server to Socket.IO.

Another common approach:

```javascript
const server = http.createServer(app);
const io = new Server(server);

server.listen(5001);
```

Both approaches are valid.

---

## 7. Setting Up Socket.IO with Express

### Backend installation

```bash
npm install express socket.io
```

### Frontend installation

```bash
npm install socket.io-client
```

### Backend example

```javascript
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("send_message", (data) => {
        console.log("Message received:", data);

        io.emit("receive_message", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });

});

server.listen(5001, () => {
    console.log("Server running on port 5001");
});
```

### Frontend example

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

socket.emit("send_message", "Hello Server!");

socket.on("receive_message", (message) => {
    console.log(message);
});
```

### Communication flow

1. React connects to the Socket.IO server.
2. Backend detects the connection.
3. React emits `send_message`.
4. Backend listens for `send_message`.
5. Backend emits `receive_message`.
6. React listens for `receive_message`.
7. React displays the message.

---

## 8. Important Socket.IO Methods

### on()

`on()` is used to listen for an event.

```javascript
socket.on("receive_message", (data) => {
    console.log(data);
});
```

Meaning: When `receive_message` occurs, execute the callback.

### emit()

`emit()` is used to send an event.

```javascript
socket.emit("send_message", "Hello");
```

Meaning: Send an event named `send_message` with the data `Hello`.

### off()

`off()` removes a previously registered event listener.

```javascript
socket.off("receive_message", handleMessage);
```

### connect()

Connects the Socket.IO client.

```javascript
socket.connect();
```

### disconnect()

Disconnects the Socket.IO client.

```javascript
socket.disconnect();
```

### socket.id

Provides the unique ID of a particular socket connection.

```javascript
console.log(socket.id);
```

Important:
- It identifies a connection, not a permanent user.
- It may change after reconnection.
- One user can have multiple socket IDs if they use multiple devices or browser tabs.

### Built-in and custom events

Built-in events:
- `connect`
- `disconnect`
- `connection` (server-side)

Custom events created by developers:
- `send_message`
- `receive_message`
- `edit_message`
- `delete_message`
- `typing`

---

## 9. socket.emit vs io.emit vs broadcast

Suppose four users are connected:

- Rahul
- Amit
- Priya
- Neha

### 1. socket.emit()

Sends an event only to the current socket.

```javascript
socket.emit("message", "Hello Rahul");
```

Only the current connected client receives it.

### 2. io.emit()

Sends an event to all connected clients in the current namespace, including the sender.

```javascript
io.emit("message", "Hello Everyone");
```

All four users receive it.

### 3. socket.broadcast.emit()

Sends an event to all connected clients except the sender.

```javascript
socket.broadcast.emit("message", "Someone joined");
```

If Rahul sends it, Amit, Priya and Neha receive it.

### Quick comparison

| Method | Who receives it? |
|---|---|
| socket.emit() | Current socket only |
| io.emit() | Everyone, including sender |
| socket.broadcast.emit() | Everyone except sender |

---

## 10. React useEffect with Socket.IO

We use `useEffect()` to register event listeners when a React component mounts.

### Example

```jsx
useEffect(() => {

    const handleMessage = (message) => {
        setMessages((prev) => [...prev, message]);
    };

    socket.on("receive_message", handleMessage);

    return () => {
        socket.off("receive_message", handleMessage);
    };

}, []);
```

### Understanding the code

1. `useEffect()` runs after the component mounts.
2. `socket.on()` registers the event listener.
3. When the server sends `receive_message`, the callback executes.
4. `setMessages()` adds the new message to the existing messages.
5. The cleanup function removes the listener when the component unmounts.

### Important points

- An empty dependency array `[]` means the effect runs on mount, with cleanup on unmount.
- The listener is registered once per effect setup.
- Its callback can execute many times as matching events arrive.
- `socket.off()` removes the listener; it does not disconnect the socket.
- `socket.disconnect()` closes the connection.
- React Strict Mode may run an extra setup/cleanup cycle in development.

### Why use this?

Without cleanup, duplicate listeners may accumulate and the same message could appear multiple times.

---

## 11. CORS in Socket.IO

CORS means Cross-Origin Resource Sharing.

Example:
- React frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`

These are different origins because their ports differ.

### Socket.IO CORS configuration

```javascript
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
```

### Why GET and POST?

Socket.IO may use HTTP long-polling transport.

- GET requests are used to receive data.
- POST requests are used to send data.

Socket.IO events themselves are not HTTP methods.

### Express REST API CORS

For REST APIs, we can separately install and configure the `cors` package.

```javascript
import cors from "cors";

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}));
```

---

## 12. Rooms in Socket.IO

### What is a Room?

A room is a group of connected sockets.

We can send an event to a particular group instead of sending it to everyone.

Example:
- Room 101: Rahul, Amit and Priya.
- Room 102: Neha and Karan.

### Important room methods

**Join a room**

```javascript
socket.join("room101");
```

Adds the current socket to the room.

**Send to everyone in a room**

```javascript
io.to("room101").emit("receive_message", message);
```

Includes the sender if the sender belongs to that room.

**Send to everyone except the sender in a room**

```javascript
socket.to("room101").emit("receive_message", message);
```

**Leave a room**

```javascript
socket.leave("room101");
```

Removes the socket from that room without disconnecting it.

### Complete example

```javascript
io.on("connection", (socket) => {

    socket.on("join_room", (roomName) => {
        socket.join(roomName);
    });

    socket.on("send_message", ({ roomName, message }) => {
        io.to(roomName).emit("receive_message", message);
    });

    socket.on("leave_room", (roomName) => {
        socket.leave(roomName);
    });

});
```

### Important points

- A socket can join multiple rooms.
- A room is automatically created when a socket joins it.
- A socket can leave one room and remain connected.
- When a socket disconnects, Socket.IO automatically removes it from its rooms.

### Real-world uses

- Group chat.
- Game lobbies.
- Online classrooms.
- Food-order tracking.
- Team communication.

---

## 13. Namespaces in Socket.IO

### What is a Namespace?

A namespace is a separate communication channel within one Socket.IO server.

It helps separate different areas of an application.

Example:

- `/chat`
- `/notifications`
- `/admin`

### Creating namespaces

```javascript
const chatNamespace = io.of("/chat");

const notificationNamespace = io.of("/notifications");
```

### Listening for connections

```javascript
chatNamespace.on("connection", (socket) => {
    console.log("Chat user connected");

});
```

### Connecting from React

```javascript
const chatSocket = io("http://localhost:5001/chat");

const notificationSocket = io("http://localhost:5001/notifications");
```

### Namespace vs Room

| Namespace | Room |
|---|---|
| Separate communication channel | Group of sockets |
| Created using `io.of()` | Joined using `socket.join()` |
| Has its own event handlers | Used to target a group |
| Example: `/chat` | Example: `group101` |

Remember:

One namespace can contain multiple rooms.

---

## 14. Private Messaging

### What is Private Messaging?

Private messaging means sending a message from one user to another specific user.

Example:
- Rahul sends a message to Amit.
- Only Amit should receive it.
- Priya and Neha should not receive it.

### How does it work?

1. User connects to the Socket.IO server.
2. Backend identifies the authenticated user.
3. Backend stores the user's active socket IDs.
4. Sender sends a message with the receiver's user ID.
5. Backend finds the receiver's socket ID.
6. Backend sends the message to that socket.

### Example

```javascript
const users = {};

io.on("connection", (socket) => {

    socket.on("register_user", (userId) => {
        users[userId] = socket.id;
    });

    socket.on("private_message", ({ receiverId, message }) => {

        const receiverSocketId = users[receiverId];

        if (receiverSocketId) {
            io.to(receiverSocketId).emit(
                "receive_private_message",
                message
            );
        }

    });

});
```

### Why io.to(socketId).emit()?

Every Socket.IO socket automatically joins a room named after its own socket ID.

Therefore, we can target one socket using:

```javascript
io.to(socketId).emit("event_name", data);
```

### Important production improvements

- Authenticate users using JWT.
- Never trust a user ID supplied by the frontend for identity.
- Handle multiple devices and tabs for one user.
- Do not treat socket IDs as permanent user IDs.
- Store messages in MongoDB so they remain available after disconnection.

---

## 15. Online and Offline User Status

### What does online/offline mean?

- Online: User has at least one active connection.
- Offline: User has no active connections.

### Why do we need online/offline tracking?

For:
- Chat applications.
- Showing green online indicators.
- Showing last seen.
- Deciding whether to send push notifications.

### Using Map and Set

We can use JavaScript's `Map` and `Set`.

```javascript
const onlineUsers = new Map();
```

Example structure:

```text
onlineUsers = {
    Rahul: [socket1, socket2],
    Amit: [socket3],
    Priya: [socket4]
}
```

In actual code, each value is a Set.

### Why Map?

A Map stores key-value pairs.

- Key: User ID.
- Value: Set of socket IDs.

### Why Set?

A Set stores unique values.

One user may have multiple connections.

Example:
- Rahul opens the app in Chrome.
- Rahul opens the app in another tab.
- Rahul now has two socket IDs.

A Set helps track both connections without duplicates.

### Backend example

```javascript
const onlineUsers = new Map();

io.on("connection", (socket) => {

    socket.on("register_user", (userId) => {

        socket.data.userId = userId;

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);

        io.emit("online_users", [...onlineUsers.keys()]);

        io.emit("active_user_count", onlineUsers.size);
    });

    socket.on("disconnect", () => {

        const userId = socket.data.userId;

        if (!userId) return;

        const userSockets = onlineUsers.get(userId);

        userSockets?.delete(socket.id);

        if (userSockets?.size === 0) {
            onlineUsers.delete(userId);

            io.emit("user_status", {
                userId,
                status: "offline"
            });
        }

        io.emit("online_users", [...onlineUsers.keys()]);

        io.emit("active_user_count", onlineUsers.size);
    });

});
```

### Important methods

| Method | Purpose |
|---|---|
| `map.set(key, value)` | Add or update an entry |
| `map.get(key)` | Get a value |
| `map.has(key)` | Check whether a key exists |
| `map.delete(key)` | Remove an entry |
| `map.size` | Number of entries |
| `set.add(value)` | Add a unique value |
| `set.delete(value)` | Remove a value |
| `set.size` | Number of values |

### Important point

A user should become offline only when their last active socket disconnects.

Closing one tab does not mean the user is offline if another tab is still connected.

---

## 16. Using MongoDB with Socket.IO

### Why use MongoDB?

Socket.IO manages live communication, but it does not permanently store messages or user information.

MongoDB stores information that we need after users disconnect or restart the application.

### What should we store?

**User collection**
- Name
- Email
- Password hash
- Online status
- Last seen
- FCM tokens

**Message collection**
- Sender ID
- Receiver ID
- Message text
- Timestamp
- Read status

**Notification collection**
- Receiver ID
- Sender ID
- Notification title
- Notification message
- Read status
- Timestamp

### User model example

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    isOnline: {
        type: Boolean,
        default: false
    },

    lastSeen: {
        type: Date,
        default: null
    },

    fcmTokens: {
        type: [String],
        default: []
    }

}, { timestamps: true });

export default mongoose.model("User", userSchema);
```

### Message model example

```javascript
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    message: {
        type: String,
        required: true
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
```

### How MongoDB and Socket.IO work together

1. Rahul sends a message.
2. Backend receives the message through Socket.IO.
3. Backend saves the message in MongoDB.
4. Backend checks whether Amit is online.
5. If online, Socket.IO delivers the message.
6. If offline, the backend can send an FCM push notification.
7. When Amit returns, the app loads messages from MongoDB.

### Important difference

| Socket.IO | MongoDB |
|---|---|
| Real-time communication | Permanent data storage |
| Handles live connections | Stores messages and users |
| Sends events | Stores chat history |
| Does not persist disconnected events | Data remains after disconnection |

### Important limitation

A JavaScript Map only tracks connections inside one Node.js process.

If we run multiple backend instances, we need shared presence tracking, such as Redis and the Socket.IO Redis adapter.

---

## 17. Offline Notifications with Firebase Cloud Messaging (FCM)

### What is FCM?

Firebase Cloud Messaging is a service from Google that allows applications to send push notifications to registered devices and browsers.

### Why do we need FCM?

Socket.IO cannot send an event to a disconnected socket.

FCM allows us to send push notifications even when the user is not actively using the application, subject to browser/device support and notification permissions.

### Three technologies and their responsibilities

1. MongoDB:
   - Stores notifications and messages.
   - Preserves notification history.

2. Socket.IO:
   - Delivers messages and notifications instantly to connected users.

3. FCM:
   - Sends push notifications to registered devices or browsers.

### Example

Rahul sends a message to Amit.

**If Amit is online:**

- Save the message in MongoDB.
- Deliver it through Socket.IO.

**If Amit is offline:**

- Save the message in MongoDB.
- Save a notification in MongoDB.
- Send a push notification through FCM.

**When Amit comes back:**

- Load chat history from MongoDB.
- Load unread notifications.
- Mark notifications as read when appropriate.

### Notification model example

```javascript
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
```

### What is an FCM token?

An FCM token is an identifier generated for a registered browser or device.

The backend uses this token to target a push notification.

Important:
- Each device/browser installation can have its own token.
- One user may have multiple tokens.
- Tokens can change or expire.
- The backend should remove invalid tokens when Firebase reports them.

### FCM setup requirements for React web

1. Create a Firebase project.
2. Register a web application.
3. Install the Firebase client SDK.
4. Configure Firebase in React.
5. Generate a VAPID key pair.
6. Ask the user for notification permission.
7. Register a service worker.
8. Generate an FCM token.
9. Send the token securely to the backend.
10. Save the token in MongoDB.

### Backend requirements

Install Firebase Admin:

```bash
npm install firebase-admin
```

Initialize Firebase Admin using secure server-side credentials.

Never expose service account credentials in frontend code.

### Example notification sending logic

```javascript
import admin from "firebase-admin";

async function sendPushNotification(tokens, title, body) {

    if (!tokens.length) return;

    const response =
        await admin.messaging().sendEachForMulticast({
            tokens,

            notification: {
                title,
                body
            }
        });

    console.log("Successful:", response.successCount);
    console.log("Failed:", response.failureCount);

    return response;
}
```

### Important FCM web points

- Browser notification permission is required.
- A service worker handles background push messages.
- HTTPS is required in production; localhost is allowed during development.
- A valid FCM token and VAPID configuration are needed.
- Browser and operating-system settings can affect notification delivery.
- Foreground and background notifications may need different handling.

---

## 18. Complete Application Architecture

Our planned application uses:

**Frontend**
- React
- Vite
- Socket.IO Client
- Firebase SDK

**Backend**
- Node.js
- Express.js
- Socket.IO
- Firebase Admin SDK

**Database**
- MongoDB
- Mongoose

### Complete message flow

```text
             Rahul (React)
                   |
                   |
             Socket.IO Event
                   |
                   v
          Node.js + Express
                   |
                   v
           Save Message
              MongoDB
                   |
                   v
         Check Amit's Presence
                   |
             +-----+-----+
             |           |
          Online       Offline
             |           |
             v           v
         Socket.IO      FCM
             |           |
             v           v
       Amit's React   Amit's Browser
       Application    Notification
             |
             v
       Load Chat History
          from MongoDB
```

---

## 19. How to Test the Complete Application

Use two separate browser sessions.

- Browser 1: Rahul
- Browser 2: Amit

### Test 1: Both users online

1. Open the application in two browser sessions.
2. Log in as Rahul in Browser 1.
3. Log in as Amit in Browser 2.
4. Rahul sends Amit a message.
5. Verify that Amit receives it instantly.
6. Check the MongoDB message document.

Expected result: Message appears immediately using Socket.IO.

### Test 2: Amit offline

1. Keep Rahul online.
2. Close Amit's browser or disconnect it.
3. Rahul sends Amit another message.
4. Check the MongoDB message collection.
5. Check the notification collection.
6. Verify FCM delivery.

Expected result: Message and notification are stored; Amit's registered browser/device receives a push notification if delivery conditions are met.

### Test 3: Amit returns online

1. Open Amit's browser again.
2. Log in as Amit.
3. Load the conversation.
4. Check whether previously sent messages appear.

Expected result: Messages are retrieved from MongoDB.

### Test 4: Multiple tabs

1. Open Rahul's account in two tabs.
2. Close one tab.
3. Check Rahul's online status.
4. Close the second tab.
5. Check Rahul's status again.

Expected result:
- First tab closes: Rahul remains online.
- Last tab closes: Rahul becomes offline.

### Test 5: Notification permission

1. Allow browser notifications.
2. Register the FCM token.
3. Send a test notification.
4. Check whether the browser displays it.
5. Test again with the browser in the background and then closed.

Expected result: Push delivery works according to browser and device support.

---

## 20. Important Security and Production Considerations

1. Authenticate Socket.IO connections using JWT.
2. Do not trust user IDs sent by the frontend.
3. Verify the sender is allowed to message the receiver.
4. Validate message content and limit message sizes.
5. Store messages before attempting delivery.
6. Handle invalid or expired FCM tokens.
7. Do not expose Firebase service account credentials.
8. Use Redis/shared presence for multiple backend instances.
9. Handle reconnects and multiple devices.
10. Use secure HTTPS/WSS connections in production.
11. Add rate limiting to prevent message spam.
12. Handle offline notification delivery failures and retries.

---

## 21. Quick Revision Cheat Sheet

| Concept | Meaning |
|---|---|
| HTTP | Request-response communication |
| Polling | Repeatedly checking for updates |
| WebSocket | Persistent bidirectional protocol |
| Socket.IO | Real-time event-based communication library |
| `on()` | Listen for an event |
| `emit()` | Send an event |
| `off()` | Remove an event listener |
| `socket.id` | ID of a connection |
| `io.emit()` | Send to all connected sockets |
| `socket.emit()` | Send to current socket |
| `socket.broadcast.emit()` | Send to everyone except sender |
| Room | Group of sockets |
| Namespace | Separate communication channel |
| Map | Stores user-to-connection mapping |
| Set | Stores unique socket IDs |
| MongoDB | Persistent data storage |
| FCM | Push notification service |
| FCM token | Identifies a registered device/browser |
| JWT | Used to authenticate users |
| Redis | Shared storage useful for multi-server presence |

## 22. Our Learning and Project Roadmap

Topics already covered:
- Client and server
- HTTP and polling
- Real-time communication
- WebSocket
- Socket.IO fundamentals
- Socket.IO methods
- React integration and useEffect
- CORS
- Broadcasting
- Rooms
- Namespaces
- Private messaging
- Online/offline status
- Map and Set
- MongoDB integration
- Offline notification architecture using FCM

Next practical implementation:
1. Create the React and Node projects.
2. Connect MongoDB.
3. Build user login for testing.
4. Connect React and Socket.IO.
5. Implement private messaging.
6. Save messages in MongoDB.
7. Configure Firebase Cloud Messaging.
8. Register and save FCM tokens.
9. Send notifications to offline users.
10. Test the complete application.