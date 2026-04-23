export default function Tag({ tag, onRemove }) {
  return (
    <span
      className="tag"
      style={{ background: tag.color.bg, color: tag.color.text, border: `1px solid ${tag.color.border}` }}
    >
      {tag.name}
      {onRemove && (
        <span className="tag-remove" onClick={() => onRemove(tag.id)}>
          ✕
        </span>
      )}
    </span>
  );
}
