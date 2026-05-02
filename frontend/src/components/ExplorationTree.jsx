import { useState, useEffect, useRef } from 'react'
import './ExplorationTree.css'

const NODE_WIDTH = 120
const NODE_HEIGHT = 50
const HORIZONTAL_SPACING = 40
const VERTICAL_SPACING = 100

// Simple tree layout algorithm: calculate positions for all nodes
function calculateTreeLayout(tree, rootId) {
  if (!rootId || tree.length === 0) return {}

  const positions = {}
  const childrenMap = {}

  // Build children map
  tree.forEach(node => {
    if (node.parentId !== null) {
      if (!childrenMap[node.parentId]) childrenMap[node.parentId] = []
      childrenMap[node.parentId].push(node.id)
    }
  })

  // Calculate subtree widths (number of leaf nodes)
  function getSubtreeWidth(nodeId) {
    const children = childrenMap[nodeId] || []
    if (children.length === 0) return 1
    return children.reduce((sum, childId) => sum + getSubtreeWidth(childId), 0)
  }

  // Layout nodes recursively
  function layoutNode(nodeId, x, y, parentX = null) {
    positions[nodeId] = { x, y, parentX }

    const children = childrenMap[nodeId] || []
    if (children.length === 0) return

    const subtreeWidth = getSubtreeWidth(nodeId)
    const totalWidth = subtreeWidth * NODE_WIDTH + (subtreeWidth - 1) * HORIZONTAL_SPACING

    let currentX = x - totalWidth / 2

    children.forEach(childId => {
      const childSubtreeWidth = getSubtreeWidth(childId)
      const childWidth = childSubtreeWidth * NODE_WIDTH + (childSubtreeWidth - 1) * HORIZONTAL_SPACING
      const childX = currentX + childWidth / 2

      layoutNode(childId, childX, y + VERTICAL_SPACING, x)
      currentX += childWidth + HORIZONTAL_SPACING
    })
  }

  const rootNode = tree.find(n => n.id === rootId)
  if (rootNode && rootNode.parentId === null) {
    layoutNode(rootId, 0, 0)
  }

  return positions
}

// Find root node
function findRootNode(tree) {
  return tree.find(n => n.parentId === null)
}

// Get top SHAP contributor
function getTopContributor(result) {
  if (!result?.contributing_factors || result.contributing_factors.length === 0) {
    return { feature: 'N/A', impact: 0 }
  }
  return result.contributing_factors.reduce((max, f) =>
    Math.abs(f.impact) > Math.abs(max.impact) ? f : max
  )
}

function TreeNode({ node, position, isActive, onNavigate, onHover, onLeave }) {
  const isPositive = node.result?.prediction === 'BBB+'
  const probability = node.result?.probability || 0

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      className={`tree-node ${isActive ? 'tree-node-active' : ''}`}
      onClick={() => onNavigate(node.id)}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={onLeave}
    >
      {/* Node rectangle */}
      <rect
        x={-NODE_WIDTH / 2}
        y={-NODE_HEIGHT / 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        className={`tree-node-rect ${isPositive ? 'tree-node-positive' : 'tree-node-negative'} ${
          isActive ? 'tree-node-rect-active' : ''
        }`}
        rx="8"
      />

      {/* Active node glow */}
      {isActive && (
        <rect
          x={-NODE_WIDTH / 2}
          y={-NODE_HEIGHT / 2}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          className={`tree-node-glow ${isPositive ? 'tree-node-glow-positive' : 'tree-node-glow-negative'}`}
          rx="8"
        />
      )}

      {/* Compound name */}
      <text
        x="0"
        y="-8"
        className="tree-node-name"
        textAnchor="middle"
      >
        {node.name.length > 14 ? node.name.substring(0, 12) + '...' : node.name}
      </text>

      {/* BBB status dot and probability */}
      <g transform="translate(-30, 8)">
        <circle
          cx="0"
          cy="0"
          r="4"
          className={isPositive ? 'tree-node-dot-positive' : 'tree-node-dot-negative'}
        />
        <text x="10" y="4" className="tree-node-probability">
          {probability.toFixed(1)}%
        </text>
      </g>
    </g>
  )
}

function GhostNode({ compound, position, onExplore, onHover, onLeave }) {
  const isPositive = compound.bbb_status === 'BBB+'

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      className="tree-node tree-ghost-node"
      onClick={() => onExplore(compound.name)}
      onMouseEnter={() => onHover(compound, true)}
      onMouseLeave={onLeave}
    >
      {/* Ghost node rectangle */}
      <rect
        x={-NODE_WIDTH / 2}
        y={-NODE_HEIGHT / 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        className={`tree-ghost-rect ${isPositive ? 'tree-ghost-positive' : 'tree-ghost-negative'}`}
        rx="8"
      />

      {/* Compound name */}
      <text
        x="0"
        y="-8"
        className="tree-ghost-name"
        textAnchor="middle"
      >
        {compound.name.length > 14 ? compound.name.substring(0, 12) + '...' : compound.name}
      </text>

      {/* BBB status */}
      <g transform="translate(0, 8)">
        <circle
          cx="-15"
          cy="0"
          r="3"
          className={isPositive ? 'tree-node-dot-positive' : 'tree-node-dot-negative'}
          opacity="0.5"
        />
        <text x="-8" y="4" className="tree-ghost-status">
          {compound.bbb_status}
        </text>
      </g>
    </g>
  )
}

function ConnectionLine({ from, to }) {
  // Create a curved bezier path
  const midY = (from.y + to.y) / 2
  const path = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`

  return (
    <path
      d={path}
      className="tree-connection"
      fill="none"
    />
  )
}

function Tooltip({ node, isGhost, mouseX, mouseY }) {
  if (!node) return null

  const topContributor = !isGhost && node.result ? getTopContributor(node.result) : null

  return (
    <div
      className="tree-tooltip"
      style={{
        left: mouseX + 15,
        top: mouseY - 30
      }}
    >
      <div className="tree-tooltip-name">{node.name}</div>
      {!isGhost && node.features && (
        <>
          <div className="tree-tooltip-row">
            MW: {node.features.MW} | LogP: {node.features.LogP}
          </div>
          {topContributor && (
            <div className="tree-tooltip-row">
              Top: {topContributor.feature} ({topContributor.impact > 0 ? '+' : ''}
              {topContributor.impact.toFixed(3)})
            </div>
          )}
        </>
      )}
      {isGhost && (
        <div className="tree-tooltip-row">
          MW: {node.MW} | LogP: {node.LogP}
        </div>
      )}
    </div>
  )
}

export default function ExplorationTree({
  tree,
  currentNodeId,
  onNavigateToNode,
  onExploreCompound,
  onResetExploration
}) {
  const [hoveredNode, setHoveredNode] = useState(null)
  const [isGhostHovered, setIsGhostHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)

  const rootNode = findRootNode(tree)
  const positions = rootNode ? calculateTreeLayout(tree, rootNode.id) : {}

  // Calculate viewBox dimensions
  const allPositions = Object.values(positions)
  const minX = allPositions.length > 0 ? Math.min(...allPositions.map(p => p.x)) - NODE_WIDTH : 0
  const maxX = allPositions.length > 0 ? Math.max(...allPositions.map(p => p.x)) + NODE_WIDTH : 0
  const minY = allPositions.length > 0 ? Math.min(...allPositions.map(p => p.y)) - NODE_HEIGHT : 0
  const maxY = allPositions.length > 0 ? Math.max(...allPositions.map(p => p.y)) + NODE_HEIGHT : 0

  const viewBoxWidth = maxX - minX + 100
  const viewBoxHeight = maxY - minY + 100
  const viewBoxX = minX - 50
  const viewBoxY = minY - 50

  // Get ghost nodes (similar compounds from current node not already in tree)
  const currentNode = tree.find(n => n.id === currentNodeId)
  const ghostCompounds = currentNode?.result?.similar_compounds?.filter(
    sc => !tree.some(n => n.name === sc.name)
  ).slice(0, 3) || []

  // Position ghost nodes below current node
  const currentPos = currentNodeId ? positions[currentNodeId] : null
  const ghostPositions = ghostCompounds.map((_, idx) => ({
    x: currentPos ? currentPos.x + (idx - 1) * (NODE_WIDTH + HORIZONTAL_SPACING) : 0,
    y: currentPos ? currentPos.y + VERTICAL_SPACING : 0
  }))

  function handleMouseMove(e) {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="exploration-tree-panel">
      <div className="exploration-tree-header">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Exploration Map
          </h3>
          <p className="text-[11px] text-slate-500">
            Your compound discovery journey
          </p>
        </div>
        <button
          onClick={onResetExploration}
          className="exploration-reset-btn"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>

      <div className="exploration-tree-canvas">
        <svg
          ref={svgRef}
          viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
          className="exploration-tree-svg"
          preserveAspectRatio="xMidYMin meet"
        >
          {/* Draw connections */}
          {tree.map(node => {
            if (!node.parentId || !positions[node.id] || !positions[node.parentId]) return null
            return (
              <ConnectionLine
                key={`conn-${node.id}`}
                from={positions[node.parentId]}
                to={positions[node.id]}
              />
            )
          })}

          {/* Draw ghost connections */}
          {ghostCompounds.map((_, idx) => {
            if (!currentPos) return null
            return (
              <ConnectionLine
                key={`ghost-conn-${idx}`}
                from={currentPos}
                to={ghostPositions[idx]}
              />
            )
          })}

          {/* Draw tree nodes */}
          {tree.map(node => {
            if (!positions[node.id]) return null
            return (
              <TreeNode
                key={node.id}
                node={node}
                position={positions[node.id]}
                isActive={node.id === currentNodeId}
                onNavigate={onNavigateToNode}
                onHover={(n) => {
                  setHoveredNode(n)
                  setIsGhostHovered(false)
                }}
                onLeave={() => setHoveredNode(null)}
              />
            )
          })}

          {/* Draw ghost nodes */}
          {ghostCompounds.map((compound, idx) => (
            <GhostNode
              key={`ghost-${idx}`}
              compound={compound}
              position={ghostPositions[idx]}
              onExplore={onExploreCompound}
              onHover={(c) => {
                setHoveredNode(c)
                setIsGhostHovered(true)
              }}
              onLeave={() => setHoveredNode(null)}
            />
          ))}
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredNode && (
        <Tooltip
          node={hoveredNode}
          isGhost={isGhostHovered}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
        />
      )}
    </div>
  )
}
