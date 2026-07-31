/** Small badge that flags when an external response is fallback/demo data. */
const SourceBadge = ({ source }) => {
  if (source !== 'fallback') return null;
  return <span className="demo-badge" title="Backend returned fallback data, not a live external source">demo data</span>;
};

export default SourceBadge;
