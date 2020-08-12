import ChessPiece from './ChessPiece'
import { ConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const KING_CONSTRAINT: ConstraintConfig = {
  offsets: {
    x: [[-1, 1]],
    y: [[-1, 1]],
  },
  exceptions: [({ x, y }) => !(x === 0 && y === 0)],
}

export default class King extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♔' : '♚',
      weapon: {
        range: { constraints: [KING_CONSTRAINT] },
      },
      movement: {
        steps: 1,
        constraints: [
          { offsets: { x: [-1], y: [-1] } },
          { offsets: { x: [-1], y: [1] } },
          { offsets: { x: [0], y: [-1] } },
          { offsets: { x: [0], y: [1] } },
          { offsets: { x: [1], y: [1] } },
          { offsets: { x: [1], y: [-1] } },
          { offsets: { x: [-1], y: [0] } },
          { offsets: { x: [1], y: [0] } },
        ],
        canPassThroughUnit: pathfinder =>
          (pathfinder.unit.team as ChessTeam).type !== team.type,
        unitPassThroughLimit: 1,
      },
    })
  }
}
