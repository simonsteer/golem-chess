import { RawCoords, Coords } from 'automaton'

export const EN_PASSANT_CAPTURE_COORDS: RawCoords[] = [
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

export const EN_PASSANT_COORDS: RawCoords[] = [
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

export const CASTLING_COORDS: RawCoords[] = [
  { x: 2, y: 0 },
  { x: 4, y: 0 },
  { x: 3, y: 7 },
  { x: 5, y: 7 },
]

export const CASTLING_CAPTURE_COORDS: RawCoords[] = [
  { x: 1, y: 0 },
  { x: 5, y: 0 },
  { x: 2, y: 7 },
  { x: 6, y: 7 },
]

export const [
  EN_PASSANT_HASHES,
  EN_PASSANT_CAPTURE_HASHES,
  CASTLING_HASHES,
  CASTLING_CAPTURE_HASHES,
] = [
  Coords.hashMany(EN_PASSANT_COORDS),
  Coords.hashMany(EN_PASSANT_CAPTURE_COORDS),
  Coords.hashMany(CASTLING_COORDS),
  Coords.hashMany(CASTLING_CAPTURE_COORDS),
]
