import { Battle, Deployment, Team } from 'automaton'
import { ChessTeam } from './teams'
import { ChessBoard } from './grids'
import {
  EN_PASSANT_CAPTURE_HASHES,
  EN_PASSANT_COORDS,
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

  constructor() {
    super(new ChessBoard())
    this.endCondition = this.getDidEnd
  }

  private getDeploymentIs = <K extends ChessPieceType>(
    deployment: Deployment,
    type: K
  ) => (deployment.unit as ChessPiece).is(type)

  private getDoesTeamHaveInsufficientMatingMaterial = (
    battle: Battle,
    team: Team
  ) => {
    const deployments = team.getDeployments(battle.grid)
    if (deployments.some(d => this.getDeploymentIs(d, 'pawn'))) {
      return false
    }
    switch (deployments.length) {
      case 3:
        return (
          deployments.filter(d => this.getDeploymentIs(d, 'knight')).length ===
          2
        )
      case 2: {
        return (
          deployments.some(d => this.getDeploymentIs(d, 'bishop')) ||
          deployments.some(d => this.getDeploymentIs(d, 'knight'))
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
        team.isInCheckMate(battle.grid as ChessBoard) ||
        team.isInStaleMate(battle.grid as ChessBoard)
    )

    if (losingTeam) {
      this.winningTeam = losingTeam.type === 'white' ? 'Black' : 'White'
      this.gameEndReason = losingTeam.isInCheckMate(battle.grid as ChessBoard)
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

  private handleUnitMovement = (deployment: Deployment) => {
    this.handleCastling(deployment)
    this.handleEnPassant(deployment)
    this.handleUpdateUnit(deployment)
  }

  private handleEnPassant = (deployment: Deployment) => {
    if (
      this.getDeploymentIs(deployment, 'pawn') &&
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
    ;(this.grid as ChessBoard).lastTouchedDeployment = incoming
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
}
