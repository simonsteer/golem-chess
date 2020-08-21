import {
  BattleManager,
  Pathfinder,
  Coords,
  TileEvents,
  TemporaryGridModification,
  Team,
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
import { ChessPieceType } from './units/types'

export default class Chess extends BattleManager {
  winningTeam: 'White' | 'Black' | 'Neither team' = 'Neither team'
  gameEndReason:
    | 'Checkmate'
    | 'Stalemate'
    | 'Insufficient mating material'
    | 'Draw'
    | 'Both players resigned' = 'Stalemate'

  constructor() {
    super(new ChessBoard())
    this.endCondition = this.getDidEnd
  }

  private createGetPathfinderIs = <K extends ChessPieceType>(type: K) => (
    pathfinder: Pathfinder
  ) => (pathfinder.unit as ChessPiece).is(type)

  /*
  If both sides have any one of the following, and there are no pawns on the board: 

A lone king 
a king and bishop
a king and knight
a king and two knights
  */
  private getDoesTeamHaveInsufficientMatingMaterial = (
    battle: BattleManager,
    team: Team
  ) => {
    const pathfinders = team.getPathfinders(battle.grid)
    if (
      pathfinders.some(this.createGetPathfinderIs('pawn')) ||
      pathfinders.length > 3
    ) {
      return false
    }
    switch (pathfinders.length) {
      case 3:
        return (
          pathfinders.filter(this.createGetPathfinderIs('knight')).length === 2
        )
      case 2: {
        return (
          pathfinders.some(this.createGetPathfinderIs('bishop')) ||
          pathfinders.some(this.createGetPathfinderIs('knight'))
        )
      }
      case 1:
        return true
      default:
        return false
    }
  }

  private getDidEnd = (battle: BattleManager) => {
    const teams = battle.grid.getTeams() as ChessTeam[]

    const teamsWithInsufficientMatingMaterial = teams.filter(team =>
      this.getDoesTeamHaveInsufficientMatingMaterial(battle, team)
    )

    switch (teamsWithInsufficientMatingMaterial.length) {
      case 2:
        this.winningTeam = 'Neither team'
        this.gameEndReason = 'Insufficient mating material'
        return true
      case 1:
        const [team] = teamsWithInsufficientMatingMaterial
        this.winningTeam = team.type === 'white' ? 'Black' : 'White'
        this.gameEndReason = 'Insufficient mating material'
        return true
      default:
        break
    }

    const losingTeam = teams.find(
      team =>
        team.isInCheckMate(battle as Chess) ||
        team.isInStaleMate(battle as Chess)
    )

    if (losingTeam) {
      this.winningTeam = losingTeam.type === 'white' ? 'Black' : 'White'
      this.gameEndReason = losingTeam.isInCheckMate(battle as Chess)
        ? 'Checkmate'
        : 'Stalemate'
      return true
    }

    return false
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

  private getEnPassantCoords = (pathfinderA: Pathfinder) => {
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

  private handleEnPassant: TileEvents['unitStop'] = pathfinder => {
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

  private handlePromotePawn: TileEvents['unitStop'] = pathfinder => {
    if ((pathfinder.unit as ChessPiece).type === 'pawn') {
      if (
        { white: 0, black: 7 }[(pathfinder.unit.team as ChessTeam).type] ===
        pathfinder.coordinates.y
      ) {
        console.log('promote that pawn')
      }
    }
  }

  private handleUpdateUnit = (incoming: ActionableUnit) => {
    const unit = incoming.unit as ChessPiece
    unit.totalMovesPerformed++
    if (unit.is('pawn') && unit.totalMovesPerformed === 1) {
      unit.movement.steps = 1
    }
  }

  private getCastlingCoords = (pathfinder: Pathfinder) => {
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
              const result = !team.isKingInCheck(this)
              modifications.revoke()

              return result
            })
          )
        }
        return acc
      }, [] as Coords[])
  }

  private handleCastling: TileEvents['unitStop'] = pathfinder => {
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
      const result = !(pathfinder.unit.team as ChessTeam).isKingInCheck(this)
      modification.revoke()

      return result
    })

    this.events.enable()
    this.grid.events.enable()
    this.grid.mapTiles(({ tile }) => tile.events.enable())

    return moves.map(c => c.hash)
  }
}
