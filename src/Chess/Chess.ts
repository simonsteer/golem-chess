import {
  Battle,
  Deployment,
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
  lastTouchedDeployment?: Deployment

  constructor() {
    super(new ChessBoard())
    this.endCondition = this.getDidEnd
  }

  private createGetDeploymentIs = <K extends ChessPieceType>(type: K) => (
    deployment: Deployment
  ) => (deployment.unit as ChessPiece).is(type)

  private getDoesTeamHaveInsufficientMatingMaterial = (
    battle: Battle,
    team: Team
  ) => {
    const deployments = team.getDeployments(battle.grid)
    if (deployments.some(this.createGetDeploymentIs('pawn'))) {
      return false
    }
    switch (deployments.length) {
      case 3:
        return (
          deployments.filter(this.createGetDeploymentIs('knight')).length === 2
        )
      case 2: {
        return (
          deployments.some(this.createGetDeploymentIs('bishop')) ||
          deployments.some(this.createGetDeploymentIs('knight'))
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

  handleUnitMovement = (deployment: Deployment) => {
    this.handleCastling(deployment)
    this.handleEnPassant(deployment)
    this.handleUpdateUnit(deployment)
  }

  // TODO: calc of "special" tiles like this should belong to a Unit or its movement
  private getEnPassantCoords = (deploymentA: Deployment) => {
    const deploymentB = this.lastTouchedDeployment
    const unitB = deploymentB?.unit as ChessPiece | undefined

    if (
      this.createGetDeploymentIs('pawn')(deploymentA) &&
      unitB?.is('pawn') &&
      unitB.totalMovesPerformed === 1
    ) {
      const deltas = deploymentA.coordinates.deltas(deploymentB!.coordinates)
      const canEnPassant =
        EN_PASSANT_HASHES.includes(deploymentB!.coordinates.hash) &&
        Math.abs(deltas.x) === 1 &&
        deltas.y === 0

      if (canEnPassant) {
        const enPassantCoords = deploymentB!.coordinates.raw
        enPassantCoords.y = enPassantCoords.y === 4 ? 5 : 2

        return [new Coords(enPassantCoords)]
      }
    }
    return []
  }

  private handleEnPassant = (deployment: Deployment) => {
    if (
      this.createGetDeploymentIs('pawn')(deployment) &&
      EN_PASSANT_CAPTURE_HASHES.includes(deployment.coordinates.hash)
    ) {
      const targetCoords = EN_PASSANT_COORDS.find(
        coord =>
          coord.x === deployment.coordinates.x &&
          Math.abs(coord.y - deployment.coordinates.y) === 1
      )
      if (targetCoords) {
        const unitAtCoords = this.grid.getCoordinateData(targetCoords)
          ?.deployment?.unit as ChessPiece | undefined

        if (
          unitAtCoords &&
          unitAtCoords.is('pawn') &&
          unitAtCoords.totalMovesPerformed === 1
        ) {
          this.grid.withdrawUnit(unitAtCoords.id)
        }
      }
    }
  }

  // TODO: move this into BattleManager or TurnManager
  private handleUpdateUnit = (incoming: Deployment) => {
    const unit = incoming.unit as ChessPiece
    unit.totalMovesPerformed++
    if (unit.is('pawn') && unit.totalMovesPerformed === 1) {
      unit.movement.steps = 1
    }
    this.lastTouchedDeployment = incoming
  }

  // TODO: calc of "special" tiles like this should belong to a Unit or its movement
  private getCastlingCoords = (deployment: Deployment) => {
    const unit = deployment.unit as ChessPiece
    const team = unit.team as ChessTeam

    if (!unit.is('king') || unit.totalMovesPerformed !== 0) {
      return []
    }

    return unit.team
      .getDeployments(this.grid)
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
                  payload: [deployment.unit.id, [coords.raw]],
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

  private handleCastling = (deployment: Deployment) => {
    const unit = deployment.unit as ChessPiece

    if (
      unit.is('king') &&
      unit.totalMovesPerformed === 0 &&
      CASTLING_CAPTURE_HASHES.includes(deployment.coordinates.hash)
    ) {
      unit.team
        .getDeployments(this.grid)
        .filter(deployment => (deployment.unit as ChessPiece).is('rook'))
        .find(rook => {
          if (
            [1, 2].includes(
              Math.abs(rook.coordinates.deltas(deployment.coordinates).x)
            )
          ) {
            rook.move(
              CASTLING_COORDS.filter(coords => {
                const deltas = deployment.coordinates.deltas(coords)
                return Math.abs(deltas.x) === 1 && deltas.y === 0
              })
            )
            return true
          }
          return false
        })
    }
  }

  getLegalMoves = (deployment: Deployment) => {
    this.events.disable()
    this.grid.events.disable()
    this.grid.mapTiles(({ tile }) => tile.events.disable())

    const moves = [
      ...deployment.getReachable(),
      ...deployment.getTargetable(),
      ...this.getEnPassantCoords(deployment),
      ...this.getCastlingCoords(deployment),
    ].filter(coord => {
      const otherDeployment = this.grid.getCoordinateData(coord)?.deployment

      const modification = new RevocableGridModification(
        this.grid,
        [
          otherDeployment
            ? { type: 'withdrawUnit', payload: otherDeployment.unit.id }
            : undefined,
          { type: 'moveUnit', payload: [deployment.unit.id, [coord]] },
        ].filter(Boolean) as GridModifications
      )
      modification.apply()
      const result = !(deployment.unit.team as ChessTeam).isKingInCheck(this)
      modification.revoke()

      return result
    })

    this.events.enable()
    this.grid.events.enable()
    this.grid.mapTiles(({ tile }) => tile.events.enable())

    return moves.map(c => c.hash)
  }
}
