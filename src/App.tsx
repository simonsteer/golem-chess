import React, { useState, useRef, useCallback } from 'react'
import Chess from './Chess'
import './App.css'
import { Deployment, Coords } from 'automaton'
import { useEffectOnce } from 'react-use'
import Tile from './components/Tile'
import Grid from './components/Grid'
import { ChessTeam } from './Chess/teams'
import ChessPiece from './Chess/units/ChessPiece'
import * as Units from './Chess/units'
import { ChessBoard } from './Chess/grids'

const { King, Pawn, ...PromotionUnits } = Units

function useForceUpdate() {
  const forceUpdate = useState<{}>()[1]
  return () => forceUpdate({})
}

function App() {
  const battle = useRef(new Chess()).current
  const forceUpdate = useForceUpdate()
  const [highlightedCoords, setHighlightedCoords] = useState<string[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Deployment>()
  const [optionsMenuType, setOptionsMenuType] = useState<
    'midgame' | 'promotion' | 'endgame'
  >('midgame')

  useEffectOnce(() => {
    const handleUnitMovement = (deployment: Deployment) => {
      const isPawn = (deployment.unit as ChessPiece).type === 'pawn'
      const isAtEndOfBoard =
        { white: 0, black: 7 }[(deployment.unit.team as ChessTeam).type] ===
        deployment.coordinates.y

      setOptionsMenuType(isPawn && isAtEndOfBoard ? 'promotion' : 'midgame')
    }

    const handleGameOver = () => {
      setOptionsMenuType('endgame')
    }

    battle.setupListeners()
    battle.grid.events.on('unitMovement', handleUnitMovement)
    battle.grid.events.on('unitsDeployed', forceUpdate)
    battle.grid.events.on('unitsWithdrawn', forceUpdate)
    battle.events.on('nextTurn', forceUpdate)
    battle.events.on('battleEnd', handleGameOver)

    if (battle.turnIndex < 0) {
      battle.nextTurn()
    }

    return () => {
      battle.teardownListeners()
      battle.grid.events.off('unitMovement', handleUnitMovement)
      battle.grid.events.off('unitsDeployed', forceUpdate)
      battle.grid.events.off('unitsWithdrawn', forceUpdate)
      battle.events.off('nextTurn', forceUpdate)
      battle.events.off('battleEnd', handleGameOver)
    }
  })

  const handleClickTile = useCallback(
    ({
      deployment,
      isOnActiveTeam,
      coords,
      isHighlighted,
      reachableCoords,
    }: {
      isOnActiveTeam: boolean
      deployment: Deployment | undefined
      coords: Coords
      isHighlighted: boolean
      reachableCoords: string[]
    }) => {
      if (isHighlighted && selectedUnit) {
        const otherUnit = battle.grid
          .getDeployments()
          .find(p => p.coordinates.hash === coords.hash)?.unit

        if (otherUnit) battle.grid.withdrawUnit(otherUnit.id)
        selectedUnit.move([coords])

        setSelectedUnit(undefined)
        setHighlightedCoords([])

        battle.nextTurn()

        return
      }
      if (
        (selectedUnit && selectedUnit.unit.id === deployment?.unit.id) ||
        !isOnActiveTeam
      ) {
        setSelectedUnit(undefined)
      } else {
        setSelectedUnit(deployment)
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

                const pawn = (battle.grid as ChessBoard).lastTouchedDeployment!
                const unit = new PromotedUnit(pawn.unit.team as ChessTeam)

                battle.grid.withdrawUnit(pawn.unit.id)
                battle.grid.deployUnit(unit, pawn.coordinates.raw)
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
  }, [
    optionsMenuType,
    battle.grid,
    activeTeam,
    (battle.grid as ChessBoard).lastTouchedDeployment,
  ])

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
          const deployment = battle.grid
            .getDeployments()
            .find(p => p.coordinates.hash === coords.hash)

          const isOnActiveTeam =
            !!deployment && deployment.unit.team.id === activeTeam?.id

          const reachableCoords = isOnActiveTeam
            ? (deployment!.unit as ChessPiece).getLegalMoves(deployment!)
            : []
          const isHighlighted = highlightedCoords.includes(coords.hash)

          return (
            <Tile
              unit={deployment?.unit}
              isOnActiveTeam={isOnActiveTeam}
              isSelected={
                selectedUnit
                  ? selectedUnit.unit.id === deployment?.unit.id
                  : false
              }
              isHighlighted={isHighlighted}
              onMouseEnter={() => {
                if (!selectedUnit) setHighlightedCoords(reachableCoords)
              }}
              onClick={() =>
                handleClickTile({
                  isOnActiveTeam,
                  deployment,
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
