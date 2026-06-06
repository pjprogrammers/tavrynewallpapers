import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**",
    ],
  },
  {
    // React 19 + eslint-plugin-react-hooks 7.x introduced several rules
    // that flag legitimate, idiomatic React patterns as errors. Disabled
    // below with rationale.
    rules: {
      // Pattern: `useEffect(() => { if (cond) { setX(...); return; } ... }, [dep])`
      // This is the canonical way to derive state from props/external changes
      // in React. The rule's recommended replacement (deriving in render or
      // moving to event handlers) doesn't apply when the data source is
      // async (e.g. a Firestore subscription resolving later).
      "react-hooks/set-state-in-effect": "off",

      // Flags `Math.random()` / `Date.now()` inside useMemo and refs accessed
      // during render. Both are intentional here: useMemo with Math.random
      // produces stable per-render values (memoized), and refs read during
      // render are needed for framer-motion's `useScroll({ target })`.
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",

      // Stylistic; anonymous default exports are common in React components.
      "import/no-anonymous-default-export": "off",

      // We use `useState` + `useEffect` for mount detection; React 19 has
      // better APIs but this codebase predates them and works correctly.
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
