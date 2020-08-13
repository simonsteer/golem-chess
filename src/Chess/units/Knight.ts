import ChessPiece from './ChessPiece'
import ChessTeam from '../ChessTeam'

export default class Knight extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♘' : '♞',
      movement: {
        steps: 1,
        constraints: [
          {
            offsets: {
              y: [-2, -1, 1, 2],
              x: [-2, -1, 1, 2],
            },
            exceptions: [({ x, y }) => Math.abs(x) !== Math.abs(y)],
          },
        ],
        canPassThroughUnit: pathfinder =>
          (pathfinder.unit.team as ChessTeam).type !== team.type,
        unitPassThroughLimit: 1,
      },
    })
  }
}
