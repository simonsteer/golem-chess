import { Team, Unit, RawCoords } from 'automaton'
import { Pawn, Rook, Knight, Bishop, King, Queen } from '../units'

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
}
