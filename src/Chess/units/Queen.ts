import ChessPiece from './ChessPiece'
import { ConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const QUEEN_CONSTRAINTS: ConstraintConfig[] = [
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
      weapon: { range: { constraints: QUEEN_CONSTRAINTS } },
      text: team.type === 'white' ? '♕' : '♛',
      movement: {
        steps: 1,
        constraints: QUEEN_CONSTRAINTS,
      },
    })
  }
}
