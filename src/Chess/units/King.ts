import ChessPiece from './ChessPiece'
import { Weapon, RangeConstraintConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

const KING_CONSTRAINT: RangeConstraintConfig = {
  offsets: {
    x: [[-1, 1]],
    y: [[-1, 1]],
  },
  exceptions: [({ x, y }) => !(x === 0 && y === 0)],
}

export default class King extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♔' : '♚',
      weapon: new Weapon({
        range: KING_CONSTRAINT,
      }),
      movement: {
        steps: 1,
        constraints: [KING_CONSTRAINT],
      },
    })
  }
}
