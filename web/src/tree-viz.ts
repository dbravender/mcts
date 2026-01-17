import * as d3 from 'd3';
import type { TreeNodeInfo } from '../../src/index';

interface D3TreeNode {
  name: string;
  visits: number;
  winRate: number;
  children?: D3TreeNode[];
}

// Convert MCTS tree to D3 hierarchy format
export function convertToD3Tree<TMove>(
  node: TreeNodeInfo<TMove>,
  formatMove: (move: TMove | null) => string,
  maxDepth: number = 3
): D3TreeNode {
  const d3Node: D3TreeNode = {
    name: node.move === null ? 'Root' : formatMove(node.move),
    visits: node.visits,
    winRate: node.winRate,
  };

  if (maxDepth > 0 && node.children.length > 0) {
    // Sort by visits and take top children
    const sortedChildren = [...node.children]
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 7);

    d3Node.children = sortedChildren.map((child) =>
      convertToD3Tree(child, formatMove, maxDepth - 1)
    );
  }

  return d3Node;
}

// Color scale based on visits (relative to max in tree)
function getColorByVisits(visits: number, maxVisits: number): string {
  if (maxVisits === 0) return '#64748b';
  const ratio = visits / maxVisits;

  // Color gradient from red (low) -> yellow (medium) -> green (high)
  if (ratio > 0.6) {
    // Green range
    const intensity = (ratio - 0.6) / 0.4;
    return d3.interpolateRgb('#22c55e', '#14b8a6')(intensity);
  } else if (ratio > 0.2) {
    // Yellow range
    const intensity = (ratio - 0.2) / 0.4;
    return d3.interpolateRgb('#f59e0b', '#22c55e')(intensity);
  } else {
    // Red range
    const intensity = ratio / 0.2;
    return d3.interpolateRgb('#ef4444', '#f59e0b')(intensity);
  }
}

// Find max visits in tree
function findMaxVisits(node: D3TreeNode): number {
  let max = node.visits;
  if (node.children) {
    for (const child of node.children) {
      max = Math.max(max, findMaxVisits(child));
    }
  }
  return max;
}

// Render D3 tree visualization
export function renderD3Tree(
  container: HTMLElement,
  treeData: D3TreeNode
): void {
  // Clear previous content
  container.innerHTML = '';

  if (treeData.visits === 0) {
    container.innerHTML =
      '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No simulations yet...</p>';
    return;
  }

  const maxVisits = findMaxVisits(treeData);

  // Set dimensions
  const containerRect = container.getBoundingClientRect();
  const width = Math.max(containerRect.width - 20, 400);
  const height = Math.max(350, Math.min(500, width * 0.6));
  const margin = { top: 30, right: 120, bottom: 30, left: 60 };

  // Create SVG
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('style', 'max-width: 100%; height: auto;');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create tree layout
  const treeLayout = d3
    .tree<D3TreeNode>()
    .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

  // Create hierarchy
  const root = d3.hierarchy(treeData);
  const treeNodes = treeLayout(root);

  // Draw links
  g.selectAll('.link')
    .data(treeNodes.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#475569')
    .attr('stroke-width', (d) => {
      const targetVisits = (d.target.data as D3TreeNode).visits;
      return Math.max(1, Math.min(4, (targetVisits / maxVisits) * 4));
    })
    .attr('stroke-opacity', 0.6)
    .attr(
      'd',
      d3
        .linkHorizontal<d3.HierarchyPointLink<D3TreeNode>, d3.HierarchyPointNode<D3TreeNode>>()
        .x((d) => d.y)
        .y((d) => d.x)
    );

  // Draw nodes
  const node = g
    .selectAll('.node')
    .data(treeNodes.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${d.y},${d.x})`);

  // Node circles
  node
    .append('circle')
    .attr('r', (d) => {
      const visits = (d.data as D3TreeNode).visits;
      return Math.max(6, Math.min(20, 6 + (visits / maxVisits) * 14));
    })
    .attr('fill', (d) => getColorByVisits((d.data as D3TreeNode).visits, maxVisits))
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 2)
    .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

  // Node labels (move name)
  node
    .append('text')
    .attr('dy', -15)
    .attr('text-anchor', 'middle')
    .attr('fill', '#f8fafc')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .text((d) => (d.data as D3TreeNode).name);

  // Visit count labels
  node
    .append('text')
    .attr('dy', 4)
    .attr('text-anchor', 'middle')
    .attr('fill', '#1e293b')
    .attr('font-size', '9px')
    .attr('font-weight', 'bold')
    .text((d) => {
      const visits = (d.data as D3TreeNode).visits;
      if (visits >= 1000) {
        return `${(visits / 1000).toFixed(1)}k`;
      }
      return String(visits);
    });

  // Add legend
  const legend = svg
    .append('g')
    .attr('transform', `translate(${width - 110}, 10)`);

  legend
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', '#94a3b8')
    .attr('font-size', '10px')
    .text('Visits:');

  const legendColors = [
    { label: 'High', color: '#14b8a6' },
    { label: 'Med', color: '#f59e0b' },
    { label: 'Low', color: '#ef4444' },
  ];

  legendColors.forEach((item, i) => {
    legend
      .append('circle')
      .attr('cx', 5 + i * 30)
      .attr('cy', 15)
      .attr('r', 5)
      .attr('fill', item.color);

    legend
      .append('text')
      .attr('x', 12 + i * 30)
      .attr('y', 18)
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px')
      .text(item.label);
  });
}
