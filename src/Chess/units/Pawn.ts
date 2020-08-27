import ChessPiece from './ChessPiece'
import { ChessTeam } from '../teams'
import { ChessBoard } from '../grids'
import { EN_PASSANT_HASHES } from '../constants'

export default class Pawn extends ChessPiece {
  constructor(team: ChessTeam) {
    super({
      type: 'pawn',
      team,
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
        canPassThroughUnit: () => false,
        getSpecialCoordinates: deploymentA => {
          const deploymentB = (deploymentA.grid as ChessBoard)
            .lastTouchedDeployment
          const unitB = deploymentB?.unit as ChessPiece | undefined

          if (unitB?.is('pawn') && unitB.totalMovesPerformed === 1) {
            const deltas = deploymentA.coordinates.deltas(
              deploymentB!.coordinates
            )
            const canEnPassant =
              EN_PASSANT_HASHES.includes(deploymentB!.coordinates.hash) &&
              Math.abs(deltas.x) === 1 &&
              deltas.y === 0

            if (canEnPassant) {
              const enPassantCoords = deploymentB!.coordinates.raw
              enPassantCoords.y = enPassantCoords.y === 4 ? 5 : 2

              return [enPassantCoords]
            }
          }
          return []
        },
      },
    })
  }
}
