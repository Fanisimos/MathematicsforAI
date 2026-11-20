import { pick, randInt } from './math';

export type Mat = number[][];
export const clone = (A: Mat) => A.map((r) => [...r]);
export const matVec = (A: Mat, x: number[]) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
export const norm2 = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
export const normInf = (v: number[]) => Math.max(...v.map(Math.abs));

/**
 * Random n×n system with "nice" numbers: A = L·U with small integer L (unit lower)
 * and U (upper, non-zero diagonal), integer solution x. Gaussian elimination without
 * pivoting then uses integer multipliers and stays in integers.
 */
export function niceSystem(n = 3) {
  const L: Mat = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : j < i ? randInt(-2, 2) : 0)));
  const U: Mat = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j < i ? 0 : j === i ? pick([1, 2, -1, 3, -2]) : randInt(-3, 3))));
  // make sure L isn't trivially identity
  if (L.every((r, i) => r.every((v, j) => (i === j ? v === 1 : v === 0)))) L[1][0] = 2;
  const A: Mat = L.map((r) => U[0].map((_, j) => r.reduce((s, l, k) => s + l * U[k][j], 0)));
  const x = Array.from({ length: n }, () => randInt(-3, 4));
  const b = matVec(A, x);
  return { A, b, x, L, U };
}

export type ElimStep = { M: Mat; k: number; i: number; m: number; desc: string };

/** Forward-elimination snapshots on the augmented matrix [A | b] (no pivoting). */
export function eliminationSteps(A: Mat, b: number[]): ElimStep[] {
  const n = A.length;
  let M = A.map((r, i) => [...r, b[i]]);
  const steps: ElimStep[] = [];
  for (let k = 0; k < n - 1; k++)
    for (let i = k + 1; i < n; i++) {
      const m = M[i][k] / M[k][k];
      if (m === 0) continue;
      const next = clone(M);
      for (let j = k; j <= n; j++) next[i][j] = M[i][j] - m * M[k][j];
      next[i][k] = 0;
      steps.push({ M: next, k, i, m, desc: `R${i + 1} ← R${i + 1} − (${fmtM(m)})·R${k + 1}` });
      M = next;
    }
  return steps;
}
const fmtM = (m: number) => (Number.isInteger(m) ? `${m}` : m.toFixed(3).replace(/0+$/, ''));

export function backSub(U: Mat, c: number[]) {
  const n = c.length;
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = c[i];
    for (let j = i + 1; j < n; j++) s -= U[i][j] * x[j];
    x[i] = s / U[i][i];
  }
  return x;
}

export function forwardSub(L: Mat, b: number[]) {
  const n = b.length;
  const y = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let j = 0; j < i; j++) s -= L[i][j] * y[j];
    y[i] = s / L[i][i];
  }
  return y;
}

/** Doolittle LU without pivoting. */
export function luNoPivot(A: Mat) {
  const n = A.length;
  const U = clone(A);
  const L: Mat = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let k = 0; k < n - 1; k++)
    for (let i = k + 1; i < n; i++) {
      const m = U[i][k] / U[k][k];
      L[i][k] = m;
      for (let j = k; j < n; j++) U[i][j] -= m * U[k][j];
      U[i][k] = 0;
    }
  return { L, U };
}

/** Round to s significant figures: simulates a low-precision computer. */
export const roundSig = (v: number, s: number) => (v === 0 || !isFinite(v) ? v : Number(v.toPrecision(s)));

/** Gaussian elimination with partial pivoting where EVERY operation is rounded to s significant figures. */
export function solveLowPrecision(A: Mat, b: number[], s: number) {
  const n = b.length;
  const r = (v: number) => roundSig(v, s);
  const M = A.map((row, i) => [...row.map(r), r(b[i])]);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    [M[k], M[p]] = [M[p], M[k]];
    for (let i = k + 1; i < n; i++) {
      const m = r(M[i][k] / M[k][k]);
      for (let j = k; j <= n; j++) M[i][j] = r(M[i][j] - r(m * M[k][j]));
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let acc = M[i][n];
    for (let j = i + 1; j < n; j++) acc = r(acc - r(M[i][j] * x[j]));
    x[i] = r(acc / M[i][i]);
  }
  return x;
}
