import React, { useState, useEffect } from 'react'
import Chess from './Chess'
import './App.css'
import { Coords, Team, Pathfinder } from 'automaton'
import ChessPiece from './Chess/units/ChessPiece'
import ChessTeam from './Chess/ChessTeam'
import { ActionableUnit } from 'automaton/dist/services/BattleManager/services/TurnManager'
import Tile from './components/Tile'
import Grid from './components/Grid'

const battle = new Chess().newMatch()

function App() {
  const [highlightedCoords, setHighlightedCoords] = useState<string[]>([])
  const [actionableUnits, setActionableUnits] = useState<ActionableUnit[]>([])
  const [turnIndex, setTurnIndex] = useState(battle.turnIndex)
  const [activeTeam, setActiveTeam] = useState<Team>()
  const [graph, setGraph] = useState(battle.grid.graph)
  const [pathfinders, setPathfinders] = useState(battle.grid.getPathfinders())

  useEffect(() => {
    const updateUnit = (incoming: ActionableUnit) =>
      setActionableUnits(
        actionableUnits.map(actionable => {
          if (incoming.unit.id === actionable.unit.id) {
            return incoming
          }
          return actionable
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

    battle.on('actionableUnitChanged', updateUnit)
    battle.on('nextTurn', handleNextTurn)
    battle.grid.on('addUnits', setPathfinders)

    battle.advance()

    return () => {
      battle.off('actionableUnitChanged', updateUnit)
      battle.off('nextTurn', handleNextTurn)
      battle.grid.off('addUnits', setPathfinders)
    }
  }, [])

  const [selectedUnit, setSelectedUnit] = useState<ActionableUnit>()

  return (
    <div className="App">
      <p>{turnIndex}</p>
      <Grid
        graph={graph}
        renderItem={({ coords }) => {
          const actionableUnit = actionableUnits.find(
            actionable => actionable.pathfinder.coordinates.hash === coords.hash
          )

          return (
            <Tile
              unit={
                pathfinders.find(p => p.coordinates.hash === coords.hash)?.unit
              }
              isOnActiveTeam={!!actionableUnit}
              highlighted={highlightedCoords.includes(coords.hash)}
              onMouseEnter={() => {
                if (!actionableUnit) {
                  setHighlightedCoords([])
                  return
                }
                const reachable = actionableUnit.pathfinder.getReachable() || []
                setHighlightedCoords(reachable.map(c => c.hash))
              }}
              onClick={() => {
                setSelectedUnit(actionableUnit)
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
