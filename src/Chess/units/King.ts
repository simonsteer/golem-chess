import ChessPiece from './ChessPiece'
import { ChessTeam } from '../teams'

export default class King extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♔' : '♚',
      movement: {
        steps: 1,
        constraints: [
          {
            offsets: {
              x: [[-1, 1]],
              y: [[-1, 1]],
            },
            exceptions: [({ x, y }) => !(x === 0 && y === 0)],
          },
        ],
      },
    })
  }
}
