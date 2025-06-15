# ♟️ Real-Time Chess Game

A modern, real-time multiplayer chess application built with React and Socket.IO. Play chess online with live game synchronization, user authentication, and mobile-responsive design.

## ✨ Features

- **Real-time Multiplayer** - Play chess with other players in real-time using Socket.IO
- **User Authentication** - Secure login/signup system with EasyAuth integration
- **Guest Play** - Play without creating an account
- **Game Timer System** - Configurable time controls for competitive play
- **Move History** - Track and review all moves made during the game
- **Mobile Responsive** - Optimized for both desktop and mobile devices
- **Game Controls** - Resign, offer draws, flip board, and more
- **Unique Game URLs** - Share game links with friends
- **Reconnection Support** - Automatic reconnection and game state recovery
- **Accessibility** - Keyboard navigation and ARIA labels support

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Chess.js** - Chess game logic and validation

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **Chess.js** - Server-side chess logic
- **Prisma** (Optional) - Database ORM
- **CORS** - Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or bun package manager

### Clone the Repository
```bash
git clone https://github.com/Mythsoul/chess.git
cd chess
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
# DATABASE_URL="your-database-url"
```


## 🎮 How to Play

1. **Start a Game**
   - Visit the homepage
   - Click "Find Game" to be matched with another player
   - Or play as a guest without signing up

2. **Game Controls**
   - Click and drag pieces to make moves
   - Use the control panel to resign, offer draws, or flip the board
   - View move history in the sidebar

3. **Timer System**
   - Games include configurable time controls
   - Your time decreases when it's your turn
   - Game ends if time runs out

## 🏗️ Project Structure

```
chess/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   │   ├── Chessboard.jsx
│   │   │   ├── GameControls.jsx
│   │   │   ├── MoveHistory.jsx
│   │   │   └── auth/        # Authentication components
│   │   ├── pages/           # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── GamePage.jsx
│   │   │   └── GameRoute.jsx
│   │   ├── contexts/        # React contexts
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration files
│   └── package.json
├── backend/                 # Node.js backend server
│   ├── src/                 # Backend source code
│   ├── prisma/              # Database schema (optional)
│   ├── index.js             # Main server file
│   └── package.json
└── README.md
```

## 🔌 API & Socket Events

### Socket.IO Events
- `find_game` - Join matchmaking queue
- `make_move` - Send a chess move
- `resign` - Resign from current game
- `offer_draw` - Offer a draw to opponent
- `game_update` - Receive game state updates
- `timer_update` - Receive timer updates

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

### Backend (Railway/Heroku)
```bash
cd backend
npm start
# Configure environment variables on your hosting platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Known Issues

- Database fallback system for development environments
- Mobile UI optimizations ongoing
- Timer synchronization improvements in progress

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Enjoy playing chess! ♟️**
