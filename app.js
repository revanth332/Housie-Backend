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
      roomUsers[roomCode] = [{username,micAllowed:false}];
      console.log("room created"+roomCode);
      return res.json({ success: true, room: roomCode,users:[{username,micAllowed:false}] });
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
        roomUsers[roomCode].push({username,micAllowed:false});
        // console.log("user entered ")
        return res.json({ success: true, room: roomCode,users:roomUsers[roomCode] });
      }
      else{
        // console.log("user exists ")
        return res.json({
          success: false,
          room: null,
          msg: "User already exists",
        });
      }
    } else {
      // console.log("room not exists " + rooms)
      return res.json({
        success: false,
        room: null,
        msg: "Room does not exist",
      });
    }
  }
});

io.on("connection", (socket) => {
  // console.log("A user connected");

  socket.on("housie", (number, role, roomNo,genNums) => {
    io.emit("housie", number, roomNo,genNums,roomUsers[roomNo]);
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected");
  });

  socket.on('audioStream', (audioData,room,username) => {
    // console.log("roomUsers : ",roomUsers,"room : ",room,"user : ",roomUsers[room])
    const user = roomUsers[room].find(item => item.username === username);
    // console.log(user)
    if(user.micAllowed) socket.broadcast.emit('audioStream', audioData,room,username);
    // console.log(room+"jk")/
  });

  socket.on("entered",(role,room,username) => {
    // console.log(role,room,username)
    // console.log("users aftered entered : ",roomUsers[room])
    socket.broadcast.emit('entered', role,room,roomUsers[room]);
  })

  socket.on("win",(user,room) => {
    socket.broadcast.emit("win",user,room);
  })

  socket.on("micAllowed",(username,room,isAllowed) => {
    // console.log("room: "+room,"users: "+roomUsers[room])
    roomUsers[room] = roomUsers[room].map(user => user.username === username ? ({...user,micAllowed:isAllowed}) : user)
    socket.broadcast.emit("micAllowed",username,room,isAllowed);
  })

  socket.on("exit",(user,room,role) => {
    if(role === "host"){
      rooms = rooms.filter(roomNo => roomNo != room);
      delete roomUsers[room];
    }
    else if(role === "guest"){
      // console.log(roomUsers[room])
      roomUsers = {...roomUsers,[room]:roomUsers[room]?.filter(item => user != item.username)}; // modifying.....
      // console.log("after exiting ",roomUsers[room])
    }
    socket.broadcast.emit("exit",roomUsers[room],room,role);
    // console.log("username : "+user,"room : "+room +" exited")
  })

});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
