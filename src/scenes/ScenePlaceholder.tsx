/**
 * Temporary placeholder for a scene/act. Renders a black full-bleed screen
 * with white centered label text in JetBrains Mono.
 *
 * The real 3D <Canvas> worlds are built per-act in a later prompt — this is
 * routing scaffolding only.
 */
export default function ScenePlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '1.25rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  )
}
