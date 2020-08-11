import ChessPiece from './ChessPiece'
import { ConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const KNIGHT_CONSTRAINT: ConstraintConfig = {
  offsets: {
    y: [-2, -1, 1, 2],
    x: [-2, -1, 1, 2],
  },
  exceptions: [({ x, y }) => Math.abs(x) !== Math.abs(y)],
}

export default class Knight extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♘' : '♞',
      weapon: { range: { constraints: [KNIGHT_CONSTRAINT] } },
      movement: {
        steps: 1,
        constraints: [KNIGHT_CONSTRAINT],
      },
    })
  }
}
