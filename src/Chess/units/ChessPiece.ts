import { Unit, UnitConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

export default class ChessPiece extends Unit {
  text: string

  constructor({
    team,
    movement = {},
    text,
    ...restOptions
  }: Omit<UnitConfig, 'team'> & {
    team: ChessTeam
    text: string
  }) {
    super({
      team,
      movement: { canPassThroughUnit: () => false, ...movement },
      ...restOptions,
    })
    this.text = text
  }
}
