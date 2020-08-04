import ChessPiece from './ChessPiece'
import ChessTeam from '../ChessTeam'
import { Weapon, RangeConstraint } from 'automaton'

export default class Pawn extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: team.type === 'white' ? '♙' : '♟',
      weapon: new Weapon({
        range: new RangeConstraint({
          offsets: {
            y: team.type === 'black' ? [1, 2] : [-1, -2],
            x: [-1, 1],
          },
        }),
      }),
      movement: {
        steps: 1,
        range: new RangeConstraint({
          offsets: {
            y: team.type === 'black' ? [1, 2] : [-1, -2],
            x: [0],
          },
        }),
      },
    })
  }
}
