import ChessPiece from './ChessPiece'
import { ChessTeam } from '../teams'

export default class Pawn extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      type: 'pawn',
      team,
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
