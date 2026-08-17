import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 1200

/**
 * Point cloud: hawk-wing silhouette (left) dissolving into a rising
 * candlestick chart (right). 70% pulse-green, 30% dark steel particles.
 */
function useParticleField() {
  return useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const green = new THREE.Color('#00E68C')
    const steel = new THREE.Color('#161F2C')
    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random()
      let x = 0
      let y = 0
      let z = rand(-0.6, 0.6)

      if (r < 0.38) {
        // Hawk wing: layered feather arcs sweeping up-right from the left
        const t = Math.random()
        const feather = Math.floor(Math.random() * 5)
        const span = 1.6 - feather * 0.22
        const lift = 0.55 + feather * 0.16
        x = -1.7 + t * span
        y = -0.55 + lift * Math.sin(t * Math.PI * 0.62) + rand(-0.03, 0.03)
        z += rand(-0.08, 0.08)
      } else if (r < 0.86) {
        // Candlestick chart: 6 ascending bars + wicks rising to the right
        const bar = Math.floor(Math.random() * 6)
        const bx = -0.1 + bar * 0.34
        const base = -0.75 + bar * 0.26
        const h = 0.34 + Math.random() * 0.22
        if (Math.random() < 0.72) {
          // body
          x = bx + rand(-0.09, 0.09)
          y = base + Math.random() * h
        } else {
          // wick
          x = bx + rand(-0.015, 0.015)
          y = base - 0.14 + Math.random() * (h + 0.3)
        }
      } else {
        // Ambient drift particles bridging the two forms
        x = rand(-1.9, 2.0)
        y = rand(-0.9, 1.0)
        z = rand(-0.9, 0.9)
      }

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      const c = Math.random() < 0.7 ? green : steel
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [])
}

function Particles() {
  const group = useRef<THREE.Group>(null)
  const { positions, colors } = useParticleField()

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = t * 0.06
    group.current.position.y = Math.sin(t * 0.4) * 0.05
    // Cursor parallax: camera drifts toward pointer
    state.camera.position.x += (state.pointer.x * 0.45 - state.camera.position.x) * 0.04
    state.camera.position.y += (state.pointer.y * 0.3 - state.camera.position.y) * 0.04
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}

export default function HeroParticles() {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      camera={{ position: [0, 0, 2.6], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Particles />
    </Canvas>
  )
}
