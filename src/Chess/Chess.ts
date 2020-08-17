import { BattleManager, Pathfinder, Coords, TileEvents } from 'automaton'
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

  setupListeners() {
    this.grid.graph[0][0].tile.events.on('unitStop', this.handleEnPassant)
    this.grid.graph[0][0].tile.events.on('unitStop', this.handlePromotePawn)
    this.events.on('actionableUnitChanged', this.handleUpdateUnit)
  }

  teardownListeners() {
    this.grid.graph[0][0].tile.events.off('unitStop', this.handleEnPassant)
    this.grid.graph[0][0].tile.events.off('unitStop', this.handlePromotePawn)
    this.events.off('actionableUnitChanged', this.handleUpdateUnit)
  }

  getEnPassantCoords = (pathfinderA: Pathfinder) => {
    const unitA = pathfinderA.unit as ChessPiece
    const pathfinderB = this.lastTouchedPathfinder
    const unitB = pathfinderB?.unit as ChessPiece | undefined

    if (unitA.is('pawn') && unitB?.is('pawn')) {
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
      (pathfinder.unit as ChessPiece).is('pawn') &&
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
          unitAtCoords.is('pawn') &&
          unitAtCoords.moves === 1
        ) {
          this.grid.removeUnits([unitAtCoords.id])
        }
      }
    }
  }

  handlePromotePawn: TileEvents['unitStop'] = pathfinder => {
    if ((pathfinder.unit as ChessPiece).type !== 'pawn') {
      return
    }
    const checks = { white: 0, black: 7 }
    if (
      checks[(pathfinder.unit.team as ChessTeam).type] ===
      pathfinder.coordinates.y
    ) {
      console.log('promote that pawn')
    }
  }

  handleUpdateUnit = (incoming: ActionableUnit) => {
    const unit = incoming.unit as ChessPiece
    unit.moves++
    if (unit.is('pawn') && unit.moves === 1) {
      unit.movement.steps = 1
    }
  }

  getCastlingCoords = (pathfinder: Pathfinder) => {}

  reachableCoords = (actionableUnit: ActionableUnit) =>
    actionableUnit
      ? [
          ...actionableUnit.pathfinder.getReachable(),
          ...actionableUnit.pathfinder.getTargetable(),
          ...this.getEnPassantCoords(actionableUnit.pathfinder),
        ].map(c => c.hash)
      : []
}
