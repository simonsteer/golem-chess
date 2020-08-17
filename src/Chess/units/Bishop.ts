import ChessPiece from './ChessPiece'
import { ChessTeam } from '../teams'

export default class Bishop extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      type: 'bishop',
      team,
      movement: {
        steps: 7,
        constraints: [
          { offsets: { y: [-1], x: [-1] } },
          { offsets: { y: [1], x: [1] } },
          { offsets: { y: [-1], x: [1] } },
          { offsets: { y: [1], x: [-1] } },
        ],
      },
    })
  }
}
