import { MORE_SNIPPETS } from './snippets2';
/**
 * MATLAB scripts for each topic. Each line is [code, optional note].
 * `output` is only given for fprintf-based scripts whose printed text is deterministic
 * (values computed exactly and checked to avoid rounding ties). Other results are stated
 * in comments as the mathematical value, not as literal Command Window text.
 */
export type Snip = {
  title: string;
  file: string;
  goal: string;
  toolbox: 'base' | 'symbolic';
  lines: [string, string?][];
  output?: string;
  takeaway?: string;
};

const CALC_SNIPPETS: Record<string, Snip[]> = {
  derivatives: [
    {
      title: 'Watch the secant slope converge',
      file: 'secant.m',
      goal: 'The $h \\to 0$ limit from the lecture, done numerically for $f(x) = x^2$ at $x = 0.8$.',
      toolbox: 'base',
      lines: [
        ['f = @(x) x.^2;              % anonymous function', 'An anonymous function: `f(3)` now gives 9. Use `.^` so it also works on vectors.'],
        ['a = 0.8;                    % point we want the slope at'],
        ['for h = [1 0.1 0.01 0.001 1e-6]', 'Loop over smaller and smaller gaps $h$.'],
        ['    slope = (f(a+h) - f(a)) / h;', 'Rise over run between the two points: the secant slope.'],
        ["    fprintf('h = %-8g slope = %.6f\\n', h, slope);", '`%g` prints $h$ compactly, `%.6f` prints 6 decimals, `\\n` is a new line.'],
        ['end'],
      ],
      output: [
        'h = 1        slope = 2.600000',
        'h = 0.1      slope = 1.700000',
        'h = 0.01     slope = 1.610000',
        'h = 0.001    slope = 1.601000',
        'h = 1e-06    slope = 1.600001',
      ].join('\n'),
      takeaway: "The slopes close in on **1.6**, which is exactly $f'(0.8) = 2(0.8)$.",
    },
    {
      title: 'Let MATLAB differentiate for you',
      file: 'symdiff.m',
      goal: 'Check your hand-differentiation with the Symbolic Math Toolbox.',
      toolbox: 'symbolic',
      lines: [
        ['syms x', 'Declares `x` as a symbol (an algebra letter), not a number.'],
        ['f  = 3*x^4 - 2*x + 5;'],
        ['df = diff(f, x)             % 12*x^3 - 2', '`diff(f, x)` differentiates with respect to $x$. No semicolon, so the result is displayed.'],
        ['subs(df, x, 2)              % 94', '`subs` substitutes $x = 2$: the gradient of the tangent at $x = 2$.'],
      ],
    },
    {
      title: 'Plot a function and its derivative',
      file: 'plot_derivative.m',
      goal: 'The "Paint the derivative" picture, drawn by MATLAB.',
      toolbox: 'symbolic',
      lines: [
        ['syms x'],
        ['f = x^3/3 - x;'],
        ["fplot(f, [-3 3], 'LineWidth', 2); hold on", '`fplot` plots a symbolic function over an interval; `hold on` keeps it for the next plot.'],
        ["fplot(diff(f, x), [-3 3], '--', 'LineWidth', 2)", "The derivative $f'(x) = x^2 - 1$ as a dashed line."],
        ['yline(0); grid on'],
        ['legend("f(x)", "f\'(x)")'],
      ],
      takeaway: "Where $f$ has a peak or dip, the dashed $f'$ crosses zero.",
    },
  ],

  optimisation: [
    {
      title: 'Find and classify stationary points',
      file: 'stationary.m',
      goal: 'The 4-step exam recipe, automated.',
      toolbox: 'symbolic',
      lines: [
        ['syms x'],
        ['f  = x^3 - 3*x;'],
        ['xs = solve(diff(f, x) == 0, x)     % -1 and 1', "Steps 1 and 2: differentiate, then solve $f'(x) = 0$. Note the double `==` for an equation."],
        ['f2 = subs(diff(f, x, 2), x, xs)    % -6 and 6', "Step 3: `diff(f, x, 2)` is $f''$. Substitute each stationary point."],
      ],
      takeaway: "$f''(-1) = -6 < 0$ → maximum, $f''(1) = 6 > 0$ → minimum.",
    },
    {
      title: 'Gradient descent in a few lines',
      file: 'descent.m',
      goal: 'Exactly what you do by hand in Descent Golf, as a loop.',
      toolbox: 'base',
      lines: [
        ['f     = @(x) 0.5*(x - 1.5).^2 + 0.5;   % loss function', 'The "Bowl" level from the game. Minimum at $x = 1.5$.'],
        ['df    = @(x) x - 1.5;                  % its derivative'],
        ['x     = -3;                            % starting guess'],
        ['alpha = 0.4;                           % learning rate', 'Try 1 (one step!), 1.9 (wobbles) and 2.1 (diverges).'],
        ['for k = 1:8'],
        ['    x = x - alpha*df(x);               % one descent step', 'The update rule $x \\leftarrow x - \\alpha f\'(x)$.'],
        ["    fprintf('step %2d: x = %.4f  f(x) = %.4f\\n', k, x, f(x));"],
        ['end'],
      ],
      output: [
        'step  1: x = -1.2000  f(x) = 4.1450',
        'step  2: x = -0.1200  f(x) = 1.8122',
        'step  3: x = 0.5280  f(x) = 0.9724',
        'step  4: x = 0.9168  f(x) = 0.6701',
        'step  5: x = 1.1501  f(x) = 0.5612',
        'step  6: x = 1.2900  f(x) = 0.5220',
        'step  7: x = 1.3740  f(x) = 0.5079',
        'step  8: x = 1.4244  f(x) = 0.5029',
      ].join('\n'),
      takeaway: '$x$ creeps towards 1.5 and the loss towards 0.5. That is training.',
    },
    {
      title: "MATLAB's built-in minimiser",
      file: 'minimise.m',
      goal: '`fminbnd` searches an interval. Like gradient descent, it can get stuck in a local minimum.',
      toolbox: 'base',
      lines: [
        ['f = @(x) 0.1*x.^4 - x.^2 + 0.6*x + 3;  % the "Local Trap" level', 'Two valleys: a shallow one near $x = 2.07$ and the deepest near $x = -2.37$.'],
        ['[xmin, fmin] = fminbnd(f, 0, 4)        % x ≈ 2.0675, f ≈ 1.7931', 'Searching $[0, 4]$ only sees the shallow valley: a **local** minimum.'],
        ['[xmin, fmin] = fminbnd(f, -4, 0)       % x ≈ -2.3732, f ≈ -0.8840', 'Searching $[-4, 0]$ finds the **global** minimum.'],
      ],
      takeaway: 'Where you look decides what you find, which is why AI training uses tricks like random restarts.',
    },
  ],

  partial: [
    {
      title: 'Partial derivatives and the gradient',
      file: 'partials.m',
      goal: 'Freeze one variable, differentiate the other.',
      toolbox: 'symbolic',
      lines: [
        ['syms x y'],
        ['f  = x^2*y + 3*y^3 - 2*x;'],
        ['fx = diff(f, x)                 % 2*x*y - 2', 'Partial w.r.t. $x$: $y$ is treated as a constant.'],
        ['fy = diff(f, y)                 % x^2 + 9*y^2', 'Partial w.r.t. $y$: $x$ is treated as a constant.'],
        ['g  = gradient(f, [x y])         % [fx; fy]', 'The gradient vector $\\nabla f$, both partials stacked.'],
        ['subs(g, [x y], [1 2])           % [2; 37]', 'Evaluate $\\nabla f$ at the point $(1, 2)$.'],
      ],
    },
    {
      title: 'Check the chain & product rules',
      file: 'rules.m',
      goal: 'Use MATLAB to mark your own homework.',
      toolbox: 'symbolic',
      lines: [
        ['syms x'],
        ['diff(sin(x^2), x)               % 2*x*cos(x^2)', 'Chain rule: outer derivative $\\cos(x^2)$ times inner derivative $2x$.'],
        ['diff((3*x + 1)^5, x)            % 15*(3*x + 1)^4', 'Chain rule: $5(3x+1)^4 \\times 3$.'],
        ['diff(x^2*exp(x), x)             % 2*x*exp(x) + x^2*exp(x)', "Product rule: $u'v + uv'$."],
      ],
    },
    {
      title: 'See the gradient field',
      file: 'gradient_field.m',
      goal: 'Numerical partial derivatives on a grid, with arrows pointing uphill.',
      toolbox: 'base',
      lines: [
        ['[X, Y]   = meshgrid(-3:0.25:3);    % grid of (x, y) points', '`meshgrid` builds every $(x, y)$ pair on the grid.'],
        ['Z        = X.^2 - Y.^2;            % the saddle surface'],
        ['[GX, GY] = gradient(Z, 0.25);      % numerical partials', 'Numerical $\\partial f/\\partial x$ and $\\partial f/\\partial y$ from neighbouring grid values (spacing 0.25).'],
        ['contourf(X, Y, Z, 20); hold on'],
        ["quiver(X, Y, GX, GY, 'k')          % arrows point uphill", '`quiver` draws an arrow $(GX, GY)$ at each grid point.'],
        ['axis equal; colorbar'],
      ],
      takeaway: 'Same picture as the heatmap explorer above: arrows are perpendicular to the contours.',
    },
  ],

  integration: [
    {
      title: 'Riemann sums vs the exact integral',
      file: 'riemann.m',
      goal: 'Left rectangles for $\\int_0^3 x^2\\,dx$, with more and more rectangles.',
      toolbox: 'base',
      lines: [
        ['f = @(x) x.^2;'],
        ['a = 0; b = 3;'],
        ['for n = [4 16 64 256]'],
        ['    h  = (b - a)/n;                 % rectangle width'],
        ['    xl = a + (0:n-1)*h;             % left endpoints', '`(0:n-1)*h` gives $0, h, 2h, \\dots$: the left edge of each rectangle.'],
        ['    L  = h*sum(f(xl));              % total area', 'Heights $f(x_i)$ times width $h$, all added up.'],
        ["    fprintf('n = %3d  left sum = %.5f\\n', n, L);"],
        ['end'],
        ['exact = integral(f, a, b)           % 9', '`integral` is MATLAB\'s accurate numerical integrator.'],
      ],
      output: ['n =   4  left sum = 5.90625', 'n =  16  left sum = 8.17383', 'n =  64  left sum = 8.79016', 'n = 256  left sum = 8.94733'].join('\n'),
      takeaway: 'Left sums under-estimate an increasing function, but close in on 9 as $n$ grows.',
    },
    {
      title: 'Antiderivatives symbolically',
      file: 'symint.m',
      goal: '`int` does indefinite and definite integrals.',
      toolbox: 'symbolic',
      lines: [
        ['syms x'],
        ['int(x^2, x)                     % x^3/3', 'MATLAB leaves out the $+C$. **You** must still write it in the exam!'],
        ['int(x^2, x, 0, 3)               % 9', 'Add limits for a definite integral.'],
        ['int(exp(2*x), x)                % exp(2*x)/2'],
        ['int(1/x, x)                     % log(x)', '`log` in MATLAB is the natural log $\\ln$.'],
      ],
    },
    {
      title: 'Integrating data with trapz',
      file: 'trapz_demo.m',
      goal: 'When you only have measured points (no formula), use the trapezium rule.',
      toolbox: 'base',
      lines: [
        ['x = linspace(0, 3, 7);          % 7 points, so 6 trapezia', '`linspace(a, b, n)` gives $n$ equally spaced points.'],
        ['y = x.^2;'],
        ['trapz(x, y)                     % 9.125  (exact: 9)', 'Trapezia over-estimate a curve that bends upwards.'],
      ],
      takeaway: 'This is the bridge to the Numerical Integration workshop.',
    },
  ],

  techniques: [
    {
      title: 'Substitution & by parts, done by MATLAB',
      file: 'techniques.m',
      goal: 'MATLAB chooses the technique itself. Compare with your working.',
      toolbox: 'symbolic',
      lines: [
        ['syms x'],
        ['int(2*x*cos(x^2), x)            % sin(x^2)', 'Substitution with $u = x^2$.'],
        ['int(x*exp(x), x)                % exp(x)*(x - 1)', 'By parts. Same as $xe^x - e^x$, just factorised.'],
        ['int(log(x), x)                  % x*(log(x) - 1)', 'By parts with $dv = 1\\,dx$. Same as $x\\ln x - x$.'],
      ],
      takeaway: 'Answers can look different but be equal. Use `simplify` to compare.',
    },
    {
      title: 'Is my hand answer right?',
      file: 'check_answer.m',
      goal: 'Differentiate your answer and subtract the integrand. Zero means correct.',
      toolbox: 'symbolic',
      lines: [
        ['syms x'],
        ['F = x*sin(x) + cos(x);              % my answer for ∫ x cos(x) dx'],
        ['simplify(diff(F, x) - x*cos(x))     % 0  → correct!', 'If you get anything other than 0, your antiderivative is wrong.'],
      ],
    },
    {
      title: 'Numerical sanity check',
      file: 'numeric_check.m',
      goal: 'No toolbox needed: compare the area with $F(b) - F(a)$.',
      toolbox: 'base',
      lines: [
        ['f = @(x) x.*cos(x);', 'Note `.*`: element-wise multiply, needed because `integral` passes vectors.'],
        ['F = @(x) x.*sin(x) + cos(x);'],
        ['integral(f, 0, 3)               % -1.5666'],
        ['F(3) - F(0)                     % -1.5666  (they match)'],
      ],
    },
  ],

  applications: [
    {
      title: 'Area between two curves',
      file: 'area_between.m',
      goal: 'Find the crossings, then integrate top − bottom.',
      toolbox: 'symbolic',
      lines: [
        ['syms x'],
        ['top = 2*x;  bottom = x^2;'],
        ['xs = solve(top == bottom, x)                  % 0 and 2', 'Where the curves cross: the limits of integration.'],
        ['A  = int(top - bottom, x, min(xs), max(xs))   % 4/3', 'Using `min`/`max` makes sure the limits are in the right order.'],
      ],
    },
    {
      title: 'Average value',
      file: 'average.m',
      goal: 'Integral divided by the width of the interval.',
      toolbox: 'base',
      lines: [['integral(@(x) sin(x), 0, pi) / (pi - 0)     % 0.6366  (= 2/pi)', 'The height of the flattened "water" in the explorer above.']],
    },
    {
      title: 'Probability is an integral',
      file: 'probability.m',
      goal: 'Preview of Teaching Block 2: areas under a density.',
      toolbox: 'base',
      lines: [
        ['p = @(x) exp(-x.^2/2) / sqrt(2*pi);   % standard normal density'],
        ['integral(p, -1, 1)                    % 0.6827  (the 68% rule)', 'Probability of landing within one standard deviation.'],
        ['integral(p, -Inf, Inf)                % 1  (total probability)', '`integral` handles infinite limits.'],
      ],
    },
  ],
};

export const SNIPPETS: Record<string, Snip[]> = { ...CALC_SNIPPETS, ...MORE_SNIPPETS };
