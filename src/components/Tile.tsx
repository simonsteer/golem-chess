import React from 'react'
import { Unit } from 'automaton'
import ChessPiece from '../Chess/units/ChessPiece'
import ChessTeam from '../Chess/ChessTeam'

export default function Tile({
  isOnActiveTeam,
  unit,
  highlighted,
  ...divProps
}: {
  unit?: Unit
  isOnActiveTeam: boolean
  highlighted: boolean
} & JSX.IntrinsicElements['div']) {
  return (
    <div
      {...divProps}
      className={[
        isOnActiveTeam ? 'clickable' : undefined,
        highlighted ? 'highlighted' : undefined,
        'tile',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {unit && (
        <p className={`unit-${(unit.team as ChessTeam).type}`}>
          {(unit as ChessPiece).text}
        </p>
      )}
    </div>
  )
}
