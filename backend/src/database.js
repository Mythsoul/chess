import { nanoid } from 'nanoid'

// Always use in-memory storage for development
console.log('🚀 Running in development mode with in-memory storage')

const prisma = null
export { prisma }

// Database service for chess game
class DatabaseService {
  constructor() {
    this.prisma = prisma;
    this.fallbackMode = !prisma;
    this.inMemoryUsers = new Map();
    this.inMemoryGames = new Map();
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    
    if (this.fallbackMode) {
      console.warn('⚠️  Database unavailable - running in fallback mode with in-memory storage');
    } else {
      console.log('✅ Database connected successfully');
    }
  }

  // User operations
  async createUser(userData) {
    if (this.fallbackMode) {
      const user = {
        id: `user_${this.userIdCounter++}`,
        email: userData.email,
        username: userData.username,
        avatar: userData.avatar || null,
        rating: 1200,
        gamesWon: 0,
        gamesLost: 0,
        gamesDrawn: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.inMemoryUsers.set(user.id, user);
      return user;
    }
    
    try {
      return await this.prisma.user.create({
        data: userData
      });
    } catch (error) {
      console.error('Database error, falling back to memory storage:', error);
      return this.createUser(userData); // Fallback to in-memory
    }
  }

  async getUserById(id) {
    if (this.fallbackMode) {
      return this.inMemoryUsers.get(id) || null;
    }
    
    try {
      return await this.prisma.user.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async getUserByEmail(email) {
    if (this.fallbackMode) {
      for (const user of this.inMemoryUsers.values()) {
        if (user.email === email) {
          return user;
        }
      }
      return null;
    }
    
    try {
      return await this.prisma.user.findUnique({
        where: { email }
      });
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  // Game operations
  async createGame(whitePlayerId, blackPlayerId) {
    const route = nanoid(10);
    
    if (this.fallbackMode) {
      const whitePlayer = this.inMemoryUsers.get(whitePlayerId);
      const blackPlayer = this.inMemoryUsers.get(blackPlayerId);
      
      const game = {
        id: `game_${this.gameIdCounter++}`,
        route,
        whiteId: whitePlayerId,
        blackId: blackPlayerId,
        pgn: "",
        fen: null,
        result: null,
        status: "active",
        timeControl: "10+0",
        endReason: null,
        winnerId: null,
        moves: [],
        startedAt: new Date(),
        endedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        whitePlayer,
        blackPlayer
      };
      
      this.inMemoryGames.set(game.id, game);
      return game;
    }
    
    try {
      return await this.prisma.game.create({
        data: {
          route,
          whiteId: whitePlayerId,
          blackId: blackPlayerId,
          pgn: "",
          moves: [],
          status: "active"
        },
        include: {
          whitePlayer: true,
          blackPlayer: true
        }
      });
    } catch (error) {
      console.error('Database error, falling back to memory storage:', error);
      this.fallbackMode = true;
      return this.createGame(whitePlayerId, blackPlayerId);
    }
  }

  async getGameById(id) {
    if (this.fallbackMode) {
      return this.inMemoryGames.get(id) || null;
    }
    
    try {
      return await this.prisma.game.findUnique({
        where: { id },
        include: {
          whitePlayer: true,
          blackPlayer: true
        }
      });
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async getGameByRoute(route) {
    if (this.fallbackMode) {
      for (const game of this.inMemoryGames.values()) {
        if (game.route === route) {
          return game;
        }
      }
      return null;
    }
    
    try {
      return await this.prisma.game.findUnique({
        where: { route },
        include: {
          whitePlayer: true,
          blackPlayer: true
        }
      });
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async updateGame(id, updateData) {
    if (this.fallbackMode) {
      const game = this.inMemoryGames.get(id);
      if (game) {
        Object.assign(game, updateData, { updatedAt: new Date() });
        return game;
      }
      return null;
    }
    
    try {
      return await this.prisma.game.update({
        where: { id },
        data: updateData,
        include: {
          whitePlayer: true,
          blackPlayer: true
        }
      });
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async endGame(id, result, endReason, winnerId = null) {
    if (this.fallbackMode) {
      const game = this.inMemoryGames.get(id);
      if (game) {
        game.status = "completed";
        game.result = result;
        game.endReason = endReason;
        game.winnerId = winnerId;
        game.endedAt = new Date();
        game.updatedAt = new Date();
        
        // Update player stats in memory
        if (winnerId) {
          const winner = this.inMemoryUsers.get(winnerId);
          const loserId = winnerId === game.whiteId ? game.blackId : game.whiteId;
          const loser = this.inMemoryUsers.get(loserId);
          
          if (winner) winner.gamesWon++;
          if (loser) loser.gamesLost++;
        } else {
          // Draw
          const whitePlayer = this.inMemoryUsers.get(game.whiteId);
          const blackPlayer = this.inMemoryUsers.get(game.blackId);
          
          if (whitePlayer) whitePlayer.gamesDrawn++;
          if (blackPlayer) blackPlayer.gamesDrawn++;
        }
        
        return game;
      }
      return null;
    }
    
    try {
      const updateData = {
        status: "completed",
        result,
        endReason,
        winnerId,
        endedAt: new Date()
      };

      const game = await this.prisma.game.update({
        where: { id },
        data: updateData,
        include: {
          whitePlayer: true,
          blackPlayer: true
        }
      });

      // Update player stats
      if (winnerId) {
        await this.prisma.user.update({
          where: { id: winnerId },
          data: { gamesWon: { increment: 1 } }
        });
        
        const loserId = winnerId === game.whiteId ? game.blackId : game.whiteId;
        await this.prisma.user.update({
          where: { id: loserId },
          data: { gamesLost: { increment: 1 } }
        });
      } else {
        // Draw - increment draws for both players
        await this.prisma.user.updateMany({
          where: {
            id: { in: [game.whiteId, game.blackId] }
          },
          data: { gamesDrawn: { increment: 1 } }
        });
      }

      return game;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async getActiveGamesForUser(userId) {
    if (this.fallbackMode) {
      const games = [];
      for (const game of this.inMemoryGames.values()) {
        if (game.status === "active" && (game.whiteId === userId || game.blackId === userId)) {
          games.push(game);
        }
      }
      return games;
    }
    
    try {
      return await this.prisma.game.findMany({
        where: {
          AND: [
            { status: "active" },
            {
              OR: [
                { whiteId: userId },
                { blackId: userId }
              ]
            }
          ]
        },
        include: {
          whitePlayer: true,
          blackPlayer: true
        }
      });
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async getUserGameHistory(userId, limit = 50) {
    if (this.fallbackMode) {
      const games = [];
      for (const game of this.inMemoryGames.values()) {
        if (game.whiteId === userId || game.blackId === userId) {
          games.push(game);
        }
      }
      return games.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    }
    
    try {
      return await this.prisma.game.findMany({
        where: {
          OR: [
            { whiteId: userId },
            { blackId: userId }
          ]
        },
        include: {
          whitePlayer: true,
          blackPlayer: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async addMoveToGame(gameId, move) {
    if (this.fallbackMode) {
      const game = this.inMemoryGames.get(gameId);
      if (game) {
        const moves = Array.isArray(game.moves) ? game.moves : [];
        moves.push(move);
        game.moves = moves;
        game.fen = move.fen || null;
        game.pgn = move.pgn || game.pgn;
        game.updatedAt = new Date();
        return game;
      }
      return null;
    }
    
    try {
      const game = await this.getGameById(gameId);
      if (!game) return null;
      
      const moves = Array.isArray(game.moves) ? game.moves : [];
      moves.push(move);
      
      return await this.updateGame(gameId, {
        moves,
        fen: move.fen || null,
        pgn: move.pgn || game.pgn
      });
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }
  
  async deleteGame(gameId) {
    if (this.fallbackMode) {
      const deleted = this.inMemoryGames.delete(gameId);
      console.log(`Deleted game ${gameId} from memory:`, deleted);
      return deleted;
    }
    
    try {
      await this.prisma.game.delete({
        where: { id: gameId }
      });
      console.log(`Deleted game ${gameId} from database`);
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  }
}

const db = new DatabaseService();

export { db };
export default prisma
