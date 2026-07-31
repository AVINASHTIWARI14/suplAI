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
      const r = isCompany ? 9 : 6;
      const disrupted = disruptedIds?.has(node.id);
      const selected = node.id === selectedId;

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isCompany ? COMPANY_COLOR : nodeColorForRisk(risk);
      ctx.fill();

      if (isCompany) {
        ctx.lineWidth = 2 / globalScale;
        ctx.strokeStyle = '#0b1220';
        ctx.stroke();
      }
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
      ctx.font = `${fontSize}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#cbd5e1';
      if (globalScale > 0.7) ctx.fillText(label, node.x, node.y + r + 2);
    },
    [companyNodeId, riskFor, disruptedIds, selectedId],
  );

  const linkColor = useCallback(
    (link) => {
      const key = `${typeof link.source === 'object' ? link.source.id : link.source}>${
        typeof link.target === 'object' ? link.target.id : link.target
      }`;
      if (highlightLinks?.has(key)) return '#f43f5e';
      return 'rgba(148,163,184,0.25)';
    },
    [highlightLinks],
  );

  const linkWidth = useCallback(
    (link) => {
      const key = `${typeof link.source === 'object' ? link.source.id : link.source}>${
        typeof link.target === 'object' ? link.target.id : link.target
      }`;
      return highlightLinks?.has(key) ? 2.5 : 1;
    },
    [highlightLinks],
  );

  return (
    <div className="force-graph-wrap" ref={wrapRef} style={{ height }}>
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
        linkDirectionalParticles={(link) => {
          const key = `${typeof link.source === 'object' ? link.source.id : link.source}>${
            typeof link.target === 'object' ? link.target.id : link.target
          }`;
          return highlightLinks?.has(key) ? 3 : 0;
        }}
        linkDirectionalParticleColor={() => '#f43f5e'}
        linkDirectionalParticleWidth={2}
        onNodeClick={onNodeClick}
        cooldownTicks={80}
        height={height}
      />
    </div>
  );
};

export default ForceGraph;
