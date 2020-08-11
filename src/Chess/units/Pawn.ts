import ChessPiece from './ChessPiece'
import ChessTeam from '../ChessTeam'
import { Weapon } from 'automaton'

export default class Pawn extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      team,
      text: '♙',
      weapon: {
        range: {
          offsets: {
            y: team.type === 'black' ? [1, 2] : [-1, -2],
            x: [-1, 1],
          },
        },
      },
      movement: {
        steps: 1,
        constraints: [
          {
            offsets: {
              y: team.type === 'black' ? [1, 2] : [-1, -2],
              x: [0],
            },
          },
        ],
      },
    })
  }
}
