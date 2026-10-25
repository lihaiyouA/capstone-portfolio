// src/components/LoadingSpinner.jsx
// Lab 8.2 Step 5：把加载动画抽成独立组件，方便在任意位置复用
export default function LoadingSpinner() {
  return (
    <span className="spinner-container" aria-hidden="true">
      <span className="spinner" />
    </span>
  )
}
