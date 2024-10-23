const express = require("express");
const http = require("node:http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});
console.log(process.env.FRONTEND_URL)
const port = process.env.PORT || 3000;

var rooms = [];
var roomUsers = {}

// app.use(cors({ origin: ["http://172.17.10.127:5173"] }));
app.use(cors());
app.use(express.json());

app.get("/test",(req,res) => {
  return res.send("test")
})

app.post("/api/room", (req, res) => {
  // console.log(req.body);
  const { type, roomCode, user } = req.body;
  const username = user;
  if (type === "createRoom") {
    if (!rooms.includes(roomCode)) {
      rooms.push(roomCode);
      roomUsers[roomCode] = [username];
      console.log("room created"+roomCode);
      return res.json({ success: true, room: roomCode,users:[username] });
    } else {
      console.log([...rooms]);
      return res.json({
        success: false,
        room: null,
        msg: "Room already exists",
      });
    }
  } else {
    if (rooms.includes(roomCode)) {
      if(!roomUsers[roomCode].includes(username)){
        roomUsers[roomCode].push(username);
        console.log("user entered ")
        return res.json({ success: true, room: roomCode,users:roomUsers[roomCode] });
      }
      else{
        console.log("user exists ")
        return res.json({
          success: false,
          room: null,
          msg: "User already exists",
        });
      }
    } else {
      console.log("room not exists " + rooms)
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

  socket.on("housie", (number, role, roomNo,genNums) => {
    io.emit("housie", number, roomNo,genNums,roomUsers[roomNo]);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on('audioStream', (audioData,room) => { 
    socket.broadcast.emit('audioStream', audioData,room);
    // console.log(room+"jk")/
  });

  socket.on("entered",(role,room,username) => {
    console.log(role,room,username)
    socket.broadcast.emit('entered', role,room,username);
  })

  socket.on("exit",(user,room,role) => {
    if(role === "host"){
      rooms = rooms.filter(roomNo => roomNo != room);
      delete roomUsers[room];
    }
    else if(role === "guest"){
      console.log(roomUsers[room])
      roomUsers[room] = roomUsers[room].filter(username => user != username);
    }
    socket.broadcast.emit("exit",user,room,role);
    console.log("username : "+user,"room : "+room)
  })

});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
