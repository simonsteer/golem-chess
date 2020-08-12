import ChessPiece from './ChessPiece'
import ChessTeam from '../ChessTeam'

export default class Bishop extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♗' : '♝',
      movement: {
        steps: 7,
        constraints: [
          { offsets: { y: [-1], x: [-1] } },
          { offsets: { y: [1], x: [1] } },
          { offsets: { y: [-1], x: [1] } },
          { offsets: { y: [1], x: [-1] } },
        ],
        canPassThroughUnit: pathfinder =>
          (pathfinder.unit.team as ChessTeam).type !== team.type,
        unitPassThroughLimit: 1,
      },
    })
  }
}
