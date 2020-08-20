import {
  BattleManager,
  Pathfinder,
  Coords,
  TileEvents,
  TemporaryGridModification,
} from 'automaton'
import { ChessTeam } from './teams'
import { ChessBoard } from './grids'
import {
  EN_PASSANT_HASHES,
  EN_PASSANT_CAPTURE_HASHES,
  EN_PASSANT_COORDS,
  CASTLING_HASHES,
  CASTLING_CAPTURE_HASHES,
  CASTLING_COORDS,
} from './constants'
import ChessPiece from './units/ChessPiece'
import { ActionableUnit } from 'automaton/dist/services/BattleManager/services/TurnManager'

export default class Chess extends BattleManager {
  winningTeam: 'white' | 'black' | 'neither team' = 'neither team'

  constructor() {
    super(new ChessBoard())
    this.endCondition = battle =>
      Object.values((this.grid as ChessBoard).teams).some(team => {
        const hasTeamBeenDefeated = team.getHasBeenDefeated(battle as Chess)
        if (hasTeamBeenDefeated)
          this.winningTeam = team.type === 'black' ? 'white' : 'black'
        return hasTeamBeenDefeated
      })
  }

  setupListeners() {
    this.grid.graph[0][0].tile.events.on('unitStop', this.handleCastling)
    this.grid.graph[0][0].tile.events.on('unitStop', this.handleEnPassant)
    this.events.on('actionableUnitChanged', this.handleUpdateUnit)
  }

  teardownListeners() {
    this.grid.graph[0][0].tile.events.off('unitStop', this.handleCastling)
    this.grid.graph[0][0].tile.events.off('unitStop', this.handleEnPassant)
    this.events.off('actionableUnitChanged', this.handleUpdateUnit)
  }

  getEnPassantCoords = (pathfinderA: Pathfinder) => {
    const unitA = pathfinderA.unit as ChessPiece
    const pathfinderB = this.lastTouchedPathfinder
    const unitB = pathfinderB?.unit as ChessPiece | undefined

    if (
      unitA.is('pawn') &&
      unitB?.is('pawn') &&
      unitB.totalMovesPerformed === 1
    ) {
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
          unitAtCoords.totalMovesPerformed === 1
        ) {
          this.grid.removeUnits([unitAtCoords.id])
        }
      }
    }
  }

  handlePromotePawn: TileEvents['unitStop'] = pathfinder => {
    if ((pathfinder.unit as ChessPiece).type === 'pawn') {
      if (
        { white: 0, black: 7 }[(pathfinder.unit.team as ChessTeam).type] ===
        pathfinder.coordinates.y
      ) {
        console.log('promote that pawn')
      }
    }
  }

  handleUpdateUnit = (incoming: ActionableUnit) => {
    const unit = incoming.unit as ChessPiece
    unit.totalMovesPerformed++
    if (unit.is('pawn') && unit.totalMovesPerformed === 1) {
      unit.movement.steps = 1
    }
  }

  getCastlingCoords = (pathfinder: Pathfinder) => {
    const unit = pathfinder.unit as ChessPiece
    const team = unit.team as ChessTeam

    if (!unit.is('king') || unit.totalMovesPerformed !== 0) {
      return []
    }

    return unit.team
      .getPathfinders(this.grid)
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

              const modifications = new TemporaryGridModification(this.grid, {
                move: [[pathfinder.unit.id, coords.raw]],
              })

              modifications.apply()
              const result = !team.getIsKingInCheck(this)
              modifications.revoke()

              return result
            })
          )
        }
        return acc
      }, [] as Coords[])
  }

  handleCastling: TileEvents['unitStop'] = pathfinder => {
    const unit = pathfinder.unit as ChessPiece

    if (
      unit.is('king') &&
      unit.totalMovesPerformed === 0 &&
      CASTLING_CAPTURE_HASHES.includes(pathfinder.coordinates.hash)
    ) {
      unit.team
        .getPathfinders(this.grid)
        .filter(pathfinder => (pathfinder.unit as ChessPiece).is('rook'))
        .find(rook => {
          if (
            [1, 2].includes(
              Math.abs(rook.coordinates.deltas(pathfinder.coordinates).x)
            )
          ) {
            rook.move(
              CASTLING_COORDS.filter(coords => {
                const deltas = pathfinder.coordinates.deltas(coords)
                return Math.abs(deltas.x) === 1 && deltas.y === 0
              })
            )
            return true
          }
          return false
        })
    }
  }

  getLegalMoves = (pathfinder: Pathfinder) => {
    this.events.disable()
    this.grid.events.disable()
    this.grid.mapTiles(({ tile }) => tile.events.disable())

    const moves = [
      ...pathfinder.getReachable(),
      ...pathfinder.getTargetable(),
      ...this.getEnPassantCoords(pathfinder),
      ...this.getCastlingCoords(pathfinder),
    ].filter(coord => {
      const other = this.grid.getData(coord)?.pathfinder
      const modification = new TemporaryGridModification(this.grid, {
        remove: other ? [other.unit.id] : [],
        move: [[pathfinder.unit.id, coord]],
      })

      modification.apply()
      const result = !(pathfinder.unit.team as ChessTeam).getIsKingInCheck(this)
      modification.revoke()

      return result
    })

    this.events.enable()
    this.grid.events.enable()
    this.grid.mapTiles(({ tile }) => tile.events.enable())

    return moves.map(c => c.hash)
  }
}
