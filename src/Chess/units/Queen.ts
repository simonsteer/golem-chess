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

export default class Queen extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♕' : '♛',
      movement: {
        steps: 7,
        constraints: QUEEN_CONSTRAINTS,
      },
    })
  }
}
