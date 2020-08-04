import { RangeConstraint, Weapon } from 'automaton'
import ChessPiece from './ChessPiece'
import ChessTeam from '../ChessTeam'

const ROOK_CONSTRAINT = new RangeConstraint({
  offsets: {
    y: [[-7, 7]],
    x: [[-7, 7]],
  },
  exceptions: [({ x, y }) => !((x === 0 && y === 0) || (x !== 0 && y !== 0))],
})
export default class Rook extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♖' : '♜',
      weapon: new Weapon({ range: ROOK_CONSTRAINT }),
      movement: {
        steps: 1,
        range: ROOK_CONSTRAINT,
      },
    })
  }
}
