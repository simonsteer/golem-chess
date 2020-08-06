import ChessPiece from './ChessPiece'
import { RangeConstraint, Weapon, RangeConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const BISHOP_CONSTRAINT: RangeConstraintConfig = {
  offsets: {
    y: [[-7, 7]],
    x: [[-7, 7]],
  },
  exceptions: [({ x, y }) => Math.abs(x) === Math.abs(y)],
}

export default class Bishop extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♗' : '♝',
      weapon: new Weapon({ range: BISHOP_CONSTRAINT }),
      movement: {
        steps: 1,
        constraints: [BISHOP_CONSTRAINT],
      },
    })
  }
}
