import { Weapon, RangeConstraintConfig } from 'automaton'
import ChessPiece from './ChessPiece'
import ChessTeam from '../ChessTeam'

const ROOK_CONSTRAINTS: RangeConstraintConfig[] = [
  { offsets: { y: [-1], x: [0] } },
  { offsets: { y: [1], x: [0] } },
  { offsets: { y: [0], x: [1] } },
  { offsets: { y: [0], x: [-1] } },
]

export default class Rook extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♖' : '♜',
      movement: {
        steps: 7,
        constraints: ROOK_CONSTRAINTS,
      },
    })
  }
}
