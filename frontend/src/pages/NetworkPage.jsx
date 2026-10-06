import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';

import ForceGraph, {
  nodeColorForRisk,
} from '../components/ForceGraph.jsx';

import {
  fetchGraph,
  simulateGraph,
} from '../api/client.js';

const nodeRisk = (n) =>
  n.risk_score ??
  n.base_risk ??
  n.risk ??
  n.score ??
  0;

const NetworkPage = ({
  companyId,
}) => {
  const [graph, setGraph] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [disrupted, setDisrupted] =
    useState(() => new Set());

  const [sim, setSim] =
    useState(null);

  const [simBusy, setSimBusy] =
    useState(false);

  const [simError, setSimError] =
    useState(null);

  const [selectedId, setSelectedId] =
    useState(null);

  const [pendingSupplierId, setPendingSupplierId] =
    useState(null);

  const [removedIds, setRemovedIds] =
    useState(() => new Set());

  /* Prevent the same company graph from being fetched twice on
     React StrictMode's development-only effect re-run. */
  const graphFetchStartedForRef = useRef(null);

  /* =========================================================
     GRAPH HEIGHT
     ========================================================= */

  const [graphHeight, setGraphHeight] =
    useState(() =>
      typeof window !== 'undefined'
        ? Math.max(
            520,
            window.innerHeight,
          )
        : 600,
    );

  useEffect(() => {
    const updateHeight = () => {
      setGraphHeight(
        Math.max(
          520,
          window.innerHeight,
        ),
      );
    };

    updateHeight();

    window.addEventListener(
      'resize',
      updateHeight,
    );

    return () =>
      window.removeEventListener(
        'resize',
        updateHeight,
      );
  }, []);

  /* =========================================================
     FETCH GRAPH
     ========================================================= */

  useEffect(() => {
    if (!companyId) {
      return;
    }

    /*
       React 18+ may run effects twice in development under StrictMode.
       Keep one request per company so the graph does not visibly reload
       twice when the Network page mounts. A different company id still
       fetches normally.
    */
    if (graphFetchStartedForRef.current === companyId) {
      return;
    }

    graphFetchStartedForRef.current = companyId;

    setLoading(true);
    setError(null);
    setDisrupted(new Set());
    setSim(null);
    setSelectedId(null);
    setPendingSupplierId(null);
    setRemovedIds(new Set());

    fetchGraph(companyId)
      .then((data) => {
        setGraph(data);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.detail ||
            err.message ||
            'Failed to load network',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [companyId]);

  /* =========================================================
     NODES
     ========================================================= */

  const nodes = useMemo(() => {
    const raw =
      graph?.nodes ?? [];

    return raw
      .filter((n) => !removedIds.has(n.id))
      .map((n) => ({
        id: n.id,

        label:
          n.label ||
          n.name ||
          n.id,

        type: n.type,

        risk: nodeRisk(n),
      }));
  }, [graph, removedIds]);

  /* =========================================================
     LINKS
     ========================================================= */

  const links = useMemo(() => {
    const raw =
      graph?.edges ??
      graph?.links ??
      [];

    return raw
      .filter(
        (e) =>
          !removedIds.has(e.source) &&
          !removedIds.has(e.target),
      )
      .map((e) => ({
        source: e.source,
        target: e.target,
        relation: e.relation,
      }));
  }, [graph, removedIds]);

  /* =========================================================
     COMPANY NODE
     ========================================================= */

  const companyNodeId =
    useMemo(() => {
      const company =
        (
          graph?.nodes ?? []
        ).find(
          (n) =>
            n.type ===
            'company',
        );

      return company?.id ?? null;
    }, [graph]);

  /* =========================================================
     SUPPLIER DIRECTORY
     ========================================================= */

  const supplierNodes = useMemo(
    () =>
      nodes.filter(
        (node) => node.type === 'supplier',
      ),
    [nodes],
  );
  /* =========================================================
     PROJECTED RISK
     ========================================================= */

  const projectedMap =
    useMemo(() => {
      if (
        !sim?.affected_nodes
      ) {
        return null;
      }

      const map =
        new Map();

      sim.affected_nodes.forEach(
        (item) => {
          map.set(
            item.id,
            item.projected_risk,
          );
        },
      );

      return map;
    }, [sim]);

  /* =========================================================
     RISK LOOKUP
     ========================================================= */

  const riskFor =
    useCallback(
      (id) => {
        if (
          projectedMap &&
          projectedMap.has(id)
        ) {
          return projectedMap.get(
            id,
          );
        }

        const node =
          nodes.find(
            (item) =>
              item.id === id,
          );

        return node
          ? node.risk
          : 0;
      },
      [
        projectedMap,
        nodes,
      ],
    );

  /* =========================================================
     HIGHLIGHT CASCADE LINKS
     ========================================================= */

  const highlightLinks =
    useMemo(() => {
      const set =
        new Set();

      (
        sim?.cascade_edges ??
        []
      ).forEach((edge) => {
        set.add(
          `${edge.source}>${edge.target}`,
        );
      });

      return set;
    }, [sim]);

  /* =========================================================
     TOGGLE NODE DISRUPTION
     ========================================================= */

  const toggleDisrupted =
    useCallback(
      (node) => {
        const id =
          typeof node ===
          'object'
            ? node.id
            : node;

        setSelectedId(id);

        if (
          typeof node === 'object' &&
          node.type === 'supplier'
        ) {
          setPendingSupplierId(id);
        }

        setDisrupted(
          (previous) => {
            const next =
              new Set(
                previous,
              );

            if (
              next.has(id)
            ) {
              next.delete(id);
            } else {
              next.add(id);
            }

            return next;
          },
        );
      },
      [],
    );

  /* =========================================================
     SELECT NODE FROM DIRECTORY
     ========================================================= */

  const selectFromDirectory = useCallback(
    (nodeId) => {
      setPendingSupplierId(nodeId);
    },
    [],
  );

  const selectPendingSupplier = useCallback(() => {
    if (!pendingSupplierId) {
      return;
    }

    setSelectedId(pendingSupplierId);
  }, [pendingSupplierId]);

  /* =========================================================
     RUN SIMULATION
     ========================================================= */

  const runSimulation =
    async () => {
      if (
        !disrupted.size
      ) {
        return;
      }

      setSimBusy(true);
      setSimError(null);

      try {
        const result =
          await simulateGraph(
            companyId,
            Array.from(
              disrupted,
            ),
          );

        setSim(result);
      } catch (err) {
        setSimError(
          err?.response?.data
            ?.detail ||
            err.message ||
            'Simulation failed',
        );
      } finally {
        setSimBusy(false);
      }
    };

  /* =========================================================
     RESET
     ========================================================= */

  const reset = () => {
    setDisrupted(
      new Set(),
    );

    setSim(null);

    setSimError(null);

    setSelectedId(null);
  };

  /* =========================================================
     SELECTED NODE
     ========================================================= */

  const selectedNode =
    selectedId
      ? nodes.find(
          (node) =>
            node.id ===
            selectedId,
        )
      : null;

  const removeSelectedNode = useCallback(() => {
    const id =
      pendingSupplierId ||
      selectedId;

    if (!id) {
      return;
    }

    const node =
      nodes.find(
        (item) => item.id === id,
      );

    if (!node || node.type !== 'supplier') {
      return;
    }

    setRemovedIds((previous) => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });

    setDisrupted((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });

    setSelectedId((current) =>
      current === id ? null : current,
    );

    setPendingSupplierId((current) =>
      current === id ? null : current,
    );
  }, [pendingSupplierId, selectedId, nodes]);

  /* =========================================================
     SELECTED NODE DEPENDENCIES
     ========================================================= */

  const selectedDeps =
    useMemo(() => {
      if (!selectedId) {
        return [];
      }

      const byId =
        Object.fromEntries(
          nodes.map(
            (node) => [
              node.id,
              node,
            ],
          ),
        );

      const deps = [];

      links.forEach(
        (link) => {
          if (
            link.source ===
              selectedId &&
            byId[
              link.target
            ]
          ) {
            deps.push({
              dir: 'out',
              node:
                byId[
                  link.target
                ],
              relation:
                link.relation,
            });
          }

          if (
            link.target ===
              selectedId &&
            byId[
              link.source
            ]
          ) {
            deps.push({
              dir: 'in',
              node:
                byId[
                  link.source
                ],
              relation:
                link.relation,
            });
          }
        },
      );

      return deps;
    }, [
      selectedId,
      nodes,
      links,
    ]);

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div
        className="page-body network-page network-loading-fullscreen"
        aria-busy="true"
      >
        <span
          className="dashboard-loading-spinner"
          role="status"
          aria-label="Loading network"
        />
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error) {
    return (
      <div className="page-body error-state">
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Could not load network
        </h2>

        <p>
          {error}
        </p>
      </div>
    );
  }

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="network-page">

      {/* =====================================================
          FULL PAGE GRAPH
          ===================================================== */}

      <div
        className="network-background"
      >
        {nodes.length ? (
          <ForceGraph
            nodes={nodes}
            links={links}
            riskFor={riskFor}
            companyNodeId={
              companyNodeId
            }
            disruptedIds={
              disrupted
            }
            highlightLinks={
              highlightLinks
            }
            selectedId={
              selectedId
            }
            onNodeClick={
              toggleDisrupted
            }
            height={
              graphHeight
            }
          />
        ) : (
          <div className="empty-state network-empty-state">
            No graph nodes for this company.
          </div>
        )}
      </div>

      {/* =====================================================
          CONTENT OVER GRAPH
          ===================================================== */}

      <div className="network-overlay">

        {/* ===================================================
            HEADER
            =================================================== */}

        <div className="network-page-header">

          <h1>
            Network &amp; What-If Simulation
          </h1>

          <p>
            Click nodes to mark them{' '}
            <strong>
              disrupted
            </strong>
            , then run a cascade
            simulation across the
            dependency graph.
          </p>

        </div>

        {/* ===================================================
            LEGEND
            =================================================== */}

        <div className="network-legend">

          <span className="network-legend-item">
            <span className="network-legend-dot legend-company" />
            Company
          </span>

          <span className="network-legend-item">
            <span className="network-legend-dot legend-low" />
            Low
          </span>

          <span className="network-legend-item">
            <span className="network-legend-dot legend-medium" />
            Med
          </span>

          <span className="network-legend-item">
            <span className="network-legend-dot legend-high" />
            High
          </span>

        </div>

        {/* ===================================================
            RIGHT SIDE
            =================================================== */}

        <aside className="network-side">

          {/* =================================================
              WHAT-IF
              ================================================= */}

          <section className="network-overlay-card">

            <h3 className="network-card-title">
              WHAT-IF SIMULATION
            </h3>

            <div className="network-disrupted-count">

              <span className="network-disrupted-number">
                {disrupted.size}
              </span>

              <span>
                node
                {disrupted.size ===
                1
                  ? ''
                  : 's'}{' '}
                marked disrupted
              </span>

            </div>

            <div className="network-action-row">

              <button
                type="button"
                className="network-run-button"
                disabled={
                  !disrupted.size ||
                  simBusy
                }
                onClick={
                  runSimulation
                }
              >
                {simBusy
                  ? 'Simulating…'
                  : 'Run simulation'}
              </button>

              <button
                type="button"
                className="network-reset-button"
                onClick={
                  reset
                }
                disabled={
                  !disrupted.size &&
                  !sim
                }
              >
                Resolve / Reset
              </button>

            </div>

            {simError && (
              <div className="network-sim-error">
                {simError}
              </div>
            )}

            {/* ---------------------------------------------
                SIMULATION RESULT
                --------------------------------------------- */}

            {sim && (
              <div className="network-sim-summary">

                <div className="network-sim-metric">
                  <span className="network-metric-number danger">
                    {sim.nodes_affected}
                  </span>

                  <span>
                    nodes affected
                  </span>
                </div>

                <div className="network-sim-metric">
                  <span className="network-metric-number warning">
                    {
                      sim.critical_paths_broken
                    }
                  </span>

                  <span>
                    critical paths broken
                  </span>
                </div>

                <div className="network-risk-delta">

                  <span>
                    Network risk
                  </span>

                  <div className="network-risk-values">

                    <span>
                      {Math.round(
                        sim.overall_risk_before,
                      )}
                    </span>

                    <span>
                      →
                    </span>

                    <strong
                      style={{
                        color:
                          nodeColorForRisk(
                            sim.overall_risk_after,
                          ),
                      }}
                    >
                      {Math.round(
                        sim.overall_risk_after,
                      )}
                    </strong>

                  </div>

                </div>

              </div>
            )}

          </section>

          {/* =================================================
              NODE DETAILS
              ================================================= */}

          <section className="network-overlay-card">

            <h3 className="network-card-title">
              NODE DETAILS
            </h3>

            {selectedNode ? (
              <div>

                <div className="network-node-detail-head">

                  <div>

                    <div className="network-selected-name">
                      {
                        selectedNode.label
                      }
                    </div>

                    <div className="network-selected-type">
                      {selectedNode.type ||
                        'node'}

                      {disrupted.has(
                        selectedNode.id,
                      )
                        ? ' · disrupted'
                        : ''}
                    </div>

                  </div>

                  <span
                    className="network-selected-risk"
                    style={{
                      color:
                        nodeColorForRisk(
                          riskFor(
                            selectedNode.id,
                          ),
                        ),
                    }}
                  >
                    {Math.round(
                      riskFor(
                        selectedNode.id,
                      ),
                    )}
                  </span>

                </div>

                <div className="network-dependency-list">

                  <div className="network-dependency-title">
                    Direct dependencies
                  </div>

                  {selectedDeps.length ? (
                    selectedDeps.map(
                      (
                        dependency,
                        index,
                      ) => (
                        <div
                          key={`${dependency.node.id}-${index}`}
                          className="network-dependency-row"
                        >

                          <span
                            className={`network-dependency-direction ${dependency.dir}`}
                          >
                            {dependency.dir ===
                            'out'
                              ? '→'
                              : '←'}
                          </span>

                          <span className="network-dependency-name">
                            {
                              dependency
                                .node
                                .label
                            }
                          </span>

                          <span
                            className="network-dependency-risk"
                            style={{
                              color:
                                nodeColorForRisk(
                                  riskFor(
                                    dependency
                                      .node
                                      .id,
                                  ),
                                ),
                            }}
                          >
                            {Math.round(
                              riskFor(
                                dependency
                                  .node
                                  .id,
                              ),
                            )}
                          </span>

                        </div>
                      ),
                    )
                  ) : (
                    <div className="network-no-dependencies">
                      No direct dependencies.
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="network-node-help">
                Click a node to inspect
                it and toggle its
                disruption state.
              </div>
            )}

          </section>

          {/* =================================================
              SUPPLIER DIRECTORY
              ================================================= */}

          <section className="network-overlay-card network-supplier-directory-card">
            <div className="network-supplier-directory-header">
              <div>
                <h3 className="network-card-title">SUPPLIERS</h3>
                <span className="network-supplier-count">
                  {supplierNodes.length} suppliers
                </span>
              </div>
            </div>

            <div className="network-supplier-list" aria-label="Supplier list">
              {supplierNodes.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  className={
                    'network-supplier-item' +
                    (supplier.id === pendingSupplierId ? ' selected' : '')
                  }
                  onClick={() =>
                    selectFromDirectory(supplier.id)
                  }
                >
                  <span
                    className="network-supplier-status-dot"
                    style={{
                      background: nodeColorForRisk(
                        Math.round(riskFor(supplier.id)),
                      ),
                    }}
                  />

                  <span className="network-supplier-item-name">
                    {supplier.label}
                  </span>

                  <span
                    className="network-supplier-item-risk"
                    style={{
                      color: nodeColorForRisk(
                        Math.round(riskFor(supplier.id)),
                      ),
                    }}
                  >
                    {Math.round(riskFor(supplier.id))}
                  </span>
                </button>
              ))}
            </div>

            <div className="network-supplier-action-row">
              <button
                type="button"
                className="network-supplier-select-button"
                onClick={selectPendingSupplier}
                disabled={!pendingSupplierId}
              >
                Select
              </button>

              <button
                type="button"
                className="network-supplier-remove-button"
                onClick={removeSelectedNode}
                disabled={!pendingSupplierId && (!selectedNode || selectedNode.type !== 'supplier')}
              >
                Remove
              </button>
            </div>
          </section>

        </aside>

      </div>

    </div>
  );
};

export default NetworkPage;