import React, { useState, useRef } from 'react'
import Chess from './Chess'
import './App.css'
import { Team } from 'automaton'
import { useEffectOnce } from 'react-use'
import { ActionableUnit } from 'automaton/dist/services/BattleManager/services/TurnManager'
import Tile from './components/Tile'
import Grid from './components/Grid'
import ChessTeam from './Chess/ChessTeam'

function App() {
  const battle = useRef(new Chess().newMatch()).current
  const [highlightedCoords, setHighlightedCoords] = useState<string[]>([])
  const [actionableUnits, setActionableUnits] = useState<ActionableUnit[]>([])
  const [turnIndex, setTurnIndex] = useState(battle.turnIndex)
  const [activeTeam, setActiveTeam] = useState<Team>()
  const [pathfinders, setPathfinders] = useState(battle.grid.getPathfinders())

  useEffectOnce(() => {
    const updateUnit = (incoming: ActionableUnit) => {
      setPathfinders(pathfinders =>
        pathfinders.map(pathfinder => {
          if (pathfinder.unit.id === incoming.unit.id) {
            return incoming.pathfinder
          }
          return pathfinder
        })
      )
    }
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

    battle.on('actionableUnitChanged', updateUnit)
    battle.on('nextTurn', handleNextTurn)
    battle.grid.on('addUnits', setPathfinders)

    if (battle.turnIndex < 0) {
      battle.advance()
    }

    return () => {
      battle.off('actionableUnitChanged', updateUnit)
      battle.off('nextTurn', handleNextTurn)
      battle.grid.off('addUnits', setPathfinders)
    }
  })

  const [selectedUnit, setSelectedUnit] = useState<ActionableUnit>()

  return (
    <div className="App">
      <div className="info">
        <p>Turn: {Math.floor(turnIndex / 2)}</p>
        <p>{activeTeam ? `${(activeTeam as ChessTeam).type} to move` : ''}</p>
      </div>
      <Grid
        graph={battle.grid.graph}
        renderItem={({ coords }) => {
          const actionableUnit = actionableUnits.find(
            actionable => actionable.pathfinder.coordinates.hash === coords.hash
          )
          const pathfinder = pathfinders.find(
            p => p.coordinates.hash === coords.hash
          )

          const reachableCoords = actionableUnit
            ? actionableUnit.pathfinder
                .getReachable()
                .map(c => c.hash)
                .concat(
                  actionableUnit.pathfinder.getTargetable().map(c => c.hash)
                )
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
              onClick={() => {
                if (isHighlighted && selectedUnit) {
                  selectedUnit.actions.move([coords])
                  setSelectedUnit(undefined)
                  setHighlightedCoords([])
                  battle.advance()
                }
                if (
                  selectedUnit &&
                  selectedUnit.unit.id === actionableUnit?.unit.id
                ) {
                  setSelectedUnit(undefined)
                } else {
                  setSelectedUnit(actionableUnit)
                  setHighlightedCoords(reachableCoords)
                }
              }}
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
