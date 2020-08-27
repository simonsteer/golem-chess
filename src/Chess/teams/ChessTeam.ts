import { Team, Unit, RawCoords, Grid } from 'automaton'
import { Pawn, Rook, Knight, Bishop, King, Queen } from '../units'
import ChessBoard from '../grids/ChessBoard'
import Chess from '..'
import ChessPiece from '../units/ChessPiece'

export default class ChessTeam extends Team {
  type: 'black' | 'white'

  constructor(type: ChessTeam['type']) {
    super()
    this.type = type
  }

  createPieces = () => {
    const pawns = Array(8)
      .fill(0)
      .map(() => new Pawn(this))

    const [rook1, rook2] = Array(2)
      .fill(0)
      .map(() => new Rook(this))

    const [knight1, knight2] = Array(2)
      .fill(0)
      .map(() => new Knight(this))

    const [bishop1, bishop2] = Array(2)
      .fill(0)
      .map(() => new Bishop(this))

    const king = new King(this)
    const queen = new Queen(this)

    return [
      [rook1, knight1, bishop1, king, queen, bishop2, knight2, rook2],
      pawns,
    ].reduce((acc, row, y) => {
      acc.push(
        ...row.map((piece, x): [Unit, RawCoords] => {
          const coords =
            this.type === 'black'
              ? { x, y }
              : {
                  x: 7 - x,
                  y: 7 - y,
                }
          return [piece, coords]
        })
      )
      return acc
    }, [] as [Unit, RawCoords][])
  }

  isInStaleMate = (grid: ChessBoard) =>
    grid.teams[this.type]
      .getDeployments(grid)
      .every(p => (p.unit as ChessPiece).getLegalMoves(p).length === 0)

  isInCheckMate = (grid: ChessBoard) =>
    this.isInStaleMate(grid) && this.isKingInCheck(grid)

  isKingInCheck = (grid: ChessBoard) => {
    const king = grid.teams[this.type]
      .getDeployments(grid)
      .find(deployment => (deployment.unit as ChessPiece).is('king'))!

    const otherTeam = (grid as ChessBoard).teams[
      this.type === 'white' ? 'black' : 'white'
    ]

    return otherTeam.getDeployments(grid).some(p => {
      const moves = [...p.getReachable(), ...p.getTargetable()].map(c => c.hash)
      return moves.includes(king.coordinates.hash)
    })
  }
}
