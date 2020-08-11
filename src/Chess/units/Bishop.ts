import ChessPiece from './ChessPiece'
import { ConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const BISHOP_MOVEMENT_CONSTRAINTS: ConstraintConfig[] = [
  { offsets: { y: [-1], x: [-1] } },
  { offsets: { y: [1], x: [1] } },
  { offsets: { y: [-1], x: [1] } },
  { offsets: { y: [1], x: [-1] } },
]

export default class Bishop extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      weapon: {
        power: 1,
        range: { constraints: BISHOP_MOVEMENT_CONSTRAINTS },
      },
      text: team.type === 'white' ? '♗' : '♝',
      movement: {
        steps: 7,
        constraints: BISHOP_MOVEMENT_CONSTRAINTS,
      },
    })
  }
}
