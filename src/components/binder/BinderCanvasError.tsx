"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class BinderCanvasError extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-3xl text-white/20">⚠</div>
            <p className="text-sm text-white/40">3D view unavailable</p>
            <p className="text-xs text-white/25">Switch to Flat view to continue editing</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
