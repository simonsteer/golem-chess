import ChessPiece from './ChessPiece'
import ChessTeam from '../ChessTeam'

export default class Pawn extends ChessPiece {
  moves = 0
  constructor(team: ChessTeam) {
    super({
      team,
      text: '♙',
      weapon: {
        range: {
          constraints: [
            {
              offsets: {
                y: team.type === 'black' ? [1] : [-1],
                x: [-1, 1],
              },
            },
          ],
          canPassThroughUnit: pathfinder =>
            (pathfinder.unit.team as ChessTeam).type !== team.type,
        },
      },
      movement: {
        steps: 2,
        constraints: [
          {
            offsets: {
              y: team.type === 'black' ? [1] : [-1],
              x: [0],
            },
          },
        ],
      },
    })
  }
}
