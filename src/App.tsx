import React, { useState, useRef, useCallback } from 'react'
import Chess from './Chess'
import './App.css'
import { Team, Pathfinder, Coords, GridEvents } from 'automaton'
import { useEffectOnce } from 'react-use'
import Tile from './components/Tile'
import Grid from './components/Grid'
import { ChessTeam } from './Chess/teams'
import ChessPiece from './Chess/units/ChessPiece'
import * as Units from './Chess/units'

const { King, Pawn, ...PromotionUnits } = Units

function useForceUpdate() {
  const forceUpdate = useState()[1]
  return () => forceUpdate(undefined)
}

function App() {
  const battle = useRef(new Chess()).current
  const forceUpdate = useForceUpdate()
  const [highlightedCoords, setHighlightedCoords] = useState<string[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Pathfinder>()
  const [optionsMenuType, setOptionsMenuType] = useState<
    'midgame' | 'promotion' | 'endgame'
  >('midgame')

  useEffectOnce(() => {
    const handleUnitMovement = (pathfinder: Pathfinder) => {
      const isPawn = (pathfinder.unit as ChessPiece).type === 'pawn'
      const isAtEndOfBoard =
        { white: 0, black: 7 }[(pathfinder.unit.team as ChessTeam).type] ===
        pathfinder.coordinates.y

      setOptionsMenuType(isPawn && isAtEndOfBoard ? 'promotion' : 'midgame')
      forceUpdate()
    }

    const handleGameOver = () => {
      setOptionsMenuType('endgame')
    }

    battle.setupListeners()
    battle.grid.events.on('unitMovement', handleUnitMovement)
    battle.grid.events.on('addUnits', forceUpdate)
    battle.grid.events.on('removeUnits', forceUpdate)
    battle.events.on('nextTurn', forceUpdate)
    battle.events.on('battleEnd', handleGameOver)

    if (battle.turnIndex < 0) {
      battle.advance()
    }

    return () => {
      battle.teardownListeners()
      battle.grid.events.off('unitMovement', handleUnitMovement)
      battle.grid.events.off('addUnits', forceUpdate)
      battle.grid.events.off('removeUnits', forceUpdate)
      battle.events.off('nextTurn', forceUpdate)
      battle.events.off('battleEnd', handleGameOver)
    }
  })

  const handleClickTile = useCallback(
    ({
      pathfinder,
      isOnActiveTeam,
      coords,
      isHighlighted,
      reachableCoords,
    }: {
      isOnActiveTeam: boolean
      pathfinder: Pathfinder | undefined
      coords: Coords
      isHighlighted: boolean
      reachableCoords: string[]
    }) => {
      if (isHighlighted && selectedUnit) {
        const otherUnit = battle.grid
          .getPathfinders()
          .find(p => p.coordinates.hash === coords.hash)?.unit

        if (otherUnit) battle.grid.removeUnits([otherUnit.id])
        selectedUnit.move([coords])

        setSelectedUnit(undefined)
        setHighlightedCoords([])

        battle.advance()

        return
      }
      if (
        (selectedUnit && selectedUnit.unit.id === pathfinder?.unit.id) ||
        !isOnActiveTeam
      ) {
        setSelectedUnit(undefined)
      } else {
        setSelectedUnit(pathfinder)
        setHighlightedCoords(reachableCoords)
      }
    },
    [setSelectedUnit, selectedUnit, setHighlightedCoords, battle]
  )

  const activeTeam = battle.getActiveTeam()

  const renderOptionsMenu = useCallback(() => {
    switch (optionsMenuType) {
      case 'endgame':
        return (
          <button onClick={() => window.location.reload()}>Play again</button>
        )
      case 'midgame':
        return (
          activeTeam && (
            <>
              <button
                onClick={() =>
                  console.log(`${(activeTeam as ChessTeam).type} resigned`)
                }
              >
                Resign
              </button>
              <button
                onClick={() =>
                  console.log(
                    `${(activeTeam as ChessTeam).type} requesting a draw`
                  )
                }
              >
                Request a draw
              </button>
            </>
          )
        )
      case 'promotion':
        return Object.keys(PromotionUnits).map(key => {
          return (
            <button
              onClick={() => {
                const PromotedUnit =
                  PromotionUnits[key as keyof typeof PromotionUnits]

                const pawn = battle.lastTouchedPathfinder!
                const unit = new PromotedUnit(pawn.unit.team as ChessTeam)

                battle.grid.removeUnits([pawn.unit.id])
                battle.grid.addUnits([[unit, pawn.coordinates.raw]])
                setOptionsMenuType('midgame')
              }}
              key={key}
            >
              {key}
            </button>
          )
        })
      default:
        return null
    }
  }, [optionsMenuType, battle.grid, activeTeam, battle.lastTouchedPathfinder])

  return (
    <div className="App">
      <div className="info">
        <p>Turn: {Math.floor(battle.turnIndex / 2)}</p>
        <p>{activeTeam ? `${(activeTeam as ChessTeam).type} to move` : ''}</p>
      </div>
      <Grid
        message={
          optionsMenuType === 'endgame'
            ? `${battle.gameEndReason}! ${battle.winningTeam} wins.`
            : optionsMenuType === 'promotion'
            ? 'Select a promotion for your pawn'
            : undefined
        }
        graph={battle.grid.graph}
        renderItem={({ coords }) => {
          const pathfinder = battle.grid
            .getPathfinders()
            .find(p => p.coordinates.hash === coords.hash)

          const isOnActiveTeam =
            !!pathfinder && pathfinder.unit.team.id === activeTeam?.id

          const reachableCoords = isOnActiveTeam
            ? battle.getLegalMoves(pathfinder!)
            : []
          const isHighlighted = highlightedCoords.includes(coords.hash)

          return (
            <Tile
              unit={pathfinder?.unit}
              isOnActiveTeam={isOnActiveTeam}
              isSelected={
                selectedUnit
                  ? selectedUnit.unit.id === pathfinder?.unit.id
                  : false
              }
              isHighlighted={isHighlighted}
              onMouseEnter={() => {
                if (!selectedUnit) setHighlightedCoords(reachableCoords)
              }}
              onClick={() =>
                handleClickTile({
                  isOnActiveTeam,
                  pathfinder,
                  isHighlighted,
                  coords,
                  reachableCoords,
                })
              }
            />
          )
        }}
        onMouseLeave={() => {
          if (!selectedUnit) setHighlightedCoords([])
        }}
      />
      <div className="optionsMenu">{renderOptionsMenu()}</div>
    </div>
  )
}

export default App
