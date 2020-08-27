import ChessPiece from './ChessPiece'
import { ChessTeam } from '../teams'
import { Deployment, RevocableGridModification, Coords } from 'automaton'
import { CASTLING_HASHES, CASTLING_CAPTURE_HASHES } from '../constants'
import { ChessBoard } from '../grids'

export default class King extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      type: 'king',
      team,
      movement: {
        steps: 1,
        constraints: [
          {
            offsets: {
              x: [[-1, 1]],
              y: [[-1, 1]],
            },
            exceptions: [({ x, y }) => !(x === 0 && y === 0)],
          },
        ],
        getSpecialCoordinates: (deployment: Deployment) => {
          const unit = deployment.unit as ChessPiece
          const team = unit.team as ChessTeam

          if (!unit.is('king') || unit.totalMovesPerformed !== 0) {
            return []
          }

          return unit.team
            .getDeployments(deployment.grid)
            .filter(
              p =>
                (p.unit as ChessPiece).is('rook') &&
                (p.unit as ChessPiece).totalMovesPerformed === 0
            )
            .reduce((acc, rook) => {
              const reachable = rook.getReachable()
              if (
                CASTLING_HASHES.some(hash =>
                  Coords.hashMany(reachable).includes(hash)
                )
              ) {
                acc.push(
                  ...reachable.filter(coords => {
                    if (!CASTLING_CAPTURE_HASHES.includes(coords.hash)) {
                      return false
                    }

                    const modifications = new RevocableGridModification(
                      deployment.grid,
                      [
                        {
                          type: 'moveUnit',
                          payload: [deployment.unit.id, [coords.raw]],
                        },
                      ]
                    )
                    modifications.apply()
                    const result = !team.isKingInCheck(
                      deployment.grid as ChessBoard
                    )
                    modifications.revoke()

                    return result
                  })
                )
              }
              return acc
            }, [] as Coords[])
        },
      },
    })
  }
}
