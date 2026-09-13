import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

/**
 * Thin wrapper around react-force-graph-2d for the supply-chain network.
 *
 * Props:
 *  - nodes:        [{ id, label, type, risk }]
 *  - links:        [{ source, target, relation }]
 *  - riskFor:      (nodeId) => number   (projected/base risk 0-100)
 *  - companyNodeId
 *  - disruptedIds: Set<string>
 *  - highlightLinks: Set<string>  keyed as `${source}>${target}`
 *  - selectedId
 *  - onNodeClick:  (node) => void
 */
export function nodeColorForRisk(risk) {
  if (risk >= 70) return '#ef4444'; // red
  if (risk >= 40) return '#f59e0b'; // amber
  return '#22c55e'; // green
}

const COMPANY_COLOR = '#38bdf8';

const ForceGraph = ({
  nodes,
  links,
  riskFor,
  companyNodeId,
  disruptedIds,
  highlightLinks,
  selectedId,
  onNodeClick,
  height = 460,
}) => {
  const fgRef = useRef();
  const wrapRef = useRef();
  const [width, setWidth] = useState(600);

  // Size the canvas to its container instead of the window.
  useEffect(() => {
    if (!wrapRef.current) return undefined;
    const el = wrapRef.current;
    const measure = () => setWidth(el.clientWidth || 600);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Stable graph data — react-force-graph mutates node/link objects (x/y),
  // so we only rebuild when the underlying topology changes.
  const graphData = useMemo(() => {
    const topo = nodes.map((n) => n.id).join(',') + '|' + links.map((l) => `${l.source}-${l.target}`).join(',');
    return {
      _topo: topo,
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.map((n) => n.id).join(','), links.map((l) => `${l.source}-${l.target}`).join(',')]);

  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      const isCompany = node.id === companyNodeId;
      const risk = riskFor ? riskFor(node.id) : node.risk ?? 0;
      const r = isCompany ? 12 : 8 + Math.min(Math.max(risk, 0), 100) / 35;
      const disrupted = disruptedIds?.has(node.id);
      const selected = node.id === selectedId;

      const nodeColor = isCompany ? COMPANY_COLOR : nodeColorForRisk(risk);
      const headRadius = r * 0.38;
      const bodyWidth = r * 1.45;
      const bodyHeight = r * 0.95;
      ctx.fillStyle = nodeColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / globalScale;

      ctx.beginPath();
      ctx.arc(node.x, node.y - r * 0.42, headRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(node.x - bodyWidth / 2, node.y + r * 0.03, bodyWidth, bodyHeight, bodyHeight / 2);
      ctx.fill();
      ctx.stroke();
      if (disrupted) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI);
        ctx.lineWidth = 2.5 / globalScale;
        ctx.strokeStyle = '#f43f5e';
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (selected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI);
        ctx.lineWidth = 1.5 / globalScale;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
      }

      const label = node.label || node.id;
      const fontSize = Math.max(10 / globalScale, 3);
      const detailSize = Math.max(8 / globalScale, 2.5);
      ctx.font = `600 ${fontSize}px 'PT Serif', Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      if (globalScale > 0.55) {
        ctx.fillText(label, node.x, node.y + r + 2);
        ctx.font = `${detailSize}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#f5f5f5';
        const typeLabel = isCompany ? 'COMPANY' : (node.type || 'SUPPLIER').toUpperCase();
        ctx.fillText(`${typeLabel} · RISK ${Math.round(risk)}`, node.x, node.y + r + fontSize + 4);
      }
    },
    [companyNodeId, riskFor, disruptedIds, selectedId],
  );

  const linkColor = useCallback(
    (link) => {
      const key = `${typeof link.source === 'object' ? link.source.id : link.source}>${
        typeof link.target === 'object' ? link.target.id : link.target
      }`;
      return '#ffffff';
    },
    [highlightLinks],
  );

  const linkWidth = useCallback(
    (link) => {
      const key = `${typeof link.source === 'object' ? link.source.id : link.source}>${
        typeof link.target === 'object' ? link.target.id : link.target
      }`;
      return highlightLinks?.has(key) ? 2.5 : 1.4;
    },
    [highlightLinks],
  );

  return (
    <div className="force-graph-wrap" ref={wrapRef} style={{ height }}>
      <div className="force-graph-grid" aria-hidden="true" />
      <ForceGraph2D
        ref={fgRef}
        width={width}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={6}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={0.82}
        linkDirectionalArrowColor={linkColor}
        linkDirectionalParticles={(link) => {
          const key = `${typeof link.source === 'object' ? link.source.id : link.source}>${
            typeof link.target === 'object' ? link.target.id : link.target
          }`;
          return highlightLinks?.has(key) ? 3 : 0;
        }}
        linkDirectionalParticleColor={() => '#ffffff'}
        linkDirectionalParticleWidth={2}
        onNodeClick={onNodeClick}
        cooldownTicks={80}
        height={height}
      />
    </div>
  );
};

export default ForceGraph;
