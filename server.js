const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

// 정적 파일 제공
app.use(express.static('public'));

// 깃발 데이터 로드 또는 초기화
let flags = [];
const dataFile = path.join(__dirname, 'flags.json');

if (fs.existsSync(dataFile)) {
  const data = fs.readFileSync(dataFile, 'utf8');
  flags = JSON.parse(data);
} else {
  // 1000개의 깃발 초기화
  for (let i = 0; i < 1000; i++) {
    flags.push({
      id: i,
      owner: null, // 소유자 팀 색상
      x: Math.random() * 2000, // 맵 내 랜덤 위치
      y: Math.random() * 2000,
    });
  }
  fs.writeFileSync(dataFile, JSON.stringify(flags));
}

io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);

  // 초기 깃발 데이터 전송
  socket.emit('init flags', flags);

  // 깃발 점령 이벤트 처리
  socket.on('capture flag', (flagData) => {
    // 서버의 깃발 데이터 업데이트
    const flag = flags.find((f) => f.id === flagData.id);
    if (flag) {
      flag.owner = flagData.owner;
      // 업데이트된 깃발 데이터 저장
      fs.writeFileSync(dataFile, JSON.stringify(flags));
      // 모든 클라이언트에게 업데이트 전송
      io.emit('update flag', flag);
    }
  });

  // 채팅 메시지 수신 및 브로드캐스트
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
