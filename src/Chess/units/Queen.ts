import ChessPiece from './ChessPiece'
import ChessTeam from '../ChessTeam'

export default class Queen extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♕' : '♛',
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
