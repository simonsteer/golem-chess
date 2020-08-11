import ChessPiece from './ChessPiece'
import { RangeConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const BISHOP_MOVEMENT_CONSTRAINTS: RangeConstraintConfig[] = [
  { offsets: { y: [-1], x: [-1] } },
  { offsets: { y: [1], x: [1] } },
  { offsets: { y: [-1], x: [1] } },
  { offsets: { y: [1], x: [-1] } },
]

const BISHOP_WEAPON_CONSTRAINT: RangeConstraintConfig = {
  offsets: { y: [[-7, 7]], x: [[-7, 7]] },
  exceptions: [({ x, y }) => Math.abs(x) === Math.abs(y)],
}

export default class Bishop extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      weapon: {
        power: 1,
        range: BISHOP_WEAPON_CONSTRAINT,
      },
      text: team.type === 'white' ? '♗' : '♝',
      movement: {
        steps: 7,
        constraints: BISHOP_MOVEMENT_CONSTRAINTS,
      },
    })
  }
}
