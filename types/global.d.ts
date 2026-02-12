import React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

// This ensures the file is treated as a module
export {}