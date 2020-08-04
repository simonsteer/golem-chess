import { Team } from 'automaton'

export default class ChessTeam extends Team {
  type: 'black' | 'white'

  constructor(type: ChessTeam['type']) {
    super()
    this.type = type
  }
}
