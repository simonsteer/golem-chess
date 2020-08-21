import React from 'react'
import { RawCoords } from 'automaton'

export default function Grid<T>({
  graph,
  renderItem,
  message,
  ...divProps
}: {
  graph: T[][]
  renderItem: (item: T, coords: RawCoords) => React.ReactNode
  message: string | undefined
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
      <div className={message ? 'gridOverlay disabled' : 'gridOverlay'}>
        {message && <p>{message}</p>}
      </div>
    </div>
  )
}
