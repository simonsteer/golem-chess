import {
  Grid,
  Unit,
  RawCoords,
  BattleManager,
  createSimpleGraph,
  Pathfinder,
  Coords,
  TileEvents,
} from 'automaton'
import { Pawn, Rook, Knight, Bishop, King, Queen } from './units'
import { ChessTeam } from './teams'
import ChessBoard from './grids/ChessBoard'
import {
  EN_PASSANT_HASHES,
  EN_PASSANT_CAPTURE_HASHES,
  EN_PASSANT_COORDS,
} from './constants'
import ChessPiece from './units/ChessPiece'
import { ActionableUnit } from 'automaton/dist/services/BattleManager/services/TurnManager'

export default class Chess extends BattleManager {
  constructor() {
    super(new ChessBoard())
  }

  getEnPassantCoords = (pathfinderA: Pathfinder) => {
    const unitA = pathfinderA.unit as ChessPiece
    const pathfinderB = this.lastTouchedPathfinder
    const unitB = pathfinderB?.unit as ChessPiece | undefined

    if (unitA.type === 'pawn' && unitB?.type === 'pawn') {
      const deltas = pathfinderA.coordinates.deltas(pathfinderB!.coordinates)
      const canEnPassant =
        EN_PASSANT_HASHES.includes(pathfinderB!.coordinates.hash) &&
        Math.abs(deltas.x) === 1 &&
        deltas.y === 0

      if (canEnPassant) {
        const enPassantCoords = pathfinderB!.coordinates.raw
        enPassantCoords.y = enPassantCoords.y === 4 ? 5 : 2

        return [new Coords(enPassantCoords)]
      }
    }
    return []
  }

  handleEnPassant: TileEvents['unitStop'] = pathfinder => {
    if (
      (pathfinder.unit as ChessPiece).text === '♙' &&
      EN_PASSANT_CAPTURE_HASHES.includes(pathfinder.coordinates.hash)
    ) {
      const targetCoords = EN_PASSANT_COORDS.find(
        coord =>
          coord.x === pathfinder.coordinates.x &&
          Math.abs(coord.y - pathfinder.coordinates.y) === 1
      )
      if (targetCoords) {
        const unitAtCoords = this.grid.getData(targetCoords)?.pathfinder
          ?.unit as ChessPiece | undefined

        if (
          unitAtCoords &&
          unitAtCoords.type === 'pawn' &&
          unitAtCoords.moves === 1
        ) {
          this.grid.removeUnits([unitAtCoords.id])
        }
      }
    }
  }

  reachableCoords = (actionableUnit: ActionableUnit) =>
    actionableUnit
      ? [
          ...actionableUnit.pathfinder.getReachable(),
          ...actionableUnit.pathfinder.getTargetable(),
          ...this.getEnPassantCoords(actionableUnit.pathfinder),
        ].map(c => c.hash)
      : []
}
