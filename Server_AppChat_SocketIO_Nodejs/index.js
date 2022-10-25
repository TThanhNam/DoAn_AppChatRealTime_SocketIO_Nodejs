const express = require('express')
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var port = 3000;

app.use(express.static("./Client"))
app.set("view engine", "ejs")
app.set("views", "./Client")

//send OTP
const accountSid = 'AC1ba556e19b38be6d32a41b14a20f90c2'; 
const authToken = '1f07bc14d8d9a2f09c8d404320c081f5'; 
const client = require('twilio')(accountSid, authToken); 

const AWS = require("aws-sdk");
const { json } = require('express');
const config = new AWS.Config({
  accessKeyId: "AKIARVHNIIHQUROPKA7N",
  secretAccessKey: "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",
  region: "ap-southeast-1"
});
AWS.config = config

const docClient = new AWS.DynamoDB.DocumentClient()

var listUser = {};
var params = {
  TableName : "User"
}
docClient.scan(params, (err,lsUser) => {
  listUser = lsUser
})

//-------render trang chu
app.get("/", (req,res) =>{
  return res.render("DangNhap")
})


io.sockets.on("connection", function(socket){
  console.log("có người mở app" + socket.id)

  socket.on("DangNhap", function(data){
      console.log("đăng nhập ; data : " + data)
      var user = JSON.parse(data)
      var tk = user.sdt
      var mk = user.matKhau

      var params = {
        TableName : "User"
      }
      docClient.scan(params, (err,lsUser) => {
        if(err){
          console.log(err)
        }else{
          console.log(lsUser)
          var kq =  false
          lsUser.Items.forEach(kTra);
          function kTra(i){
            var tk2 = i.sdt
            var mk2 = i.matKhau
            console.log(tk + " = " + tk2 + " / " + mk + " = " + mk2)
            if(tk == tk2){
              if(mk == mk2){
                kq = true
                console.log(tk + " = " + tk2 + " / " + mk + " = " + mk2)
                return;
              }
            }
          }
          //gọi tới địa chỉ vửa gửi lên ("DangNhap")
          socket.emit("ketQua", {noiDung : kq})
          console.log(kq)
        }
      })
  })

  socket.on("DangKy", function(data){
    console.log("Đăng ký ; data: " + data)
    console.log(listUser)
    var kq = true
    var user = JSON.parse(data)
    var sdt = user.sdt
    var matKhau = user.matKhau
    var name = user.name

    listUser.Items.forEach(kTra);
      function kTra(i){
        var tk2 = i.sdt
        var name2 = i.name
        if(sdt == tk2 || name == name2){          
           kq = false
        }
      }
    if(kq == true){
      const params = {
        TableName : "User", 
        Item : {
          sdt,
          matKhau,
          name
        }
      }
      docClient.put(params, function(err, data) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", data);
        }
      });
    }
    socket.emit("ketQua", {noiDung : kq})  
  })
  socket.on("sendOTP", function(data){
    code = JSON.parse(data)
    console.log(code.sdt)
    console.log(code.code)
    // client.messages 
    //   .create({   
    //     body: code.code,  
    //      messagingServiceSid: 'MG3f3d1acf4703afcde2e7a3ed6ba32ee2',      
    //      to: '+84' + code.sdt
    //    }) 
    //   .then(message => console.log(message.sid)) 
    //   .done();

  }) 
  socket.on("QuenMK", function(data){
    console.log("Đăng ký ; data: " + data)
    var user = JSON.parse(data)
    var sdt = user.sdt
    var matKhau = user.matKhau
    // var name = user.name
    var kq = true

    var params = {
      TableName: 'User',
      Key: {
        sdt
      }, 
      UpdateExpression: 'set matKhau = :t',
      ExpressionAttributeValues: {
        ':t' : matKhau
      }
    };
    docClient.update(params, function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", data);
      }
    });
    socket.emit("ketQua", {noiDung : kq})  
  })
    
})



// //mở kết nối phía server nodeJS
// io.sockets.on('connection', function (socket) {

//     console.log("user connect");

//     //tạo socketID cho người gửi tin nhắn

//     socket.on('login', function (data) {

//         listUser[data] = socket.id;

//         console.log("sender: " + socket.id);
        
//     });
//     //gửi message đến người nhận
//     socket.on('send_message', function(message){

//         var info = JSON.parse(message);
        
//         var receiverId = listUser[info.Receiver];
        
//         var messageData = info.Content;
        
//         socket.broadcast.to(receiverId).emit('receiver_message', {user: info.Receiver, content: messageData});
        
//         console.log("message: " + info.Receiver + " - " + messageData);
    
//     });
    
// });

//io.to(`${socketId}`).emit('hey', 'I just met you');

app.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
