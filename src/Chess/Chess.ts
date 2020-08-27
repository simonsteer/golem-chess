import {
  Battle,
  Pathfinder,
  Coords,
  RevocableGridModification,
  Team,
  GridModifications,
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
import { ChessPieceType } from './units/types'

export default class Chess extends Battle {
  winningTeam: 'White' | 'Black' | 'Neither team' = 'Neither team'
  gameEndReason:
    | 'Checkmate'
    | 'Stalemate'
    | 'Insufficient mating material'
    | 'Draw'
    | 'Both players resigned' = 'Stalemate'
  lastTouchedPathfinder?: Pathfinder

  constructor() {
    super(new ChessBoard())
    this.endCondition = this.getDidEnd
  }

  private createGetPathfinderIs = <K extends ChessPieceType>(type: K) => (
    pathfinder: Pathfinder
  ) => (pathfinder.unit as ChessPiece).is(type)

  private getDoesTeamHaveInsufficientMatingMaterial = (
    battle: Battle,
    team: Team
  ) => {
    const pathfinders = team.getPathfinders(battle.grid)
    if (pathfinders.some(this.createGetPathfinderIs('pawn'))) {
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

  private getDidEnd = (battle: Battle) => {
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
    this.grid.events.on('unitMovement', this.handleUnitMovement)
  }

  teardownListeners() {
    this.grid.events.off('unitMovement', this.handleUnitMovement)
  }

  handleUnitMovement = (pathfinder: Pathfinder) => {
    this.handleCastling(pathfinder)
    this.handleEnPassant(pathfinder)
    this.handleUpdateUnit(pathfinder)
  }

  // TODO: calc of "special" tiles like this should belong to a Unit or its movement
  private getEnPassantCoords = (pathfinderA: Pathfinder) => {
    const pathfinderB = this.lastTouchedPathfinder
    const unitB = pathfinderB?.unit as ChessPiece | undefined

    if (
      this.createGetPathfinderIs('pawn')(pathfinderA) &&
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

  private handleEnPassant = (pathfinder: Pathfinder) => {
    if (
      this.createGetPathfinderIs('pawn')(pathfinder) &&
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

  // TODO: move this into BattleManager or TurnManager
  private handleUpdateUnit = (incoming: Pathfinder) => {
    const unit = incoming.unit as ChessPiece
    unit.totalMovesPerformed++
    if (unit.is('pawn') && unit.totalMovesPerformed === 1) {
      unit.movement.steps = 1
    }
    this.lastTouchedPathfinder = incoming
  }

  // TODO: calc of "special" tiles like this should belong to a Unit or its movement
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

              const modifications = new RevocableGridModification(this.grid, [
                {
                  type: 'moveUnit',
                  payload: [pathfinder.unit.id, [coords.raw]],
                },
              ])
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

  private handleCastling = (pathfinder: Pathfinder) => {
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
      const otherPathfinder = this.grid.getData(coord)?.pathfinder

      const modification = new RevocableGridModification(
        this.grid,
        [
          otherPathfinder
            ? { type: 'removeUnit', payload: otherPathfinder.unit.id }
            : undefined,
          { type: 'moveUnit', payload: [pathfinder.unit.id, [coord]] },
        ].filter(Boolean) as GridModifications
      )
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
