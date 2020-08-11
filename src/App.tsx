import React, { useState, useRef } from 'react'
import Chess from './Chess'
import './App.css'
import { Team } from 'automaton'
import { useEffectOnce } from 'react-use'
import { ActionableUnit } from 'automaton/dist/services/BattleManager/services/TurnManager'
import Tile from './components/Tile'
import Grid from './components/Grid'
import ChessTeam from './Chess/ChessTeam'
import ChessPiece from './Chess/units/ChessPiece'

function App() {
  const battle = useRef(new Chess().newMatch())
  const [highlightedCoords, setHighlightedCoords] = useState<string[]>([])
  const [actionableUnits, setActionableUnits] = useState<ActionableUnit[]>([])
  const [turnIndex, setTurnIndex] = useState(battle.current.turnIndex)
  const [activeTeam, setActiveTeam] = useState<Team>()
  const [pathfinders, setPathfinders] = useState(
    battle.current.grid.getPathfinders()
  )

  useEffectOnce(() => {
    const updateUnit = (incoming: ActionableUnit) => {
      const isPawn = (incoming.unit as ChessPiece).text === '♙'

      setPathfinders(pathfinders =>
        pathfinders.map(pathfinder => {
          if (pathfinder.unit.id === incoming.unit.id) {
            if (isPawn && incoming.unit.movement.steps === 2) {
              incoming.unit.movement.steps = 1
            }
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
    const handleRemoveUnits = (unitIds: Symbol[]) =>
      setPathfinders(pathfinders =>
        pathfinders.filter(pathfinder => !unitIds.includes(pathfinder.unit.id))
      )

    battle.current.on('actionableUnitChanged', updateUnit)
    battle.current.on('nextTurn', handleNextTurn)
    battle.current.grid.on('addUnits', setPathfinders)
    battle.current.grid.on('removeUnits', handleRemoveUnits)

    if (battle.current.turnIndex < 0) {
      battle.current.advance()
    }

    return () => {
      battle.current.off('actionableUnitChanged', updateUnit)
      battle.current.off('nextTurn', handleNextTurn)
      battle.current.grid.off('addUnits', setPathfinders)
      battle.current.grid.off('removeUnits', handleRemoveUnits)
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
        graph={battle.current.grid.graph}
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
                  ...actionableUnit.pathfinder.getTargetable().map(c => c.hash)
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
                  const enemyUnit = pathfinders.find(
                    p => p.coordinates.hash === coords.hash
                  )?.unit
                  if (enemyUnit) battle.current.grid.removeUnits([enemyUnit.id])
                  selectedUnit.actions.move([coords])

                  setSelectedUnit(undefined)
                  setHighlightedCoords([])
                  battle.current.advance()
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
