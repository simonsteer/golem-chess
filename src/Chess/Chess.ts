import {
  Grid,
  Unit,
  RawCoords,
  BattleManager,
  createSimpleGraph,
  Pathfinder,
  Coords,
} from 'automaton'
import { Pawn, Rook, Knight, Bishop, King, Queen } from './units'
import { ChessTeam } from './teams'
import ChessBoard from './grids/ChessBoard'
import { EN_PASSANT_HASHES } from './constants'
import ChessPiece from './units/ChessPiece'

export default class Chess extends BattleManager {
  constructor() {
    super(new ChessBoard())
  }

  getEnPassantCoords = (pathfinderA: Pathfinder, pathfinderB: Pathfinder) => {
    const unitA = pathfinderA.unit as ChessPiece
    const unitB = pathfinderB.unit as ChessPiece

    if (unitA.type === 'pawn' && unitB.type === 'pawn') {
      const deltas = pathfinderA.coordinates.deltas(pathfinderB.coordinates)
      const canEnPassant =
        EN_PASSANT_HASHES.includes(pathfinderB.coordinates.hash) &&
        Math.abs(deltas.x) === 1 &&
        deltas.y === 0

      if (canEnPassant) {
        const enPassantCoords = pathfinderB.coordinates.raw
        enPassantCoords.y = enPassantCoords.y === 4 ? 5 : 2

        return new Coords(enPassantCoords)
      }
    }
    return undefined
  }
}
