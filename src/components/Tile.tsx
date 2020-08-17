import React from 'react'
import { Unit } from 'automaton'
import ChessPiece from '../Chess/units/ChessPiece'
import { ChessTeam } from '../Chess/teams'

export default function Tile({
  isOnActiveTeam,
  unit,
  isHighlighted,
  isSelected,
  ...divProps
}: {
  unit?: Unit
  isOnActiveTeam: boolean
  isHighlighted: boolean
  isSelected: boolean
} & JSX.IntrinsicElements['div']) {
  return (
    <div
      {...divProps}
      className={[
        isOnActiveTeam ? 'clickable' : undefined,
        isHighlighted ? 'highlighted' : undefined,
        isSelected ? 'selected' : undefined,
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
