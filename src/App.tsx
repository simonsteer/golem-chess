import React, { useState, useRef } from 'react'
import Chess from './Chess'
import './App.css'
import {
  Team,
  RawCoords,
  Coords,
  Unit,
  TileEvents,
  Pathfinder,
} from 'automaton'
import { useEffectOnce } from 'react-use'
import { ActionableUnit } from 'automaton/dist/services/BattleManager/services/TurnManager'
import Tile from './components/Tile'
import Grid from './components/Grid'
import { ChessTeam } from './Chess/teams'
import ChessPiece from './Chess/units/ChessPiece'
import { Pawn } from './Chess/units'

const EN_PASSANT_CAPTURE_COORDS: RawCoords[] = [
  { x: 0, y: 2 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
  { x: 3, y: 2 },
  { x: 4, y: 2 },
  { x: 5, y: 2 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 0, y: 5 },
  { x: 1, y: 5 },
  { x: 2, y: 5 },
  { x: 3, y: 5 },
  { x: 4, y: 5 },
  { x: 5, y: 5 },
  { x: 6, y: 5 },
  { x: 7, y: 5 },
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

const EN_PASSANT_CAPTURE_HASHES = Coords.hashMany(EN_PASSANT_CAPTURE_COORDS)
const EN_PASSANT_HASHES = Coords.hashMany(EN_PASSANT_COORDS)

const getIsPawn = (unit: Unit) =>
  (unit as ChessPiece).text === '♙' && (unit as Pawn)

function App() {
  const battle = useRef(new Chess()).current
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
    const handleEnPassant: TileEvents['unitStop'] = pathfinder => {
      if (
        (pathfinder.unit as ChessPiece).text === '♙' &&
        EN_PASSANT_CAPTURE_HASHES.includes(pathfinder.coordinates.hash)
      ) {
        const targetCoords = EN_PASSANT_COORDS.find(
          coord =>
            coord.x === pathfinder.coordinates.x &&
            Math.abs(coord.y - pathfinder.coordinates.y) === 1
        )
        if (targetCoords) {
          const unitAtCoords = battle.grid.getData(targetCoords)?.pathfinder
          const pawnAtCoords = !!unitAtCoords && getIsPawn(unitAtCoords.unit)
          if (pawnAtCoords && pawnAtCoords.moves === 1) {
            battle.grid.removeUnits([pawnAtCoords.id])
          }
        }
      }
    }
    const handlePromotePawn: TileEvents['unitStop'] = pathfinder => {
      const pawn = getIsPawn(pathfinder.unit)
      if (!pawn) {
        return
      }
      const checks = { white: 0, black: 7 }
      if (
        checks[(pathfinder.unit.team as ChessTeam).type] ===
        pathfinder.coordinates.y
      ) {
        console.log('promote that pawn')
      }
    }
    const handleUnitStop: TileEvents['unitStop'] = (...args) => {
      handleEnPassant(...args)
      handlePromotePawn(...args)
    }
    battle.grid.graph[0][0].tile.events.on('unitStop', handleUnitStop)
    battle.events.on('actionableUnitChanged', updateUnit)
    battle.events.on('nextTurn', handleNextTurn)
    battle.grid.events.on('addUnits', setPathfinders)
    battle.grid.events.on('removeUnits', handleRemoveUnits)

    if (battle.turnIndex < 0) {
      battle.advance()
    }

    return () => {
      battle.grid.graph[0][0].tile.events.off('unitStop', handleUnitStop)
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

          if (pathfinder && battle.lastTouchedPathfinder) {
            const enPassantCoords = battle.getEnPassantCoords(
              pathfinder,
              battle.lastTouchedPathfinder
            )
            if (enPassantCoords)
              reachableCoords.push(Coords.hash(enPassantCoords))
          }

          const pawn = !!pathfinder && getIsPawn(pathfinder.unit)
          const lastPawn =
            !!battle.lastTouchedPathfinder &&
            getIsPawn(battle.lastTouchedPathfinder.unit)
          if (pawn && lastPawn && lastPawn.moves === 1) {
            const pawnPathfinder = pathfinder!
            const lastPawnPathfinder = battle.lastTouchedPathfinder!
            const deltas = pawnPathfinder.coordinates.deltas(
              lastPawnPathfinder.coordinates
            )
            if (
              EN_PASSANT_HASHES.includes(lastPawnPathfinder.coordinates.hash) &&
              Math.abs(deltas.x) === 1 &&
              deltas.y === 0
            ) {
              const enPassantCoords = lastPawnPathfinder.coordinates.raw
              enPassantCoords.y = enPassantCoords.y === 3 ? 2 : 5
              reachableCoords.push(Coords.hash(enPassantCoords))
            }
          }

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
                  return
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
