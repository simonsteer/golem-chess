import ChessPiece from './ChessPiece'
import { Weapon, RangeConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const KNIGHT_CONSTRAINT: RangeConstraintConfig = {
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
      weapon: new Weapon({ range: KNIGHT_CONSTRAINT }),
      movement: {
        steps: 1,
        constraints: [KNIGHT_CONSTRAINT],
      },
    })
  }
}
