import { Unit, UnitConfig } from 'automaton'
import { ChessTeam } from '../teams'
import { ChessPieceType } from './types'
import { CHESS_PIECE_TEXT_MAPPINGS } from './constants'

export default class ChessPiece extends Unit {
  text: string
  type: ChessPieceType
  moves = 0

  constructor({
    team,
    movement = {},
    type,
    ...restOptions
  }: Omit<UnitConfig, 'team'> & {
    team: ChessTeam
    type: ChessPieceType
  }) {
    super({
      team,
      weapon: undefined,
      movement: {
        canPassThroughUnit: pathfinder =>
          (pathfinder.unit.team as ChessTeam).type !== team.type,
        unitPassThroughLimit: 1,
        ...movement,
      },
      ...restOptions,
    })
    this.type = type
    this.text = CHESS_PIECE_TEXT_MAPPINGS[type][team.type]
  }
}
