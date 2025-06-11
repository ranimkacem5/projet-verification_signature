"use client"

import { useCallback, useEffect, useState } from "react"
import Particles from "react-particles"
import type { Container, Engine } from "tsparticles-engine"
import { loadSlim } from "tsparticles-slim"

export default function ParticleBackground() {
  const [currentColor, setCurrentColor] = useState("rgb(124, 58, 237)") // Default purple

  // Update particle color based on CSS variable
  useEffect(() => {
    const updateColor = () => {
      const root = document.documentElement
      const accentColor = getComputedStyle(root).getPropertyValue("--accent-color").trim()
      setCurrentColor(`rgb(${accentColor})`)
    }

    // Initial update
    updateColor()

    // Set up an interval to check for color changes
    const interval = setInterval(updateColor, 100)

    return () => clearInterval(interval)
  }, [])

  const particlesInit = useCallback(async (engine: Engine) => {
    // Use loadSlim instead of loadFull to avoid compatibility issues
    await loadSlim(engine)
  }, [])

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    // Optional: You can do something with the container here if needed
  }, [])

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      className="absolute inset-0"
      options={{
        background: {
          color: {
            value: "#f9fafb", // Light gray background
          },
        },
        fpsLimit: 120,
        particles: {
          color: {
            value: currentColor, // Use the current accent color
          },
          links: {
            color: currentColor, // Use the current accent color
            distance: 150,
            enable: true,
            opacity: 0.4, // Slightly higher opacity for better visibility
            width: 1,
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: false,
            straight: false,
            outModes: {
              default: "bounce",
            },
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 80,
          },
          opacity: {
            value: 0.6, // Increased opacity for better visibility on light background
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 5 },
          },
        },
        detectRetina: true,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
            onClick: {
              enable: true,
              mode: "push",
            },
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 1,
              },
            },
            push: {
              quantity: 4,
            },
          },
        },
      }}
    />
  )
}
