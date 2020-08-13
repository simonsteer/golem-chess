import { Unit, UnitConfig } from 'automaton'
import ChessTeam from '../ChessTeam'

export default class ChessPiece extends Unit {
  text: string
  moves = 0

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
      weapon: undefined,
      movement: {
        canPassThroughUnit: pathfinder =>
          (pathfinder.unit.team as ChessTeam).type !== team.type,
        unitPassThroughLimit: 1,
        ...movement,
      },
      ...restOptions,
    })
    this.text = text
  }
}
