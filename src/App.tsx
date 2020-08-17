import React, { useState, useRef, useCallback } from 'react'
import Chess from './Chess'
import './App.css'
import { Team, Pathfinder, Coords } from 'automaton'
import { useEffectOnce } from 'react-use'
import { ActionableUnit } from 'automaton/dist/services/BattleManager/services/TurnManager'
import Tile from './components/Tile'
import Grid from './components/Grid'
import { ChessTeam } from './Chess/teams'

function App() {
  const battle = useRef(new Chess()).current
  const [highlightedCoords, setHighlightedCoords] = useState<string[]>([])
  const [actionableUnits, setActionableUnits] = useState<ActionableUnit[]>([])
  const [turnIndex, setTurnIndex] = useState(battle.turnIndex)
  const [activeTeam, setActiveTeam] = useState<Team>()
  const [pathfinders, setPathfinders] = useState(battle.grid.getPathfinders())
  const [selectedUnit, setSelectedUnit] = useState<ActionableUnit>()

  useEffectOnce(() => {
    const updateUnit = (incoming: ActionableUnit) =>
      setPathfinders(pathfinders =>
        pathfinders.map(pathfinder => {
          if (pathfinder.unit.id === incoming.unit.id) {
            return incoming.pathfinder
          }
          return pathfinder
        })
      )
    const handleNextTurn = ({
      actionableUnits,
      team,
      turnIndex,
    }: {
      actionableUnits: ActionableUnit[]
      team: Team
      turnIndex: number
    }) => {
      setActionableUnits(actionableUnits)
      setTurnIndex(turnIndex)
      setActiveTeam(team)
    }
    const handleAddUnits = (incoming: Pathfinder[]) =>
      setPathfinders(pathfinders => [...incoming, ...pathfinders])
    const handleRemoveUnits = (unitIds: Symbol[]) =>
      setPathfinders(pathfinders =>
        pathfinders.filter(pathfinder => !unitIds.includes(pathfinder.unit.id))
      )

    battle.setupListeners()
    battle.events.on('actionableUnitChanged', updateUnit)
    battle.events.on('nextTurn', handleNextTurn)
    battle.grid.events.on('addUnits', handleAddUnits)
    battle.grid.events.on('removeUnits', handleRemoveUnits)

    if (battle.turnIndex < 0) {
      battle.advance()
    }

    return () => {
      battle.teardownListeners()
      battle.events.off('actionableUnitChanged', updateUnit)
      battle.events.off('nextTurn', handleNextTurn)
      battle.grid.events.off('addUnits', handleAddUnits)
      battle.grid.events.off('removeUnits', handleRemoveUnits)
    }
  })

  const handleClickTile = useCallback(
    ({
      actionableUnit,
      coords,
      isHighlighted,
      reachableCoords,
    }: {
      actionableUnit: ActionableUnit | undefined
      coords: Coords
      isHighlighted: boolean
      reachableCoords: string[]
    }) => {
      if (isHighlighted && selectedUnit) {
        const otherUnit = pathfinders.find(
          p => p.coordinates.hash === coords.hash
        )?.unit

        if (otherUnit) battle.grid.removeUnits([otherUnit.id])
        selectedUnit.actions.move([coords])

        setSelectedUnit(undefined)
        setHighlightedCoords([])

        battle.advance()

        return
      }
      if (selectedUnit && selectedUnit.unit.id === actionableUnit?.unit.id) {
        setSelectedUnit(undefined)
      } else {
        setSelectedUnit(actionableUnit)
        setHighlightedCoords(reachableCoords)
      }
    },
    [setSelectedUnit, selectedUnit, setHighlightedCoords, pathfinders, battle]
  )

  return (
    <div className="App">
      <div className="info">
        <p>Turn: {Math.floor(turnIndex / 2)}</p>
        <p>{activeTeam ? `${(activeTeam as ChessTeam).type} to move` : ''}</p>
      </div>
      <Grid
        graph={battle.grid.graph}
        renderItem={({ coords }) => {
          const pathfinder = pathfinders.find(
            p => p.coordinates.hash === coords.hash
          )
          const actionableUnit = actionableUnits.find(
            actionable => actionable.pathfinder.coordinates.hash === coords.hash
          )
          const reachableCoords = actionableUnit
            ? battle.reachableCoords(actionableUnit)
            : []
          const isHighlighted = highlightedCoords.includes(coords.hash)

          return (
            <Tile
              unit={pathfinder?.unit}
              isOnActiveTeam={!!actionableUnit}
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
                  isHighlighted,
                  actionableUnit,
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
    </div>
  )
}

export default App
