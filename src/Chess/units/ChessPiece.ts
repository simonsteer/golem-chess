import {
  Unit,
  UnitConfig,
  Deployment,
  RevocableGridModification,
  GridModifications,
} from 'automaton'
import { ChessTeam } from '../teams'
import { ChessPieceType } from './types'
import { CHESS_PIECE_TEXT_MAPPINGS } from './constants'
import { ChessBoard } from '../grids'

export default class ChessPiece extends Unit {
  text: string
  type: ChessPieceType
  totalMovesPerformed = 0

  constructor({
    team,
    movement = {},
    type,
    ...restOptions
  }: Omit<UnitConfig, 'team'> & {
    team: ChessTeam
    type: ChessPieceType
  }) {
    super({
      team,
      weapon: undefined,
      movement: {
        canPassThroughUnit: deployment =>
          (deployment.unit.team as ChessTeam).type !== team.type,
        unitPassThroughLimit: 1,
        ...movement,
      },
      ...restOptions,
    })
    this.type = type
    this.text = CHESS_PIECE_TEXT_MAPPINGS[type][team.type]
  }

  is = (type: ChessPieceType) => this.type === type

  getLegalMoves = (deployment: Deployment) => {
    deployment.grid.events.disable()
    deployment.grid.mapTiles(({ tile }) => tile.events.disable())

    const moves = [
      ...deployment.getReachable(),
      ...deployment.getTargetable(),
    ].filter(coord => {
      const otherDeployment = deployment.grid.getCoordinateData(coord)
        ?.deployment

      const modification = new RevocableGridModification(
        deployment.grid,
        [
          otherDeployment
            ? {
                type: 'withdrawUnit',
                payload: otherDeployment.unit.id,
              }
            : undefined,
          {
            type: 'moveUnit',
            payload: [deployment.unit.id, [coord]],
          },
        ].filter(Boolean) as GridModifications
      )
      modification.apply()
      const result = !(deployment.unit.team as ChessTeam).isKingInCheck(
        deployment.grid as ChessBoard
      )
      modification.revoke()

      return result
    })

    deployment.grid.events.enable()
    deployment.grid.mapTiles(({ tile }) => tile.events.enable())

    return moves.map(c => c.hash)
  }
}
