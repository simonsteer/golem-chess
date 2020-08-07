import ChessPiece from './ChessPiece'
import { RangeConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const BISHOP_CONSTRAINTS: RangeConstraintConfig[] = [
  { offsets: { y: [-1], x: [-1] } },
  { offsets: { y: [1], x: [1] } },
  { offsets: { y: [-1], x: [1] } },
  { offsets: { y: [1], x: [-1] } },
]

export default class Bishop extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♗' : '♝',
      movement: {
        steps: 7,
        constraints: BISHOP_CONSTRAINTS,
      },
    })
  }
}
