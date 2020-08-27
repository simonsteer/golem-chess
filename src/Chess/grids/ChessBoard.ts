import { Grid, createSimpleGraph } from 'automaton'
import { ChessTeam } from '../teams'

export default class ChessBoard extends Grid {
  teams: { black: ChessTeam; white: ChessTeam }
  constructor() {
    super({ graph: createSimpleGraph(8) })

    const blackTeam = new ChessTeam('black')
    const whiteTeam = new ChessTeam('white').changeRelationship(
      blackTeam,
      'hostile'
    )

    this.teams = {
      black: blackTeam,
      white: whiteTeam,
    }

    this.deployUnits([
      ...this.teams.white.createPieces(),
      ...this.teams.black.createPieces(),
    ])
  }
}
