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

  socket.on("housie", (newHousie,currentUser) => {
    io.emit("housie", newHousie,currentUser);
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected");
  });

  socket.on('audioStream', (audioData,currentUser) => {
    if(currentUser.info.micAllowed) socket.broadcast.emit('audioStream', audioData,currentUser);
  });

  socket.on("entered",(newwHousie) => {
    socket.broadcast.emit('entered', newwHousie);
  })

  socket.on("jaldi5Complete",(currentUser) => {
    console.log(user,"jaldi5")
    socket.broadcast.emit("jaldi5",currentUser);
  })
  
  socket.on("row1Complete",(currentUser) => {
    socket.broadcast.emit("row1Complete",currentUser);
  })

  socket.on("row2Complete",(currentUser) => {
    socket.broadcast.emit("row2Complete",currentUser);
  })

  socket.on("row3Complete",(currentUser) => {
    socket.broadcast.emit("row3Complete",currentUser);
  })

  socket.on("win",(currentUser) => {
    socket.broadcast.emit("win",currentUser);
  })

  socket.on("exit",( newHousie,currentUser) => {
    if(currentUser.info.isAdmin){
      rooms = rooms.filter(roomNo => roomNo != newHousie.roomNumber);
      delete roomUsers[newHousie.roomNumber];
    }
    else{
      roomUsers = {...roomUsers,[newHousie.roomNumber]:roomUsers[newHousie.roomNumber]?.filter(item => user != item.username)}; // modifying.....
    }
    socket.broadcast.emit("exit",newHousie,currentUser);
  })

});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
