import ChessPiece from './ChessPiece'
import { RangeConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const QUEEN_CONSTRAINTS: RangeConstraintConfig[] = [
  { offsets: { y: [-1], x: [-1] } },
  { offsets: { y: [1], x: [1] } },
  { offsets: { y: [-1], x: [1] } },
  { offsets: { y: [1], x: [-1] } },
  { offsets: { y: [0], x: [-1] } },
  { offsets: { y: [0], x: [1] } },
  { offsets: { y: [1], x: [0] } },
  { offsets: { y: [-1], x: [0] } },
]

const QUEEN_WEAPON_CONSTRAINT: RangeConstraintConfig = {
  offsets: { y: [[-7, 7]], x: [[-7, 7]] },
  exceptions: [
    ({ x, y }) =>
      Math.abs(x) === Math.abs(y) ||
      (x === 0 && y !== 0) ||
      (x !== 0 && y === 0),
  ],
}

export default class Queen extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      weapon: { range: QUEEN_WEAPON_CONSTRAINT },
      text: team.type === 'white' ? '♕' : '♛',
      movement: {
        steps: 7,
        constraints: QUEEN_CONSTRAINTS,
      },
    })
  }
}
