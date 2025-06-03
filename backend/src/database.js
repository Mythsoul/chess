import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database service for chess game
class DatabaseService {
  constructor() {
    this.prisma = prisma;
  }

  // User operations
  async createUser(userData) {
    return await this.prisma.user.create({
      data: userData
    });
  }

  async getUserById(id) {
    return await this.prisma.user.findUnique({
      where: { id }
    });
  }

  async getUserByEmail(email) {
    return await this.prisma.user.findUnique({
      where: { email }
    });
  }

  // Game operations
  async createGame(whitePlayerId, blackPlayerId) {
    const route = nanoid(10); // Generate unique route
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
  }

  async getGameById(id) {
    return await this.prisma.game.findUnique({
      where: { id },
      include: {
        whitePlayer: true,
        blackPlayer: true
      }
    });
  }

  async getGameByRoute(route) {
    return await this.prisma.game.findUnique({
      where: { route },
      include: {
        whitePlayer: true,
        blackPlayer: true
      }
    });
  }

  async updateGame(id, updateData) {
    return await this.prisma.game.update({
      where: { id },
      data: updateData,
      include: {
        whitePlayer: true,
        blackPlayer: true
      }
    });
  }

  async endGame(id, result, endReason, winnerId = null) {
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
  }

  async getActiveGamesForUser(userId) {
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
  }

  async getUserGameHistory(userId, limit = 50) {
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
  }

  async addMoveToGame(gameId, move) {
    const game = await this.getGameById(gameId);
    const moves = Array.isArray(game.moves) ? game.moves : [];
    moves.push(move);
    
    return await this.updateGame(gameId, {
      moves,
      fen: move.fen || null
    });
  }
}

const db = new DatabaseService();

export { db };
export default prisma
