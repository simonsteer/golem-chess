import {
  Grid,
  Unit,
  RawCoords,
  BattleManager,
  createSimpleGraph,
} from 'automaton'
import { Pawn, Rook, Knight, Bishop, King, Queen } from './units'
import { ChessTeam } from './teams'
import ChessBoard from './grids/ChessBoard'

export default class Chess extends BattleManager {
  constructor() {
    super(new ChessBoard())
  }
}
