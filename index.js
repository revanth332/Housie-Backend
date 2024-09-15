const express = require("express");
const http = require("node:http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 3000;

const rooms = [];

app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(express.json());

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

app.post("/api/room", (req, res) => {
  // console.log(req.body);
  const { type, roomCode } = req.body;
  if (type === "createRoom") {
    if (!rooms.includes(roomCode)) {
      rooms.push(roomCode);
      return res.json({ success: true, room: roomCode });
    } else {
      return res.json({
        success: false,
        room: null,
        msg: "Room already exists",
      });
    }
  } else {
    if (rooms.includes(roomCode)) {
      return res.json({ success: true, room: roomCode });
    } else {
      return res.json({
        success: false,
        room: null,
        msg: "Room does not exist",
      });
    }
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("housie", (number, role, roomNo) => {
    io.emit("housie", number, role, roomNo);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
