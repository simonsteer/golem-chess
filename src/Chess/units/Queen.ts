import ChessPiece from './ChessPiece'
import { ChessTeam } from '../teams'

export default class Queen extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      type: 'queen',
      team,
      movement: {
        steps: 7,
        constraints: [
          { offsets: { y: [-1], x: [-1] } },
          { offsets: { y: [1], x: [1] } },
          { offsets: { y: [-1], x: [1] } },
          { offsets: { y: [1], x: [-1] } },
          { offsets: { y: [0], x: [-1] } },
          { offsets: { y: [0], x: [1] } },
          { offsets: { y: [1], x: [0] } },
          { offsets: { y: [-1], x: [0] } },
        ],
      },
    })
  }
}
