import React, { useState } from 'react'
import Chess from './Chess'
import './App.css'
import { Coords, Pathfinder } from 'automaton'
import ChessPiece from './Chess/units/ChessPiece'
import ChessTeam from './Chess/ChessTeam'

const chess = new Chess()

function App() {
  const [state, setState] = useState(chess.start())
  const [highlightedCoords, setHighlightedCoords] = useState<string[]>([])

  return (
    <div className="App">
      {chess.board.graph.map((row, y) => (
        <div
          className="row"
          key={`row-${y}`}
          style={{ display: 'flex', flexDirection: 'row' }}
        >
          {row.map((tile, x) => {
            const pathfinder:
              | Pathfinder
              | undefined = chess.board
              .getPathfinders()
              .find(
                pathfinder =>
                  pathfinder.coordinates.hash === Coords.hash({ x, y })
              )

            const unit: ChessPiece | undefined = pathfinder?.unit

            return (
              <div
                key={`tile-${x}`}
                className={[
                  pathfinder ? 'clickable' : undefined,
                  highlightedCoords.includes(Coords.hash({ x, y }))
                    ? 'highlighted'
                    : undefined,
                  'tile',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (pathfinder) {
                    const reachable = pathfinder.getReachable()
                    setHighlightedCoords(reachable.map(c => c.hash))
                  }
                }}
              >
                {!!unit && (
                  <p className={`unit-${(unit.team as ChessTeam).type}`}>
                    {unit.text}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default App
