import ChessPiece from './ChessPiece'
import { ChessTeam } from '../teams'

export default class Pawn extends ChessPiece {
  moves = 0
  constructor(team: ChessTeam) {
    super({
      team,
      text: '♙',
      weapon: {
        range: {
          constraints: [
            {
              offsets: {
                y: team.type === 'black' ? [1] : [-1],
                x: [-1, 1],
              },
            },
          ],
        },
      },
      movement: {
        steps: 2,
        constraints: [
          {
            offsets: {
              y: team.type === 'black' ? [1] : [-1],
              x: [0],
            },
          },
        ],
        canPassThroughUnit: () => false,
      },
    })
  }
}
