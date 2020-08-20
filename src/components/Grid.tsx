import React from 'react'
import { RawCoords } from 'automaton'

export default function Grid<T>({
  graph,
  renderItem,
  disabled,
  ...divProps
}: {
  graph: T[][]
  renderItem: (item: T, coords: RawCoords) => React.ReactNode
  disabled: boolean
} & JSX.IntrinsicElements['div']) {
  return (
    <div className="grid" {...divProps}>
      {graph.map((row, y) => (
        <div
          className="row"
          key={`row-${y}`}
          style={{ display: 'flex', flexDirection: 'row' }}
        >
          {row.map((item, x) => (
            <div key={`row-${y}-cell-${x}`}>{renderItem(item, { x, y })}</div>
          ))}
        </div>
      ))}
      <div className={disabled ? 'gridOverlay disabled' : 'gridOverlay'}>
        <p>select a promotion for your pawn</p>
      </div>
    </div>
  )
}
