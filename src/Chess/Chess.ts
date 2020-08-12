import {
  Grid,
  Unit,
  RawCoords,
  BattleManager,
  createSimpleGraph,
  Coords,
  mapGraph,
} from 'automaton'
import { Pawn, Rook, Knight, Bishop, King, Queen } from './units'
import ChessTeam from './ChessTeam'

const EN_PASSANT_COORDS: RawCoords[] = [
  { x: 0, y: 3 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 3, y: 3 },
  { x: 4, y: 3 },
  { x: 5, y: 3 },
  { x: 6, y: 3 },
  { x: 7, y: 3 },
  { x: 0, y: 4 },
  { x: 1, y: 4 },
  { x: 2, y: 4 },
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
  { x: 6, y: 4 },
  { x: 7, y: 4 },
]

const EN_PASSANT_HASHES = Coords.hashMany(EN_PASSANT_COORDS)

export default class Chess {
  black: ChessTeam
  white: ChessTeam
  board: Grid

  constructor() {
    this.black = new ChessTeam('black')
    this.white = new ChessTeam('white')
    this.white.changeRelationship(this.black, 'hostile')
    this.board = this.createBoard()
  }

  newMatch = () => new BattleManager(this.board)

  private createBoard = () => {
    const graph = createSimpleGraph(8)
    return new Grid({
      graph,
      units: (['white', 'black'] as const).reduce((acc, team) => {
        this.createPieces(team).forEach((row, y) => {
          acc.push(
            ...row.map((piece, x): [Unit, RawCoords] => {
              const coords =
                team === 'black'
                  ? { x, y }
                  : {
                      x: 7 - x,
                      y: 7 - y,
                    }
              return [piece, coords]
            })
          )
        })
        return acc
      }, [] as [Unit, RawCoords][]),
    })
  }

  private createPieces = (allegiance: 'black' | 'white') => {
    const team = this[allegiance]

    const pawns = Array(8)
      .fill(0)
      .map(() => new Pawn(team))

    const [rook1, rook2] = Array(2)
      .fill(0)
      .map(() => new Rook(team))

    const [knight1, knight2] = Array(2)
      .fill(0)
      .map(() => new Knight(team))

    const [bishop1, bishop2] = Array(2)
      .fill(0)
      .map(() => new Bishop(team))

    const king = new King(team)
    const queen = new Queen(team)

    return [
      [rook1, knight1, bishop1, king, queen, bishop2, knight2, rook2],
      pawns,
    ]
  }
}
