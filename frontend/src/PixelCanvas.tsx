import React, { useRef, useEffect } from "react";

interface AgentData {
  id: string;
  name: string;
  role: string;
  status: string;
  action: string;
  position: { x: number; y: number };
  message: string | null;
  emoji: string | null;
}

interface Props {
  agents: AgentData[];
}

const TILE_SIZE = 36;
const MAP_WIDTH = 18;
const MAP_HEIGHT = 18;

// Warm palette with soft yellow bg and higher contrast
const M = {
  bg: "#faf3e0",
  floor1: "#f5edda",
  floor2: "#efe7d0",
  wall: "#e8dcc4",
  wallTop: "#d4c8a8",
  grass: "#7cba6e",
  grassAlt: "#6aab5c",
  flower1: "#e87090",
  flower2: "#a070d0",
  flower3: "#e8c040",
  soil: "#8a7450",
  path: "#d8cbb0",
  water: "#68b8d8",
  wood: "#8b5e3c",
  woodLight: "#a87040",
  woodDark: "#5c3820",
  stone: "#8a8a84",
  stoneLight: "#a8a8a0",
  cushion: "#e08888",
  cushionAlt: "#70b8c8",
  bookRed: "#d04050",
  bookBlue: "#4090c8",
  bookGreen: "#40a860",
  bookYellow: "#e8c030",
  screen: "#80e8b8",
  pot: "#c87050",
  plant: "#4ca850",
  plantDark: "#388840",
  lamp: "#f0d870",
  rug: "#d09878",
  rugAlt: "#c08868",
  kitchen: "#e0d8c8",
  counter: "#c8c0b0",
  mug: "#f0e8d8",
  fence: "#7a6850",
  sky: "#88d0f0",
  cloud: "#ffffff",
};

// Agent appearance types
interface AgentAppearance {
  type: string;
  color1: string;   // main clothing
  color2: string;   // accent
  color3: string;   // hair
  gender: "male" | "female" | "none";
  hairStyle: "short" | "ponytail" | "fluffy" | "none" | "slick";
  accessory: "none" | "glasses" | "bow" | "headband" | "tie";
}

const AGENT_APPEARANCE: Record<string, AgentAppearance> = {
  boss: { type: "human", color1: "#2a2a2a", color2: "#d04040", color3: "#1a1010", gender: "male", hairStyle: "slick", accessory: "tie" },
  literature: { type: "lobster", color1: "#d04040", color2: "#e86060", color3: "#a03030", gender: "none", hairStyle: "none", accessory: "none" },
  experiment: { type: "human", color1: "#5898d8", color2: "#70b0e8", color3: "#2a1a10", gender: "male", hairStyle: "short", accessory: "glasses" },
  writing: { type: "human", color1: "#e888a8", color2: "#f0a0c0", color3: "#3d2010", gender: "female", hairStyle: "ponytail", accessory: "bow" },
  code: { type: "human", color1: "#e8a040", color2: "#f0c060", color3: "#1a1020", gender: "female", hairStyle: "fluffy", accessory: "headband" },
};

/*
  Map legend:
  0  = indoor floor
  1  = wall
  2  = desk
  3  = bookshelf
  4  = sofa
  5  = kitchen counter
  6  = garden grass
  7  = flower
  8  = path
  9  = fence
  10 = lamp
  11 = plant (indoor)
  12 = window
  13 = rug
  14 = coffee table
  15 = oven/stove
  16 = pond
  17 = TV (small, unused now)
  18 = meeting table (small, unused now)
  19 = office chair
  20 = whiteboard
  21 = reception counter
  22 = waiting chair
  23 = water cooler
  24 = corridor floor
  25 = fruit rack
  26 = coffee machine
  27 = conference table (big)
  28 = treadmill
  29 = dumbbell rack
  30 = big sofa
  31 = big TV screen
  32 = desk (literature) - books & red mug
  33 = desk (experiment) - microscope & flask
  34 = desk (writing) - notepad & pens
  35 = desk (code) - dual monitors
*/

/*
  Layout:
  Top-left:     Office (desks, bookshelves)
  Top-right:    Garden (grass, flowers, pond)
  Middle-left:  Gym (top) + Lounge with big sofa/TV (bottom)
  Middle-right: Kitchen (stove, counter, fruit rack, coffee machine)
  Bottom:       Corridor connecting meeting room + reception
  Bottom-left:  Meeting room (big conference table, whiteboard)
  Bottom-right: Reception / Lobby (counter, waiting area)
*/
const MAP = [
  [ 1,  1, 12,  1,  1,  1,  1, 12,  1,  1,  9,  6,  7,  6,  6,  7,  6,  6],
  [ 1, 10,  0,  0,  0,  0,  0,  0, 10,  1,  9,  6,  6,  7,  6,  6,  6,  7],
  [ 1,  0, 32,  0,  0,  0,  0, 33,  0,  1,  9,  7,  6,  6, 16,  6,  7,  6],
  [ 1,  0,  0,  0,  3,  3,  0,  0,  0,  1,  9,  6,  6,  6,  6,  6,  6,  6],
  [ 1,  0, 34,  0,  0,  0,  0, 35,  0,  1,  8,  8,  8,  8,  8,  8,  8,  8],
  [ 1, 11,  0,  0,  0,  0,  0,  0, 11,  1,  9,  6,  7,  6,  6,  7,  6,  6],
  [ 1,  1,  1,  1,  0,  0,  1,  1,  1,  1,  9,  6,  6,  6,  7,  6,  6,  7],
  [ 1, 12,  1,  1,  1, 12,  1,  0,  1,  1,  1, 12,  1,  1,  1, 12,  1,  1],
  [ 1,  0, 28,  0,  0, 29,  0,  0,  0,  1,  1,  0,  0, 26,  0,  0,  0,  1],
  [ 1,  0, 28,  0,  0,  0,  0,  0,  0,  1,  1,  0, 15,  5,  5, 15,  0,  1],
  [ 1,  0,  0,  0, 30, 30, 30,  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  1],
  [ 1,  0,  0,  0, 31, 31, 31,  0, 10,  1,  1,  0,  5, 25,  0,  5, 11,  1],
  [ 1,  1,  1,  0,  0,  0,  0,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1],
  [ 1, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 23,  1],
  [ 1,  1, 12,  1,  1,  1,  1,  0,  1,  1,  1,  0,  1,  1, 12,  1,  1,  1],
  [ 1, 20,  0,  0, 27, 27,  0,  0,  0,  1,  1,  0,  0, 21, 21,  0, 11,  1],
  [ 1,  0,  0, 19, 27, 27, 19,  0, 10,  1,  1,  0, 22,  0,  0, 22,  0,  1],
  [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
];

// Dog state
interface DogState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  frame: number;
  direction: number; // 0=right, 1=left
  state: "walking" | "sitting" | "sleeping";
  timer: number;
}

// Cat state
interface CatState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  frame: number;
  direction: number;
  state: "walking" | "sitting" | "sleeping" | "grooming";
  timer: number;
}

// NPC state
interface NPCState {
  x: number;
  y: number;
  type: string;
  frame: number;
}

const dogRef: { current: DogState } = {
  current: { x: 13, y: 5, targetX: 13, targetY: 5, frame: 0, direction: 0, state: "walking", timer: 0 },
};

const catRef: { current: CatState } = {
  current: { x: 5, y: 10, targetX: 5, targetY: 10, frame: 0, direction: 0, state: "sitting", timer: 0 },
};

const npcsRef: { current: NPCState[] } = {
  current: [
    { x: 12, y: 1, type: "butterfly", frame: 0 },
    { x: 16, y: 5, type: "bird", frame: 0 },
    { x: 14, y: 16, type: "receptionist", frame: 0 },
  ],
};

function isWalkable(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
  const tile = MAP[y][x];
  return [0, 6, 8, 13, 24].includes(tile);
}

function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number, frame: number) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const isAlt = (x + y) % 2 === 0;

  // Default floor
  ctx.fillStyle = isAlt ? M.floor1 : M.floor2;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  switch (tile) {
    case 1: // Wall
      ctx.fillStyle = M.wall;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = M.wallTop;
      ctx.fillRect(px, py, TILE_SIZE, 4);
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      ctx.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 4);
      break;

    case 2: { // Desk
      ctx.fillStyle = M.wood;
      ctx.fillRect(px + 4, py + 18, 32, 14);
      ctx.fillStyle = M.woodLight;
      ctx.fillRect(px + 4, py + 16, 32, 3);
      ctx.fillStyle = M.woodDark;
      ctx.fillRect(px + 6, py + 30, 3, 8);
      ctx.fillRect(px + 31, py + 30, 3, 8);
      // Monitor
      ctx.fillStyle = "#6a6a6a";
      ctx.fillRect(px + 12, py + 4, 16, 12);
      ctx.fillStyle = M.screen;
      ctx.fillRect(px + 13, py + 5, 14, 10);
      ctx.fillStyle = "#6a6a6a";
      ctx.fillRect(px + 18, py + 16, 4, 2);
      // Mug
      ctx.fillStyle = M.mug;
      ctx.fillRect(px + 30, py + 10, 5, 6);
      break;
    }

    case 3: { // Bookshelf
      ctx.fillStyle = M.woodDark;
      ctx.fillRect(px + 2, py + 2, 36, 36);
      ctx.fillStyle = M.wood;
      ctx.fillRect(px + 2, py + 14, 36, 2);
      ctx.fillRect(px + 2, py + 26, 36, 2);
      const colors1 = [M.bookRed, M.bookBlue, M.bookGreen, M.bookYellow, M.bookRed];
      colors1.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(px + 5 + i * 6, py + 3, 4, 10);
        ctx.fillRect(px + 5 + i * 6, py + 16, 4, 9);
        ctx.fillRect(px + 5 + i * 6, py + 28, 4, 8);
      });
      break;
    }

    case 4: { // Sofa
      ctx.fillStyle = M.cushion;
      ctx.fillRect(px + 2, py + 12, 36, 22);
      ctx.fillStyle = M.cushionAlt;
      ctx.fillRect(px + 2, py + 8, 36, 6);
      // Armrests
      ctx.fillStyle = M.cushion;
      ctx.fillRect(px, py + 10, 4, 24);
      ctx.fillRect(px + 36, py + 10, 4, 24);
      // Cushion lines
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 14, py + 14);
      ctx.lineTo(px + 14, py + 32);
      ctx.moveTo(px + 26, py + 14);
      ctx.lineTo(px + 26, py + 32);
      ctx.stroke();
      break;
    }

    case 5: { // Kitchen counter
      ctx.fillStyle = M.counter;
      ctx.fillRect(px + 2, py + 14, 36, 24);
      ctx.fillStyle = M.stoneLight;
      ctx.fillRect(px + 2, py + 12, 36, 3);
      // Cabinet doors
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 4, py + 18, 14, 18);
      ctx.strokeRect(px + 22, py + 18, 14, 18);
      // Handles
      ctx.fillStyle = M.woodDark;
      ctx.fillRect(px + 16, py + 25, 2, 4);
      ctx.fillRect(px + 34, py + 25, 2, 4);
      break;
    }

    case 6: { // Garden grass
      ctx.fillStyle = isAlt ? M.grass : M.grassAlt;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Grass blades
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(px + 8, py + 30, 1, 4);
      ctx.fillRect(px + 20, py + 24, 1, 3);
      ctx.fillRect(px + 32, py + 28, 1, 4);
      break;
    }

    case 7: { // Flower on grass
      ctx.fillStyle = isAlt ? M.grass : M.grassAlt;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Stems and flowers
      const flowerColors = [M.flower1, M.flower2, M.flower3];
      const fc = flowerColors[(x + y) % 3];
      ctx.fillStyle = "#7a9872";
      ctx.fillRect(px + 18, py + 20, 2, 14);
      ctx.fillRect(px + 28, py + 24, 2, 10);
      ctx.fillStyle = fc;
      ctx.beginPath();
      ctx.arc(px + 19, py + 18, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + 29, py + 22, 3, 0, Math.PI * 2);
      ctx.fill();
      // Center dots
      ctx.fillStyle = M.lamp;
      ctx.beginPath();
      ctx.arc(px + 19, py + 18, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 8: { // Garden path
      ctx.fillStyle = M.path;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Stones
      ctx.fillStyle = M.stoneLight;
      ctx.fillRect(px + 4, py + 6, 10, 8);
      ctx.fillRect(px + 18, py + 16, 12, 10);
      ctx.fillRect(px + 6, py + 28, 8, 8);
      ctx.fillStyle = M.stone;
      ctx.fillRect(px + 30, py + 4, 8, 6);
      break;
    }

    case 9: { // Fence
      ctx.fillStyle = isAlt ? M.grass : M.grassAlt;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = M.fence;
      ctx.fillRect(px + 18, py, 4, TILE_SIZE);
      ctx.fillRect(px + 8, py + 8, 24, 3);
      ctx.fillRect(px + 8, py + 28, 24, 3);
      // Post tops
      ctx.fillStyle = M.woodLight;
      ctx.fillRect(px + 17, py - 2, 6, 4);
      break;
    }

    case 10: { // Floor lamp
      ctx.fillStyle = M.woodDark;
      ctx.fillRect(px + 18, py + 14, 3, 24);
      ctx.fillStyle = M.wood;
      ctx.fillRect(px + 14, py + 36, 12, 3);
      // Lampshade
      ctx.fillStyle = M.lamp;
      ctx.beginPath();
      ctx.moveTo(px + 12, py + 14);
      ctx.lineTo(px + 28, py + 14);
      ctx.lineTo(px + 25, py + 4);
      ctx.lineTo(px + 15, py + 4);
      ctx.closePath();
      ctx.fill();
      // Glow
      const flicker = 1 + Math.sin(frame * 0.03) * 0.3;
      ctx.fillStyle = `rgba(210, 200, 160, ${0.06 * flicker})`;
      ctx.beginPath();
      ctx.arc(px + 20, py + 16, 16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 11: { // Indoor plant
      ctx.fillStyle = M.pot;
      ctx.fillRect(px + 12, py + 26, 16, 12);
      ctx.fillStyle = M.woodLight;
      ctx.fillRect(px + 10, py + 24, 20, 3);
      ctx.fillStyle = "#8aa882";
      ctx.beginPath();
      ctx.arc(px + 20, py + 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7a9872";
      ctx.beginPath();
      ctx.arc(px + 16, py + 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + 25, py + 14, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 12: { // Window
      ctx.fillStyle = M.wall;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = M.wood;
      ctx.fillRect(px + 6, py + 4, 28, 30);
      ctx.fillStyle = M.sky;
      ctx.fillRect(px + 8, py + 6, 24, 26);
      // Cross
      ctx.fillStyle = M.wood;
      ctx.fillRect(px + 19, py + 6, 2, 26);
      ctx.fillRect(px + 8, py + 18, 24, 2);
      // Clouds
      ctx.fillStyle = M.cloud;
      ctx.beginPath();
      ctx.arc(px + 15, py + 12, 3, 0, Math.PI * 2);
      ctx.arc(px + 19, py + 11, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 13: { // Rug
      ctx.fillStyle = isAlt ? M.rug : M.rugAlt;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
      break;
    }

    case 14: { // Coffee table
      ctx.fillStyle = isAlt ? M.rug : M.rugAlt;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = M.wood;
      ctx.fillRect(px + 8, py + 12, 24, 16);
      ctx.fillStyle = M.woodLight;
      ctx.fillRect(px + 8, py + 10, 24, 3);
      // Books and mug on table
      ctx.fillStyle = M.bookRed;
      ctx.fillRect(px + 10, py + 14, 8, 5);
      ctx.fillStyle = M.bookBlue;
      ctx.fillRect(px + 11, py + 19, 6, 4);
      ctx.fillStyle = M.mug;
      ctx.fillRect(px + 24, py + 14, 5, 5);
      break;
    }

    case 15: { // Stove/Oven
      ctx.fillStyle = M.counter;
      ctx.fillRect(px + 2, py + 8, 36, 30);
      ctx.fillStyle = M.stone;
      ctx.fillRect(px + 2, py + 6, 36, 3);
      // Burners
      ctx.fillStyle = "#707070";
      ctx.beginPath();
      ctx.arc(px + 12, py + 18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + 28, py + 18, 5, 0, Math.PI * 2);
      ctx.fill();
      // Oven door
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 6, py + 26, 28, 10);
      ctx.fillStyle = M.stoneLight;
      ctx.fillRect(px + 8, py + 28, 24, 6);
      // Knobs
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.arc(px + 10, py + 12, 2, 0, Math.PI * 2);
      ctx.arc(px + 18, py + 12, 2, 0, Math.PI * 2);
      ctx.arc(px + 26, py + 12, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 17: { // TV on stand
      ctx.fillStyle = isAlt ? M.rug : M.rugAlt;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // TV stand
      ctx.fillStyle = M.woodDark;
      ctx.fillRect(px + 12, py + 28, 16, 10);
      ctx.fillStyle = M.wood;
      ctx.fillRect(px + 10, py + 26, 20, 3);
      // TV body
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(px + 6, py + 4, 28, 22);
      // Screen with changing colors
      const tvColor = frame % 90 < 30 ? "#a8c8d8" : frame % 90 < 60 ? "#c8b8a0" : "#a8c8a8";
      ctx.fillStyle = tvColor;
      ctx.fillRect(px + 8, py + 6, 24, 18);
      // Screen content (simple shapes)
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(px + 12, py + 10, 8, 6);
      ctx.fillRect(px + 22, py + 14, 6, 4);
      // TV glow
      ctx.fillStyle = `rgba(168, 200, 216, ${0.06 + Math.sin(frame * 0.08) * 0.02})`;
      ctx.fillRect(px, py + 24, TILE_SIZE, TILE_SIZE - 24);
      break;
    }

    case 16: { // Pond
      ctx.fillStyle = M.grass;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = M.water;
      ctx.beginPath();
      ctx.ellipse(px + 20, py + 20, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ripples
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      const ripple = Math.sin(frame * 0.04) * 2;
      ctx.beginPath();
      ctx.ellipse(px + 20, py + 20, 8 + ripple, 6 + ripple, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Lily pad
      ctx.fillStyle = "#8aa882";
      ctx.beginPath();
      ctx.arc(px + 14, py + 16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = M.flower1;
      ctx.beginPath();
      ctx.arc(px + 14, py + 15, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 18: { // Meeting table
      ctx.fillStyle = "#6a5040";
      ctx.fillRect(px + 6, py + 8, 28, 22);
      ctx.fillStyle = "#7a6050";
      ctx.fillRect(px + 6, py + 6, 28, 3);
      // Papers on table
      ctx.fillStyle = "#f8f4f0";
      ctx.fillRect(px + 10, py + 12, 8, 10);
      ctx.fillStyle = "#e8e4e0";
      ctx.fillRect(px + 20, py + 14, 8, 8);
      // Pen
      ctx.fillStyle = "#4080c8";
      ctx.fillRect(px + 12, py + 24, 6, 1);
      break;
    }

    case 19: { // Office chair
      // Seat
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 10, py + 16, 18, 14);
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(px + 10, py + 14, 18, 3);
      // Backrest
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 12, py + 4, 14, 12);
      ctx.fillStyle = "#6a6a6a";
      ctx.fillRect(px + 13, py + 5, 12, 9);
      // Wheels
      ctx.fillStyle = "#3a3a3a";
      ctx.beginPath();
      ctx.arc(px + 14, py + 32, 2, 0, Math.PI * 2);
      ctx.arc(px + 24, py + 32, 2, 0, Math.PI * 2);
      ctx.fill();
      // Base pole
      ctx.fillStyle = "#8a8a8a";
      ctx.fillRect(px + 18, py + 28, 3, 5);
      break;
    }

    case 20: { // Whiteboard
      ctx.fillStyle = M.wall;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Board frame
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(px + 4, py + 4, 30, 28);
      // Board surface
      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(px + 6, py + 6, 26, 24);
      // Scribbles
      ctx.strokeStyle = "#4080c8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 10, py + 12);
      ctx.lineTo(px + 22, py + 12);
      ctx.moveTo(px + 10, py + 16);
      ctx.lineTo(px + 26, py + 16);
      ctx.moveTo(px + 10, py + 20);
      ctx.lineTo(px + 18, py + 20);
      ctx.stroke();
      ctx.strokeStyle = "#d04040";
      ctx.beginPath();
      ctx.arc(px + 26, py + 22, 4, 0, Math.PI * 2);
      ctx.stroke();
      // Tray
      ctx.fillStyle = "#d0d0d0";
      ctx.fillRect(px + 8, py + 30, 22, 3);
      // Markers
      ctx.fillStyle = "#d04040";
      ctx.fillRect(px + 10, py + 30, 3, 2);
      ctx.fillStyle = "#4080c8";
      ctx.fillRect(px + 14, py + 30, 3, 2);
      ctx.fillStyle = "#40a860";
      ctx.fillRect(px + 18, py + 30, 3, 2);
      break;
    }

    case 21: { // Reception counter
      // Counter body
      ctx.fillStyle = "#8a6848";
      ctx.fillRect(px + 2, py + 12, 36, 26);
      // Counter top
      ctx.fillStyle = "#a07858";
      ctx.fillRect(px + 2, py + 10, 36, 3);
      // Front panel
      ctx.fillStyle = "#7a5838";
      ctx.fillRect(px + 4, py + 14, 32, 22);
      // Decorative stripe
      ctx.fillStyle = "#d04040";
      ctx.fillRect(px + 4, py + 22, 32, 2);
      // Monitor on counter
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 14, py + 2, 12, 8);
      ctx.fillStyle = M.screen;
      ctx.fillRect(px + 15, py + 3, 10, 6);
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 18, py + 10, 4, 2);
      break;
    }

    case 22: { // Waiting chair
      // Seat
      ctx.fillStyle = "#c8a878";
      ctx.fillRect(px + 8, py + 18, 22, 12);
      // Backrest
      ctx.fillStyle = "#b89868";
      ctx.fillRect(px + 8, py + 8, 22, 12);
      ctx.fillStyle = "#c8a878";
      ctx.fillRect(px + 10, py + 10, 18, 8);
      // Legs
      ctx.fillStyle = "#6a6a6a";
      ctx.fillRect(px + 10, py + 28, 2, 6);
      ctx.fillRect(px + 26, py + 28, 2, 6);
      // Armrests
      ctx.fillStyle = "#6a6a6a";
      ctx.fillRect(px + 6, py + 14, 3, 16);
      ctx.fillRect(px + 29, py + 14, 3, 16);
      break;
    }

    case 23: { // Water cooler
      // Body
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(px + 12, py + 14, 14, 22);
      // Water bottle on top
      ctx.fillStyle = "#a8d8f0";
      ctx.beginPath();
      ctx.arc(px + 19, py + 10, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#90c8e0";
      ctx.beginPath();
      ctx.arc(px + 19, py + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      // Neck
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(px + 16, py + 12, 6, 4);
      // Taps
      ctx.fillStyle = "#d04040";
      ctx.fillRect(px + 14, py + 20, 3, 3);
      ctx.fillStyle = "#4090c8";
      ctx.fillRect(px + 21, py + 20, 3, 3);
      // Drip tray
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(px + 12, py + 26, 14, 2);
      break;
    }

    case 24: { // Corridor floor
      ctx.fillStyle = isAlt ? "#e8e0d0" : "#e2dac8";
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "rgba(0,0,0,0.04)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      break;
    }

    case 25: { // Fruit rack
      // Shelf structure
      ctx.fillStyle = M.wood;
      ctx.fillRect(px + 6, py + 8, 26, 28);
      ctx.fillStyle = M.woodLight;
      ctx.fillRect(px + 6, py + 6, 26, 3);
      ctx.fillRect(px + 6, py + 18, 26, 2);
      ctx.fillRect(px + 6, py + 28, 26, 2);
      // Fruits - top shelf
      ctx.fillStyle = "#e84040";  // apples
      ctx.beginPath();
      ctx.arc(px + 12, py + 13, 3, 0, Math.PI * 2);
      ctx.arc(px + 19, py + 14, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0c020";  // lemon
      ctx.beginPath();
      ctx.arc(px + 26, py + 13, 3, 0, Math.PI * 2);
      ctx.fill();
      // Middle shelf
      ctx.fillStyle = "#f0a020";  // oranges
      ctx.beginPath();
      ctx.arc(px + 12, py + 24, 3, 0, Math.PI * 2);
      ctx.arc(px + 19, py + 23, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#80c840";  // green apple
      ctx.beginPath();
      ctx.arc(px + 26, py + 24, 3, 0, Math.PI * 2);
      ctx.fill();
      // Bottom shelf - bananas
      ctx.fillStyle = "#f0d860";
      ctx.fillRect(px + 10, py + 32, 12, 3);
      ctx.fillRect(px + 11, py + 31, 10, 2);
      break;
    }

    case 26: { // Coffee machine
      // Machine body
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(px + 8, py + 6, 22, 28);
      // Front panel
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 10, py + 8, 18, 18);
      // Display
      ctx.fillStyle = "#40c080";
      ctx.fillRect(px + 12, py + 10, 14, 6);
      // Drip area
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(px + 12, py + 20, 14, 4);
      // Cup
      ctx.fillStyle = "#f0e8d8";
      ctx.fillRect(px + 16, py + 24, 8, 8);
      ctx.fillStyle = "#8b5e3c";
      ctx.fillRect(px + 17, py + 25, 6, 4);
      // Steam
      const steam = Math.sin(frame * 0.06) * 2;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 18, py + 22 + steam);
      ctx.quadraticCurveTo(px + 20, py + 18 + steam, px + 19, py + 14);
      ctx.moveTo(px + 22, py + 22 + steam);
      ctx.quadraticCurveTo(px + 24, py + 19 + steam, px + 22, py + 15);
      ctx.stroke();
      // Top
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 8, py + 4, 22, 3);
      // Bean hopper
      ctx.fillStyle = "#6a4030";
      ctx.fillRect(px + 14, py + 1, 10, 4);
      break;
    }

    case 27: { // Conference table (big, 2x2)
      ctx.fillStyle = "#5a4030";
      ctx.fillRect(px + 2, py + 4, 34, 28);
      ctx.fillStyle = "#6a5040";
      ctx.fillRect(px + 2, py + 2, 34, 3);
      // Wood grain
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 8);
      ctx.lineTo(px + 32, py + 8);
      ctx.moveTo(px + 6, py + 16);
      ctx.lineTo(px + 32, py + 16);
      ctx.moveTo(px + 6, py + 24);
      ctx.lineTo(px + 32, py + 24);
      ctx.stroke();
      // Papers/items
      ctx.fillStyle = "#f8f4f0";
      ctx.fillRect(px + 6, py + 8, 7, 9);
      ctx.fillStyle = "#e8e4e0";
      ctx.fillRect(px + 22, py + 12, 8, 7);
      // Pen
      ctx.fillStyle = "#d04040";
      ctx.fillRect(px + 15, py + 20, 5, 1);
      // Legs
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(px + 4, py + 30, 3, 6);
      ctx.fillRect(px + 31, py + 30, 3, 6);
      break;
    }

    case 28: { // Treadmill
      // Base
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 4, py + 24, 30, 12);
      // Belt
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 6, py + 26, 26, 8);
      // Belt lines moving
      const beltMove = (frame * 0.5) % 8;
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const lx = px + 8 + ((i * 8 + beltMove) % 24);
        ctx.beginPath();
        ctx.moveTo(lx, py + 27);
        ctx.lineTo(lx, py + 33);
        ctx.stroke();
      }
      // Upright poles
      ctx.fillStyle = "#6a6a6a";
      ctx.fillRect(px + 6, py + 4, 3, 22);
      ctx.fillRect(px + 29, py + 4, 3, 22);
      // Handles
      ctx.fillStyle = "#8a8a8a";
      ctx.fillRect(px + 5, py + 4, 5, 2);
      ctx.fillRect(px + 28, py + 4, 5, 2);
      // Display
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(px + 12, py + 4, 14, 8);
      ctx.fillStyle = "#40e080";
      ctx.fillRect(px + 13, py + 5, 12, 6);
      // Speed display
      ctx.fillStyle = "#2a8050";
      ctx.font = "6px monospace";
      ctx.fillText("5.2", px + 15, py + 10);
      break;
    }

    case 29: { // Dumbbell rack
      // Rack frame
      ctx.fillStyle = "#6a6a6a";
      ctx.fillRect(px + 4, py + 8, 30, 26);
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 4, py + 6, 30, 3);
      ctx.fillRect(px + 4, py + 18, 30, 2);
      ctx.fillRect(px + 4, py + 28, 30, 2);
      // Dumbbells - top row
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 8, py + 10, 10, 3);
      ctx.fillStyle = "#d04040";
      ctx.fillRect(px + 6, py + 9, 4, 5);
      ctx.fillRect(px + 16, py + 9, 4, 5);
      // Middle row
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 8, py + 21, 10, 3);
      ctx.fillStyle = "#4080c8";
      ctx.fillRect(px + 6, py + 20, 4, 5);
      ctx.fillRect(px + 16, py + 20, 4, 5);
      // Bottom row - bigger
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 8, py + 31, 10, 3);
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(px + 5, py + 30, 5, 5);
      ctx.fillRect(px + 16, py + 30, 5, 5);
      // Second set on right
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 22, py + 10, 8, 3);
      ctx.fillStyle = "#e8a040";
      ctx.fillRect(px + 21, py + 9, 3, 5);
      ctx.fillRect(px + 28, py + 9, 3, 5);
      break;
    }

    case 30: { // Big sofa (spans multiple tiles)
      // Seat cushion
      ctx.fillStyle = "#7a9ab0";
      ctx.fillRect(px + 1, py + 14, TILE_SIZE - 2, 16);
      // Back cushion
      ctx.fillStyle = "#6a8aa0";
      ctx.fillRect(px + 1, py + 6, TILE_SIZE - 2, 10);
      // Cushion detail
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE / 2, py + 8);
      ctx.lineTo(px + TILE_SIZE / 2, py + 28);
      ctx.stroke();
      // Pillow
      if (isAlt) {
        ctx.fillStyle = "#c8a060";
        ctx.beginPath();
        ctx.ellipse(px + 10, py + 18, 6, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 31: { // Big TV screen
      // Wall mount
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 2, py + 4, TILE_SIZE - 4, 24);
      // Screen
      const tvHue = frame % 120 < 40 ? "#b0d0e0" : frame % 120 < 80 ? "#d0c8a0" : "#a8d0b0";
      ctx.fillStyle = tvHue;
      ctx.fillRect(px + 4, py + 6, TILE_SIZE - 8, 20);
      // Screen content
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(px + 8, py + 10, 10, 6);
      ctx.fillRect(px + 20, py + 14, 8, 4);
      // TV stand/mount bracket
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 14, py + 28, 8, 4);
      ctx.fillRect(px + 16, py + 31, 4, 4);
      // Glow
      ctx.fillStyle = `rgba(170, 200, 220, ${0.05 + Math.sin(frame * 0.06) * 0.02})`;
      ctx.fillRect(px, py + 26, TILE_SIZE, 10);
      break;
    }

    case 32: { // Desk - Literature (小文): cherry wood desk with stacked books & red mug
      // Desk surface - darker cherry wood
      ctx.fillStyle = "#7a3b2e";
      ctx.fillRect(px + 4, py + 18, 32, 14);
      ctx.fillStyle = "#9a5040";
      ctx.fillRect(px + 4, py + 16, 32, 3);
      // Legs
      ctx.fillStyle = "#5a2818";
      ctx.fillRect(px + 6, py + 30, 3, 8);
      ctx.fillRect(px + 31, py + 30, 3, 8);
      // Laptop (half-open)
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(px + 14, py + 8, 14, 9);
      ctx.fillStyle = "#88d8c0";
      ctx.fillRect(px + 15, py + 9, 12, 7);
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 14, py + 17, 14, 2);
      // Stacked books
      ctx.fillStyle = M.bookRed;
      ctx.fillRect(px + 4, py + 6, 8, 3);
      ctx.fillStyle = M.bookBlue;
      ctx.fillRect(px + 4, py + 9, 8, 3);
      ctx.fillStyle = M.bookGreen;
      ctx.fillRect(px + 4, py + 12, 8, 3);
      // Red mug
      ctx.fillStyle = "#d04040";
      ctx.fillRect(px + 30, py + 10, 5, 6);
      ctx.fillStyle = "#b03030";
      ctx.fillRect(px + 34, py + 11, 2, 4);
      break;
    }

    case 33: { // Desk - Experiment (小实): white lab desk with microscope & flask
      // Desk surface - white/light gray lab table
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(px + 4, py + 18, 32, 14);
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(px + 4, py + 16, 32, 3);
      // Metal legs
      ctx.fillStyle = "#a0a0a0";
      ctx.fillRect(px + 6, py + 30, 3, 8);
      ctx.fillRect(px + 31, py + 30, 3, 8);
      // Microscope
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 8, py + 10, 3, 8);
      ctx.fillRect(px + 6, py + 6, 7, 3);
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 9, py + 3, 2, 4);
      ctx.fillStyle = "#80c0e0";
      ctx.fillRect(px + 8, py + 2, 4, 2);
      // Flask with blue liquid
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(px + 18, py + 8, 2, 6);
      ctx.fillStyle = "#d0d0d0";
      ctx.fillRect(px + 15, py + 14, 8, 4);
      ctx.fillStyle = "#60b0e8";
      ctx.fillRect(px + 16, py + 15, 6, 2);
      // Monitor
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 24, py + 4, 10, 8);
      ctx.fillStyle = "#a0d8f0";
      ctx.fillRect(px + 25, py + 5, 8, 6);
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(px + 28, py + 12, 3, 2);
      // Blue mug
      ctx.fillStyle = M.bookBlue;
      ctx.fillRect(px + 30, py + 14, 4, 4);
      break;
    }

    case 34: { // Desk - Writing (小写): warm maple desk with notepad, pen holder & plant
      // Desk surface - warm maple wood
      ctx.fillStyle = "#c8944c";
      ctx.fillRect(px + 4, py + 18, 32, 14);
      ctx.fillStyle = "#daa860";
      ctx.fillRect(px + 4, py + 16, 32, 3);
      // Legs
      ctx.fillStyle = "#8a6030";
      ctx.fillRect(px + 6, py + 30, 3, 8);
      ctx.fillRect(px + 31, py + 30, 3, 8);
      // Notepad
      ctx.fillStyle = "#fff8e8";
      ctx.fillRect(px + 12, py + 7, 12, 10);
      ctx.fillStyle = "#f0e8d0";
      ctx.fillRect(px + 12, py + 7, 12, 1);
      ctx.fillRect(px + 12, py + 10, 12, 1);
      ctx.fillRect(px + 12, py + 13, 12, 1);
      // Writing lines on notepad
      ctx.fillStyle = "#c0b8a0";
      ctx.fillRect(px + 14, py + 8, 8, 1);
      ctx.fillRect(px + 14, py + 11, 6, 1);
      ctx.fillRect(px + 14, py + 14, 7, 1);
      // Pen holder with pens
      ctx.fillStyle = "#e888a8";
      ctx.fillRect(px + 28, py + 8, 6, 8);
      ctx.fillStyle = "#d06080";
      ctx.fillRect(px + 29, py + 5, 1, 4);
      ctx.fillStyle = "#4090c8";
      ctx.fillRect(px + 31, py + 4, 1, 5);
      ctx.fillStyle = "#40a860";
      ctx.fillRect(px + 33, py + 6, 1, 3);
      // Small potted plant
      ctx.fillStyle = M.pot;
      ctx.fillRect(px + 5, py + 10, 5, 5);
      ctx.fillStyle = M.plant;
      ctx.fillRect(px + 5, py + 7, 2, 4);
      ctx.fillRect(px + 8, py + 6, 2, 5);
      ctx.fillRect(px + 6, py + 5, 3, 3);
      break;
    }

    case 35: { // Desk - Code (小码): dark desk with dual monitors, mechanical keyboard & energy drink
      // Desk surface - dark walnut
      ctx.fillStyle = "#4a3828";
      ctx.fillRect(px + 4, py + 18, 32, 14);
      ctx.fillStyle = "#5a4838";
      ctx.fillRect(px + 4, py + 16, 32, 3);
      // Legs
      ctx.fillStyle = "#3a2818";
      ctx.fillRect(px + 6, py + 30, 3, 8);
      ctx.fillRect(px + 31, py + 30, 3, 8);
      // Left monitor
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(px + 4, py + 2, 13, 10);
      ctx.fillStyle = "#1a1a2a";
      ctx.fillRect(px + 5, py + 3, 11, 8);
      // Code on left screen
      ctx.fillStyle = "#60d890";
      ctx.fillRect(px + 6, py + 4, 6, 1);
      ctx.fillStyle = "#d8a060";
      ctx.fillRect(px + 6, py + 6, 8, 1);
      ctx.fillStyle = "#80b0e8";
      ctx.fillRect(px + 7, py + 8, 5, 1);
      // Left monitor stand
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(px + 9, py + 12, 3, 2);
      // Right monitor
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(px + 20, py + 2, 13, 10);
      ctx.fillStyle = "#1a1a2a";
      ctx.fillRect(px + 21, py + 3, 11, 8);
      // Terminal on right screen
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(px + 22, py + 4, 9, 1);
      ctx.fillStyle = "#60d890";
      ctx.fillRect(px + 22, py + 6, 7, 1);
      ctx.fillStyle = "#60d890";
      ctx.fillRect(px + 22, py + 8, 4, 1);
      // Right monitor stand
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(px + 25, py + 12, 3, 2);
      // Mechanical keyboard (RGB glow)
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(px + 10, py + 14, 16, 4);
      const kbColors = ["#ff6060", "#ffaa30", "#60ff60", "#6060ff"];
      kbColors.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(px + 11 + i * 4, py + 15, 3, 2);
      });
      // Energy drink can
      ctx.fillStyle = "#30d060";
      ctx.fillRect(px + 30, py + 10, 4, 7);
      ctx.fillStyle = "#20a040";
      ctx.fillRect(px + 30, py + 10, 4, 2);
      break;
    }
  }
}

function drawDog(ctx: CanvasRenderingContext2D, dog: DogState, frame: number) {
  const px = dog.x * TILE_SIZE + TILE_SIZE / 2;
  const py = dog.y * TILE_SIZE + TILE_SIZE / 2;
  const flip = dog.direction === 1 ? -1 : 1;

  ctx.save();
  ctx.translate(px, py);
  ctx.scale(flip, 1);

  if (dog.state === "sleeping") {
    // Sleeping dog - curled up
    ctx.fillStyle = "#c4a880";
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b09870";
    ctx.beginPath();
    ctx.arc(-6, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Zzz
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.font = "8px monospace";
    ctx.fillText("z", 6, -6 + Math.sin(frame * 0.05) * 2);
    ctx.fillText("z", 10, -10 + Math.sin(frame * 0.05 + 1) * 2);
  } else if (dog.state === "sitting") {
    // Sitting dog
    ctx.fillStyle = "#c4a880";
    ctx.fillRect(-6, 0, 12, 10);
    ctx.fillStyle = "#b09870";
    ctx.beginPath();
    ctx.arc(0, -2, 6, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = "#a08860";
    ctx.fillRect(-6, -6, 3, 5);
    ctx.fillRect(3, -6, 3, 5);
    // Eyes
    ctx.fillStyle = "#333";
    ctx.fillRect(-3, -2, 2, 2);
    ctx.fillRect(2, -2, 2, 2);
    // Tongue
    ctx.fillStyle = "#d4a0a0";
    ctx.fillRect(0, 2, 2, 3);
    // Tail wag
    const wag = Math.sin(frame * 0.2) * 4;
    ctx.fillStyle = "#c4a880";
    ctx.fillRect(-8, 2 + wag, 3, 6);
  } else {
    // Walking dog
    const legOffset = Math.sin(frame * 0.2) * 3;
    // Body
    ctx.fillStyle = "#c4a880";
    ctx.fillRect(-8, -2, 16, 8);
    // Head
    ctx.fillStyle = "#b09870";
    ctx.beginPath();
    ctx.arc(8, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = "#a08860";
    ctx.fillRect(5, -6, 3, 4);
    ctx.fillRect(9, -6, 3, 4);
    // Eyes
    ctx.fillStyle = "#333";
    ctx.fillRect(7, -3, 2, 2);
    // Nose
    ctx.fillStyle = "#4a3a2a";
    ctx.fillRect(12, -2, 2, 2);
    // Legs
    ctx.fillStyle = "#b09870";
    ctx.fillRect(-6, 5 + legOffset, 3, 6);
    ctx.fillRect(-1, 5 - legOffset, 3, 6);
    ctx.fillRect(4, 5 + legOffset, 3, 6);
    ctx.fillRect(9, 5 - legOffset, 3, 6);
    // Tail
    const tailWag = Math.sin(frame * 0.25) * 5;
    ctx.fillStyle = "#c4a880";
    ctx.save();
    ctx.translate(-10, -2);
    ctx.rotate((tailWag * Math.PI) / 180);
    ctx.fillRect(-1, -6, 2, 7);
    ctx.restore();
  }

  ctx.restore();

  // Name tag for dog
  ctx.fillStyle = "rgba(80,60,40,0.7)";
  ctx.fillRect(px - 10, py + 14, 20, 9);
  ctx.fillStyle = "#f0e8d8";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("豆豆", px, py + 21);
  ctx.textAlign = "left";
}

function drawNPC(ctx: CanvasRenderingContext2D, npc: NPCState, frame: number) {
  const px = npc.x * TILE_SIZE + TILE_SIZE / 2;
  const py = npc.y * TILE_SIZE + TILE_SIZE / 2;

  if (npc.type === "butterfly") {
    const flutter = Math.sin(frame * 0.15) * 3;
    const drift = Math.sin(frame * 0.02) * 8;
    ctx.fillStyle = M.flower2;
    // Wings
    ctx.beginPath();
    ctx.ellipse(px + drift - 3, py + flutter - 2, 4, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + drift + 3, py + flutter - 2, 4, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = "#6a5a4a";
    ctx.fillRect(px + drift - 1, py + flutter - 3, 2, 6);
  } else if (npc.type === "bird") {
    const bob = Math.sin(frame * 0.08) * 2;
    const hop = Math.abs(Math.sin(frame * 0.04)) * 4;
    ctx.fillStyle = "#a0b8c4";
    ctx.beginPath();
    ctx.ellipse(px, py - hop + bob, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = "#90a8b4";
    ctx.beginPath();
    ctx.arc(px + 4, py - hop + bob - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = "#d4c090";
    ctx.fillRect(px + 6, py - hop + bob - 3, 3, 2);
    // Eye
    ctx.fillStyle = "#333";
    ctx.fillRect(px + 4, py - hop + bob - 4, 1, 1);
  } else if (npc.type === "receptionist") {
    const breathe = Math.sin(frame * 0.03) * 0.5;
    // Body
    ctx.fillStyle = "#4a7898";
    ctx.fillRect(px - 6, py - 2 + breathe, 12, 12);
    // Collar
    ctx.fillStyle = "#fff";
    ctx.fillRect(px - 3, py - 2 + breathe, 6, 3);
    // Arms
    ctx.fillStyle = "#4a7898";
    ctx.fillRect(px - 8, py + breathe, 3, 9);
    ctx.fillRect(px + 5, py + breathe, 3, 9);
    // Hands on counter
    ctx.fillStyle = "#ffe0c4";
    ctx.fillRect(px - 8, py + 8 + breathe, 3, 3);
    ctx.fillRect(px + 5, py + 8 + breathe, 3, 3);
    // Head
    ctx.fillStyle = "#ffe0c4";
    ctx.beginPath();
    ctx.arc(px, py - 7 + breathe, 8, 0, Math.PI * 2);
    ctx.fill();
    // Hair - neat bun
    ctx.fillStyle = "#2a1a10";
    ctx.beginPath();
    ctx.arc(px, py - 9 + breathe, 8, Math.PI + 0.2, -0.2);
    ctx.fill();
    ctx.fillRect(px - 7, py - 12 + breathe, 14, 5);
    // Bun
    ctx.beginPath();
    ctx.arc(px, py - 14 + breathe, 4, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#2a2020";
    ctx.beginPath();
    ctx.arc(px - 3, py - 6 + breathe, 1.5, 0, Math.PI * 2);
    ctx.arc(px + 3, py - 6 + breathe, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Smile
    ctx.strokeStyle = "#c07060";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py - 2.5 + breathe, 2, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Cheeks
    ctx.fillStyle = "rgba(255, 140, 140, 0.2)";
    ctx.beginPath();
    ctx.arc(px - 5, py - 4 + breathe, 2, 0, Math.PI * 2);
    ctx.arc(px + 5, py - 4 + breathe, 2, 0, Math.PI * 2);
    ctx.fill();
    // Name tag
    ctx.font = "bold 7px monospace";
    ctx.fillStyle = "rgba(80,60,40,0.7)";
    ctx.fillRect(px - 10, py + 14, 20, 9);
    ctx.fillStyle = "#f0e8d8";
    ctx.textAlign = "center";
    ctx.fillText("小迎", px, py + 21);
    ctx.textAlign = "left";
  }
}

function drawCat(ctx: CanvasRenderingContext2D, cat: CatState, frame: number) {
  const px = cat.x * TILE_SIZE + TILE_SIZE / 2;
  const py = cat.y * TILE_SIZE + TILE_SIZE / 2;
  const flip = cat.direction === 1 ? -1 : 1;

  ctx.save();
  ctx.translate(px, py);
  ctx.scale(flip, 1);

  if (cat.state === "sleeping") {
    // Curled up cat
    ctx.fillStyle = "#f0a050";
    ctx.beginPath();
    ctx.ellipse(0, 4, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stripes
    ctx.strokeStyle = "#c08030";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(-3, 6);
    ctx.moveTo(0, -1); ctx.lineTo(1, 5);
    ctx.moveTo(4, 0); ctx.lineTo(3, 6);
    ctx.stroke();
    // Head tucked
    ctx.fillStyle = "#e89840";
    ctx.beginPath();
    ctx.arc(-5, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = "#d08830";
    ctx.beginPath();
    ctx.moveTo(-8, -3); ctx.lineTo(-6, -7); ctx.lineTo(-4, -3);
    ctx.fill();
    // Tail curled
    ctx.strokeStyle = "#f0a050";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(6, 2, 5, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    // Zzz
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.font = "7px monospace";
    ctx.fillText("z", 4, -6 + Math.sin(frame * 0.05) * 2);
    ctx.fillText("z", 8, -9 + Math.sin(frame * 0.05 + 1) * 2);
  } else if (cat.state === "sitting") {
    // Sitting cat body
    ctx.fillStyle = "#f0a050";
    ctx.fillRect(-5, 2, 10, 10);
    // Head
    ctx.fillStyle = "#e89840";
    ctx.beginPath();
    ctx.arc(0, -2, 7, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = "#d08830";
    ctx.beginPath();
    ctx.moveTo(-5, -6); ctx.lineTo(-3, -11); ctx.lineTo(-1, -6);
    ctx.moveTo(1, -6); ctx.lineTo(3, -11); ctx.lineTo(5, -6);
    ctx.fill();
    // Inner ears
    ctx.fillStyle = "#f0c0a0";
    ctx.beginPath();
    ctx.moveTo(-4, -6); ctx.lineTo(-3, -9); ctx.lineTo(-2, -6);
    ctx.moveTo(2, -6); ctx.lineTo(3, -9); ctx.lineTo(4, -6);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#3a7040";
    ctx.beginPath();
    ctx.arc(-2.5, -2, 1.8, 0, Math.PI * 2);
    ctx.arc(2.5, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Pupils
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(-3, -2.5, 1, 2.5);
    ctx.fillRect(2, -2.5, 1, 2.5);
    // Nose
    ctx.fillStyle = "#e07070";
    ctx.beginPath();
    ctx.moveTo(-1, 1); ctx.lineTo(1, 1); ctx.lineTo(0, 2);
    ctx.fill();
    // Whiskers
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-7, 0); ctx.lineTo(-3, 1);
    ctx.moveTo(-6, 2); ctx.lineTo(-3, 2);
    ctx.moveTo(3, 1); ctx.lineTo(7, 0);
    ctx.moveTo(3, 2); ctx.lineTo(6, 2);
    ctx.stroke();
    // Tail
    const tailWave = Math.sin(frame * 0.06) * 4;
    ctx.strokeStyle = "#f0a050";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(5, 8);
    ctx.quadraticCurveTo(10, 4 + tailWave, 12, 0 + tailWave);
    ctx.stroke();
    // Tail tip
    ctx.strokeStyle = "#c08030";
    ctx.beginPath();
    ctx.moveTo(11, 1 + tailWave);
    ctx.lineTo(12, 0 + tailWave);
    ctx.stroke();
  } else if (cat.state === "grooming") {
    // Cat licking paw
    ctx.fillStyle = "#f0a050";
    ctx.fillRect(-5, 2, 10, 10);
    // Head turned
    ctx.fillStyle = "#e89840";
    ctx.beginPath();
    ctx.arc(-2, -2, 7, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = "#d08830";
    ctx.beginPath();
    ctx.moveTo(-6, -6); ctx.lineTo(-5, -11); ctx.lineTo(-3, -6);
    ctx.moveTo(-1, -6); ctx.lineTo(1, -11); ctx.lineTo(3, -6);
    ctx.fill();
    // Eyes closed (content)
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-4, -2, 2, 0, Math.PI);
    ctx.arc(0, -2, 2, 0, Math.PI);
    ctx.stroke();
    // Paw raised
    const lick = Math.sin(frame * 0.15) * 1;
    ctx.fillStyle = "#f0a050";
    ctx.fillRect(5, -2 + lick, 4, 6);
    ctx.fillStyle = "#e89840";
    ctx.beginPath();
    ctx.arc(7, -3 + lick, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Walking cat
    const legMove = Math.sin(frame * 0.18) * 2;
    // Body
    ctx.fillStyle = "#f0a050";
    ctx.beginPath();
    ctx.ellipse(0, 2, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stripes
    ctx.strokeStyle = "#c08030";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3, -2); ctx.lineTo(-2, 5);
    ctx.moveTo(1, -2); ctx.lineTo(2, 5);
    ctx.moveTo(5, -1); ctx.lineTo(5, 5);
    ctx.stroke();
    // Head
    ctx.fillStyle = "#e89840";
    ctx.beginPath();
    ctx.arc(8, -1, 5.5, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = "#d08830";
    ctx.beginPath();
    ctx.moveTo(5, -4); ctx.lineTo(6, -8); ctx.lineTo(8, -4);
    ctx.moveTo(8, -4); ctx.lineTo(10, -8); ctx.lineTo(11, -4);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#3a7040";
    ctx.beginPath();
    ctx.arc(7, -1, 1.2, 0, Math.PI * 2);
    ctx.arc(10, -1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.fillStyle = "#e07070";
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(13, 1); ctx.lineTo(11, 1);
    ctx.fill();
    // Legs
    ctx.fillStyle = "#e89840";
    ctx.fillRect(-5, 5 + legMove, 2, 5);
    ctx.fillRect(-1, 5 - legMove, 2, 5);
    ctx.fillRect(3, 5 + legMove, 2, 5);
    ctx.fillRect(6, 5 - legMove, 2, 5);
    // Tail up
    const tailSwing = Math.sin(frame * 0.08) * 6;
    ctx.strokeStyle = "#f0a050";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-12, -4, -10 + tailSwing * 0.3, -8);
    ctx.stroke();
  }

  ctx.restore();

  // Name tag
  ctx.fillStyle = "rgba(80,60,40,0.7)";
  ctx.fillRect(px - 10, py + 14, 20, 9);
  ctx.fillStyle = "#f0e8d8";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("橘子", px, py + 21);
  ctx.textAlign = "left";
}

function updateCat(frame: number) {
  const cat = catRef.current;
  cat.timer++;

  if (cat.state === "walking") {
    if (Math.abs(cat.x - cat.targetX) < 0.05 && Math.abs(cat.y - cat.targetY) < 0.05) {
      cat.x = cat.targetX;
      cat.y = cat.targetY;
      if (Math.random() < 0.03) {
        const states: CatState["state"][] = ["sitting", "sleeping", "grooming"];
        cat.state = states[Math.floor(Math.random() * states.length)];
        cat.timer = 0;
      } else if (Math.random() < 0.04) {
        // Indoor walkable tiles for cat
        const indoorTiles: [number, number][] = [];
        for (let y = 7; y < MAP_HEIGHT - 1; y++) {
          for (let x = 1; x < 10; x++) {
            if ([0, 13, 24].includes(MAP[y][x])) {
              indoorTiles.push([x, y]);
            }
          }
        }
        if (indoorTiles.length > 0) {
          const target = indoorTiles[Math.floor(Math.random() * indoorTiles.length)];
          cat.targetX = target[0];
          cat.targetY = target[1];
          cat.direction = cat.targetX > cat.x ? 0 : 1;
        }
      }
    } else {
      const speed = 0.015;
      cat.x += (cat.targetX - cat.x) * speed;
      cat.y += (cat.targetY - cat.y) * speed;
    }
  } else {
    if (cat.timer > 250 && Math.random() < 0.008) {
      cat.state = "walking";
      cat.timer = 0;
    }
  }
}

function drawLobster(ctx: CanvasRenderingContext2D, px: number, py: number, colors: any, bounce: number, frame: number) {
  // Body
  ctx.fillStyle = colors.color1;
  ctx.beginPath();
  ctx.ellipse(px, py + bounce, 8, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shell segments
  ctx.strokeStyle = colors.color3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px - 6, py - 2 + bounce);
  ctx.lineTo(px + 6, py - 2 + bounce);
  ctx.moveTo(px - 5, py + 3 + bounce);
  ctx.lineTo(px + 5, py + 3 + bounce);
  ctx.stroke();

  // Claws
  const clawWave = Math.sin(frame * 0.08) * 3;
  ctx.fillStyle = colors.color2;
  // Left claw
  ctx.beginPath();
  ctx.ellipse(px - 12, py - 6 + bounce + clawWave, 5, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Right claw
  ctx.beginPath();
  ctx.ellipse(px + 12, py - 6 + bounce - clawWave, 5, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Arms
  ctx.strokeStyle = colors.color1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px - 7, py - 4 + bounce);
  ctx.lineTo(px - 10, py - 6 + bounce + clawWave);
  ctx.moveTo(px + 7, py - 4 + bounce);
  ctx.lineTo(px + 10, py - 6 + bounce - clawWave);
  ctx.stroke();

  // Eyes on stalks
  ctx.fillStyle = colors.color1;
  ctx.fillRect(px - 4, py - 13 + bounce, 2, 4);
  ctx.fillRect(px + 2, py - 13 + bounce, 2, 4);
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(px - 3, py - 14 + bounce, 2, 0, Math.PI * 2);
  ctx.arc(px + 3, py - 14 + bounce, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(px - 4, py - 15 + bounce, 1, 1);
  ctx.fillRect(px + 2, py - 15 + bounce, 1, 1);

  // Tail
  ctx.fillStyle = colors.color3;
  ctx.beginPath();
  ctx.moveTo(px - 4, py + 10 + bounce);
  ctx.lineTo(px + 4, py + 10 + bounce);
  ctx.lineTo(px + 6, py + 15 + bounce);
  ctx.lineTo(px - 6, py + 15 + bounce);
  ctx.closePath();
  ctx.fill();
}

function drawHuman(ctx: CanvasRenderingContext2D, px: number, py: number, colors: AgentAppearance, bounce: number, frame: number, isWalking = false) {
  const breathe = Math.sin(frame * 0.04) * 0.5;
  const isFemale = colors.gender === "female";
  const legSwing = isWalking ? Math.sin(frame * 0.15) * 3 : 0;

  // Legs
  if (isFemale) {
    // Skirt
    ctx.fillStyle = colors.color1;
    ctx.beginPath();
    ctx.moveTo(px - 7, py + 10 + bounce);
    ctx.lineTo(px + 7, py + 10 + bounce);
    ctx.lineTo(px + 9, py + 16 + bounce);
    ctx.lineTo(px - 9, py + 16 + bounce);
    ctx.closePath();
    ctx.fill();
    // Legs under skirt (animated when walking)
    ctx.fillStyle = "#ffe0c4";
    ctx.fillRect(px - 3, py + 14 + bounce + legSwing, 2, 4);
    ctx.fillRect(px + 1, py + 14 + bounce - legSwing, 2, 4);
    // Shoes
    ctx.fillStyle = colors.color1;
    ctx.fillRect(px - 4, py + 17 + bounce + legSwing, 3, 2);
    ctx.fillRect(px + 1, py + 17 + bounce - legSwing, 3, 2);
  } else {
    // Pants (animated when walking)
    ctx.fillStyle = "#4a5568";
    ctx.fillRect(px - 5, py + 10 + bounce + legSwing, 4, 7);
    ctx.fillRect(px + 1, py + 10 + bounce - legSwing, 4, 7);
    // Shoes
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(px - 5, py + 16 + bounce + legSwing, 4, 2);
    ctx.fillRect(px + 1, py + 16 + bounce - legSwing, 4, 2);
  }

  // Body / shirt
  ctx.fillStyle = colors.color1;
  if (isFemale) {
    // Slightly fitted top
    ctx.fillRect(px - 6, py - 2 + bounce, 12, 13);
    ctx.fillStyle = colors.color2;
    ctx.fillRect(px - 4, py - 1 + bounce, 8, 3);
  } else {
    ctx.fillRect(px - 7, py - 2 + bounce, 14, 13);
    // Collar
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(px - 3, py - 2 + bounce);
    ctx.lineTo(px, py + 1 + bounce);
    ctx.lineTo(px + 3, py - 2 + bounce);
    ctx.stroke();
  }

  // Arms
  ctx.fillStyle = colors.color1;
  ctx.fillRect(px - 9, py + bounce, 3, 10);
  ctx.fillRect(px + 6, py + bounce, 3, 10);
  // Hands
  ctx.fillStyle = "#ffe0c4";
  ctx.fillRect(px - 9, py + 9 + bounce, 3, 3);
  ctx.fillRect(px + 6, py + 9 + bounce, 3, 3);

  // Head
  ctx.fillStyle = "#ffe0c4";
  ctx.beginPath();
  ctx.arc(px, py - 8 + bounce + breathe, 9, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks (blush) - bigger for cute look
  ctx.fillStyle = "rgba(255, 140, 140, 0.25)";
  ctx.beginPath();
  ctx.arc(px - 5.5, py - 4.5 + bounce + breathe, 2.5, 0, Math.PI * 2);
  ctx.arc(px + 5.5, py - 4.5 + bounce + breathe, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Hair based on style
  ctx.fillStyle = colors.color3;
  switch (colors.hairStyle) {
    case "short": {
      // Male short hair - neat
      ctx.beginPath();
      ctx.arc(px, py - 10 + bounce + breathe, 9, Math.PI + 0.3, -0.3);
      ctx.fill();
      ctx.fillRect(px - 8, py - 12 + bounce + breathe, 16, 5);
      // Small fringe
      ctx.fillRect(px - 6, py - 9 + bounce + breathe, 4, 3);
      break;
    }
    case "ponytail": {
      // Female ponytail - long with side bangs
      ctx.beginPath();
      ctx.arc(px, py - 10 + bounce + breathe, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(px - 9, py - 12 + bounce + breathe, 18, 5);
      // Side bangs
      ctx.fillRect(px - 9, py - 9 + bounce + breathe, 3, 7);
      ctx.fillRect(px + 6, py - 9 + bounce + breathe, 3, 5);
      // Fringe / bangs across forehead
      ctx.fillRect(px - 6, py - 10 + bounce + breathe, 8, 3);
      // Ponytail at back
      ctx.fillStyle = colors.color3;
      ctx.beginPath();
      ctx.ellipse(px + 8, py - 4 + bounce + breathe, 3, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Hair tie
      ctx.fillStyle = colors.color2;
      ctx.beginPath();
      ctx.arc(px + 7, py - 8 + bounce + breathe, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "fluffy": {
      // Female fluffy/bob hair
      ctx.beginPath();
      ctx.arc(px, py - 9 + bounce + breathe, 10, 0, Math.PI * 2);
      ctx.fill();
      // Face cutout (skin showing through)
      ctx.fillStyle = "#ffe0c4";
      ctx.beginPath();
      ctx.arc(px, py - 7 + bounce + breathe, 7, 0, Math.PI * 2);
      ctx.fill();
      // Re-draw top hair
      ctx.fillStyle = colors.color3;
      ctx.beginPath();
      ctx.arc(px, py - 10 + bounce + breathe, 9.5, Math.PI + 0.2, -0.2);
      ctx.fill();
      ctx.fillRect(px - 9, py - 12 + bounce + breathe, 18, 6);
      // Cute bangs
      ctx.beginPath();
      ctx.arc(px - 3, py - 9 + bounce + breathe, 3, 0, Math.PI);
      ctx.arc(px + 3, py - 9 + bounce + breathe, 3, 0, Math.PI);
      ctx.fill();
      // Side puffs
      ctx.beginPath();
      ctx.arc(px - 8, py - 4 + bounce + breathe, 4, 0, Math.PI * 2);
      ctx.arc(px + 8, py - 4 + bounce + breathe, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "slick": {
      // Boss slicked-back hair
      ctx.beginPath();
      ctx.arc(px, py - 10 + bounce + breathe, 9, Math.PI + 0.2, -0.2);
      ctx.fill();
      ctx.fillRect(px - 8, py - 13 + bounce + breathe, 16, 5);
      // Slicked back lines
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - 4, py - 13 + bounce + breathe);
      ctx.quadraticCurveTo(px, py - 11 + bounce + breathe, px + 5, py - 13 + bounce + breathe);
      ctx.stroke();
      break;
    }
  }

  // Eyes - simple small dots with blinking
  const blinkCycle = frame % 200;
  const isBlinking = blinkCycle < 8;
  const eyeY = py - 7 + bounce + breathe;

  if (!isBlinking) {
    // Simple dot eyes
    ctx.fillStyle = "#2a2020";
    ctx.beginPath();
    ctx.arc(px - 3, eyeY, 1.5, 0, Math.PI * 2);
    ctx.arc(px + 3, eyeY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Tiny highlight
    ctx.fillStyle = "#fff";
    ctx.fillRect(px - 2, eyeY - 1, 1, 1);
    ctx.fillRect(px + 4, eyeY - 1, 1, 1);
  } else {
    // Blink - simple horizontal lines
    ctx.strokeStyle = "#2a2020";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - 4.5, eyeY);
    ctx.lineTo(px - 1.5, eyeY);
    ctx.moveTo(px + 1.5, eyeY);
    ctx.lineTo(px + 4.5, eyeY);
    ctx.stroke();
  }

  // Mouth
  if (isFemale) {
    // Small cat-like mouth
    ctx.strokeStyle = "#c07060";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - 1.5, py - 2.5 + bounce + breathe);
    ctx.quadraticCurveTo(px, py - 1.5 + bounce + breathe, px + 1.5, py - 2.5 + bounce + breathe);
    ctx.stroke();
  } else {
    // Simple smile
    ctx.strokeStyle = "#b06050";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py - 2.5 + bounce + breathe, 2, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }

  // Accessories
  switch (colors.accessory) {
    case "glasses": {
      ctx.strokeStyle = "#4a4a4a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px - 3.5, eyeY, 3.5, 0, Math.PI * 2);
      ctx.arc(px + 3.5, eyeY, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      // Bridge
      ctx.beginPath();
      ctx.moveTo(px - 0.5, eyeY);
      ctx.lineTo(px + 0.5, eyeY);
      ctx.stroke();
      // Arms of glasses
      ctx.beginPath();
      ctx.moveTo(px - 7, eyeY);
      ctx.lineTo(px - 8.5, eyeY - 1);
      ctx.moveTo(px + 7, eyeY);
      ctx.lineTo(px + 8.5, eyeY - 1);
      ctx.stroke();
      break;
    }
    case "bow": {
      // Hair bow
      ctx.fillStyle = colors.color2;
      const bowY = py - 15 + bounce + breathe;
      ctx.beginPath();
      ctx.ellipse(px + 5, bowY, 3, 2.5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + 9, bowY, 3, 2.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Center knot
      ctx.fillStyle = colors.color1;
      ctx.beginPath();
      ctx.arc(px + 7, bowY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "headband": {
      // Cute headband
      ctx.strokeStyle = colors.color2;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py - 10 + bounce + breathe, 9, Math.PI + 0.5, -0.5);
      ctx.stroke();
      // Small flower decoration
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px - 6, py - 14 + bounce + breathe, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.color2;
      ctx.beginPath();
      ctx.arc(px - 6, py - 14 + bounce + breathe, 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "tie": {
      // Necktie
      ctx.fillStyle = colors.color2;
      // Knot
      ctx.beginPath();
      ctx.moveTo(px - 2, py - 1 + bounce);
      ctx.lineTo(px + 2, py - 1 + bounce);
      ctx.lineTo(px + 1.5, py + 1 + bounce);
      ctx.lineTo(px - 1.5, py + 1 + bounce);
      ctx.closePath();
      ctx.fill();
      // Tie body
      ctx.beginPath();
      ctx.moveTo(px - 1.5, py + 1 + bounce);
      ctx.lineTo(px + 1.5, py + 1 + bounce);
      ctx.lineTo(px + 2, py + 9 + bounce);
      ctx.lineTo(px, py + 11 + bounce);
      ctx.lineTo(px - 2, py + 9 + bounce);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

function drawDonut(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const bob = Math.sin(frame * 0.1) * 1;
  // Donut body
  ctx.fillStyle = "#d4a060";
  ctx.beginPath();
  ctx.arc(x, y + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  // Frosting
  ctx.fillStyle = "#e8a0b0";
  ctx.beginPath();
  ctx.arc(x, y - 1 + bob, 5, Math.PI, 0);
  ctx.fill();
  // Hole
  ctx.fillStyle = "#c49050";
  ctx.beginPath();
  ctx.arc(x, y + bob, 2, 0, Math.PI * 2);
  ctx.fill();
  // Sprinkles
  ctx.fillStyle = "#90c8e8";
  ctx.fillRect(x - 3, y - 2 + bob, 1, 2);
  ctx.fillStyle = "#e8e080";
  ctx.fillRect(x + 1, y - 3 + bob, 2, 1);
  ctx.fillStyle = "#a8e0a0";
  ctx.fillRect(x + 2, y - 1 + bob, 1, 2);
}

function drawTV(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // TV screen glow effect near the agent
  const flicker = 0.6 + Math.sin(frame * 0.15) * 0.1;
  const color = frame % 60 < 20 ? `rgba(150,200,220,${flicker * 0.15})` :
                frame % 60 < 40 ? `rgba(200,180,150,${flicker * 0.15})` :
                                  `rgba(180,200,170,${flicker * 0.15})`;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 6, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawAngryEffect(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // Anger marks (the cross-shaped veins)
  const pulse = 1 + Math.sin(frame * 0.2) * 0.2;
  ctx.strokeStyle = "#c07060";
  ctx.lineWidth = 2 * pulse;

  // Top-right anger cross
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 20);
  ctx.lineTo(x + 14, y - 20);
  ctx.moveTo(x + 11, y - 23);
  ctx.lineTo(x + 11, y - 17);
  ctx.stroke();

  // Additional anger marks when really mad
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 18);
  ctx.lineTo(x - 6, y - 18);
  ctx.moveTo(x - 8, y - 20);
  ctx.lineTo(x - 8, y - 16);
  ctx.stroke();

  // Red tint around agent
  ctx.fillStyle = "rgba(200, 100, 100, 0.06)";
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();

  // Shaking effect is handled by the bounce parameter
}

function drawAgent(ctx: CanvasRenderingContext2D, agent: AgentData, frame: number) {
  const appearance = AGENT_APPEARANCE[agent.role] || AGENT_APPEARANCE.code;
  const px = agent.position.x * TILE_SIZE + TILE_SIZE / 2;
  const py = agent.position.y * TILE_SIZE + TILE_SIZE / 2;

  // Different animations per state
  let bounce = 0;
  if (agent.status === "working") {
    bounce = Math.sin(frame * 0.12) * 1.5;
  } else if (agent.status === "angry") {
    // Shaking when angry
    bounce = Math.sin(frame * 0.5) * 2;
  } else if (agent.action === "eating_donut") {
    bounce = Math.sin(frame * 0.08) * 0.8;
  }

  // TV glow effect if watching
  if (agent.action === "watching_tv") {
    drawTV(ctx, px, py, frame);
  }

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.beginPath();
  ctx.ellipse(px, py + 16, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw character
  const isWalking = agent.action === "walking";
  switch (appearance.type) {
    case "lobster":
      drawLobster(ctx, px, py, appearance, bounce, frame);
      break;
    case "human":
      drawHuman(ctx, px, py, appearance, bounce, frame, isWalking);
      break;
  }

  // Draw state-specific overlays
  if (agent.action === "eating_donut") {
    drawDonut(ctx, px + 12, py - 4 + bounce, frame);
  }

  if (agent.status === "angry") {
    drawAngryEffect(ctx, px, py, frame);
  }

  // Status bubble
  if (agent.status === "working") {
    ctx.fillStyle = "rgba(200, 192, 160, 0.9)";
    ctx.beginPath();
    ctx.arc(px + 14, py - 18 + bounce, 6, 0, Math.PI * 2);
    ctx.fill();
    const dotPhase = Math.floor(frame / 12) % 3;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i <= dotPhase ? "#6a5a4a" : "rgba(106,90,74,0.3)";
      ctx.beginPath();
      ctx.arc(px + 11 + i * 3, py - 18 + bounce, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (agent.status === "done") {
    ctx.fillStyle = "rgba(168, 200, 160, 0.9)";
    ctx.beginPath();
    ctx.arc(px + 14, py - 18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5a7a5a";
    ctx.font = "bold 8px monospace";
    ctx.fillText("✓", px + 11, py - 15);
  } else if (agent.status === "error") {
    ctx.fillStyle = "rgba(200, 160, 160, 0.9)";
    ctx.beginPath();
    ctx.arc(px + 14, py - 18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7a4040";
    ctx.font = "bold 8px monospace";
    ctx.fillText("!", px + 12, py - 15);
  } else if (agent.status === "angry") {
    // Angry speech bubble
    ctx.fillStyle = "rgba(200, 140, 140, 0.9)";
    ctx.beginPath();
    ctx.arc(px + 14, py - 22 + bounce, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "9px serif";
    ctx.fillText("💢", px + 8, py - 19 + bounce);
  }

  // Name tag
  ctx.font = "bold 7px monospace";
  const nameWidth = ctx.measureText(agent.name).width;
  ctx.fillStyle = "rgba(80,60,40,0.7)";
  ctx.fillRect(px - nameWidth / 2 - 3, py + 17, nameWidth + 6, 10);
  ctx.fillStyle = "#f0e8d8";
  ctx.textAlign = "center";
  ctx.fillText(agent.name, px, py + 24);
  ctx.textAlign = "left";

  // Emoji (for relaxing states)
  if (agent.emoji && agent.status !== "idle") {
    ctx.font = "11px serif";
    ctx.fillText(agent.emoji, px - 16, py - 16 + bounce);
  }
}

function updateDog(frame: number) {
  const dog = dogRef.current;
  dog.timer++;

  if (dog.state === "walking") {
    // Move toward target
    if (Math.abs(dog.x - dog.targetX) < 0.05 && Math.abs(dog.y - dog.targetY) < 0.05) {
      dog.x = dog.targetX;
      dog.y = dog.targetY;
      // Pick new behavior
      if (Math.random() < 0.02) {
        dog.state = Math.random() < 0.5 ? "sitting" : "sleeping";
        dog.timer = 0;
      } else if (Math.random() < 0.05) {
        // New target in garden area
        const gardenTiles: [number, number][] = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
          for (let x = 0; x < MAP_WIDTH; x++) {
            if (MAP[y][x] === 6 || MAP[y][x] === 8) {
              gardenTiles.push([x, y]);
            }
          }
        }
        if (gardenTiles.length > 0) {
          const target = gardenTiles[Math.floor(Math.random() * gardenTiles.length)];
          dog.targetX = target[0];
          dog.targetY = target[1];
          dog.direction = dog.targetX > dog.x ? 0 : 1;
        }
      }
    } else {
      const speed = 0.018;
      dog.x += (dog.targetX - dog.x) * speed;
      dog.y += (dog.targetY - dog.y) * speed;
    }
  } else {
    // Sitting or sleeping, eventually get up
    if (dog.timer > 200 && Math.random() < 0.01) {
      dog.state = "walking";
      dog.timer = 0;
    }
  }
}

// Interpolated positions and per-agent movement speeds
const smoothPositions: Record<string, { x: number; y: number; speed: number }> = {};

export default function PixelCanvas({ agents }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);
  const agentsRef = useRef<AgentData[]>(agents);
  agentsRef.current = agents;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = MAP_WIDTH * TILE_SIZE;
    canvas.height = MAP_HEIGHT * TILE_SIZE;

    function render() {
      frameRef.current++;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      // Draw map tiles
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          drawTile(ctx, x, y, MAP[y][x], frameRef.current);
        }
      }

      // Update and draw dog
      updateDog(frameRef.current);
      drawDog(ctx, dogRef.current, frameRef.current);

      // Update and draw cat
      updateCat(frameRef.current);
      drawCat(ctx, catRef.current, frameRef.current);

      // Draw NPCs
      for (const npc of npcsRef.current) {
        npc.frame = frameRef.current;
        drawNPC(ctx, npc, frameRef.current);
      }

      // Draw agents with smooth interpolation (each has unique speed)
      for (const agent of agentsRef.current) {
        if (!smoothPositions[agent.id]) {
          const isBoss = agent.role === "boss";
          smoothPositions[agent.id] = {
            x: agent.position.x,
            y: agent.position.y,
            speed: isBoss ? 0.008 : 0.01 + Math.random() * 0.012,
          };
        }
        const smooth = smoothPositions[agent.id];
        const targetX = agent.position.x;
        const targetY = agent.position.y;
        smooth.x += (targetX - smooth.x) * smooth.speed;
        smooth.y += (targetY - smooth.y) * smooth.speed;
        if (Math.abs(smooth.x - targetX) < 0.01) smooth.x = targetX;
        if (Math.abs(smooth.y - targetY) < 0.01) smooth.y = targetY;

        const interpolatedAgent = {
          ...agent,
          position: { x: smooth.x, y: smooth.y },
        };
        drawAgent(ctx, interpolatedAgent, frameRef.current);
      }

      animRef.current = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ maxWidth: "100%", maxHeight: "100%" }}
    />
  );
}
