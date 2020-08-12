import React, { useState, useRef } from 'react'
import Chess from './Chess'
import './App.css'
import { Team, RawCoords, Coords, Unit } from 'automaton'
import { useEffectOnce } from 'react-use'
import { ActionableUnit } from 'automaton/dist/services/BattleManager/services/TurnManager'
import Tile from './components/Tile'
import Grid from './components/Grid'
import ChessTeam from './Chess/ChessTeam'
import ChessPiece from './Chess/units/ChessPiece'
import { Pawn } from './Chess/units'

const PAWN_ORIGIN_COORDS: RawCoords[] = [
  { x: 0, y: 3 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 3, y: 3 },
  { x: 4, y: 3 },
  { x: 5, y: 3 },
  { x: 6, y: 3 },
  { x: 7, y: 3 },
  { x: 0, y: 4 },
  { x: 1, y: 4 },
  { x: 2, y: 4 },
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
  { x: 6, y: 4 },
  { x: 7, y: 4 },
]
const EN_PASSANT_COORDS: RawCoords[] = [
  { x: 0, y: 3 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 3, y: 3 },
  { x: 4, y: 3 },
  { x: 5, y: 3 },
  { x: 6, y: 3 },
  { x: 7, y: 3 },
  { x: 0, y: 4 },
  { x: 1, y: 4 },
  { x: 2, y: 4 },
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
  { x: 6, y: 4 },
  { x: 7, y: 4 },
]

const PAWN_ORIGIN_HASHES = Coords.hashMany(PAWN_ORIGIN_COORDS)
const EN_PASSANT_HASHES = Coords.hashMany(EN_PASSANT_COORDS)

const getIsPawn = (unit: Unit) =>
  (unit as ChessPiece).text === '♙' && (unit as Pawn)

function App() {
  const battle = useRef(new Chess().newMatch()).current
  const [highlightedCoords, setHighlightedCoords] = useState<string[]>([])
  const [actionableUnits, setActionableUnits] = useState<ActionableUnit[]>([])
  const [turnIndex, setTurnIndex] = useState(battle.turnIndex)
  const [activeTeam, setActiveTeam] = useState<Team>()
  const [pathfinders, setPathfinders] = useState(battle.grid.getPathfinders())

  useEffectOnce(() => {
    const updateUnit = (incoming: ActionableUnit) => {
      ;(incoming.unit as ChessPiece).moves++

      const pawn = getIsPawn(incoming.unit)
      if (pawn && pawn.moves === 1) {
        pawn.movement.steps = 1
      }

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
    const handleRemoveUnits = (unitIds: Symbol[]) =>
      setPathfinders(pathfinders =>
        pathfinders.filter(pathfinder => !unitIds.includes(pathfinder.unit.id))
      )

    battle.events.on('actionableUnitChanged', updateUnit)
    battle.events.on('nextTurn', handleNextTurn)
    battle.grid.events.on('addUnits', setPathfinders)
    battle.grid.events.on('removeUnits', handleRemoveUnits)

    if (battle.turnIndex < 0) {
      battle.advance()
    }

    return () => {
      battle.events.off('actionableUnitChanged', updateUnit)
      battle.events.off('nextTurn', handleNextTurn)
      battle.grid.events.off('addUnits', setPathfinders)
      battle.grid.events.off('removeUnits', handleRemoveUnits)
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
                  if (enemyUnit) battle.grid.removeUnits([enemyUnit.id])
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
