/* Viz 3 — Supply Shifters: Elastic vs Inelastic Supply
   Shared demand curve Q_D = 90 − 3P, two supply curves through the
   same equilibrium (Q*=30, P*=20):
     Inelastic (steep): Q_S = 40 − 0.5P rotated → Q_S = 0.5P + 20 style ...
   Actually: both pass through (30, 20).
     Inelastic supply: Q = 30 + 0.5(P−20) = 20 + 0.5P  (steep)
     Elastic supply:   Q = 30 + 4(P−20)   = −50 + 4P   (flat)
   Pedagogical point: same supply shock has different P/Q effects
   depending on supply elasticity.
   SF housing (steep) vs Houston housing (flat).                       */
(function () {
  'use strict';
  var MT = window.MicroTools;

  /* Demand is the same for both presets */
  var dA = 90, dB = -3;   // Q_D = 90 − 3P   (P-intercept = 30, Q-intercept = 90)

  var presets = {
    inelastic: {
      label: 'Inelastic supply (Housing in SF)',
      sA: 20, sB: 0.5,     // Q_S = 20 + 0.5P  → at P=20, Q=30 ✓
      explain:
        '<strong>Housing in San Francisco has inelastic (steep) supply</strong> — ' +
        'building more is extremely difficult (regulations, geography). ' +
        'When input costs rise and supply shifts left, <em>prices surge</em> ' +
        'but the number of homes barely changes.'
    },
    elastic: {
      label: 'Elastic supply (Housing in Houston)',
      sA: -50, sB: 4,      // Q_S = −50 + 4P   → at P=20, Q=30 ✓
      explain:
        '<strong>Housing in Houston has elastic (flat) supply</strong> — ' +
        'land is plentiful and building is easy. ' +
        'When input costs rise and supply shifts left, <em>quantity drops significantly</em> ' +
        'but the price increase is modest.'
    }
  };

  function init() {
    var state = { preset: 'inelastic', costShift: 0, supplyShift: 0 };
    var sliders = {};

    MT.addDropdown('controls-03', {
      label: 'Supply type',
      value: 'inelastic',
      options: [
        { value: 'inelastic', label: 'Inelastic supply (Housing in SF)' },
        { value: 'elastic',   label: 'Elastic supply (Housing in Houston)' }
      ],
      onChange: function (v) { state.preset = v; render(); }
    });

    sliders.cost = MT.addSlider('controls-03', {
      label: 'Input cost change', min: -15, max: 15, value: 0, step: 1,
      format: function (v) { return (v >= 0 ? '+' : '') + v; },
      onChange: function (v) { state.costShift = v; update(); }
    });

    sliders.supply = MT.addSlider('controls-03', {
      label: 'Other supply shift', min: -20, max: 20, value: 0, step: 1,
      format: function (v) { return (v >= 0 ? '+' : '') + v; },
      onChange: function (v) { state.supplyShift = v; update(); }
    });

    d3.select('#controls-03').append('div')
      .attr('id', 'explain-03')
      .attr('class', 'micro-info')
      .style('margin-top', '0.5rem');

    var chart, xScale, yScale, dynamicG;

    function setup() {
      chart  = MT.createChart('chart-03');
      xScale = d3.scaleLinear().domain([0, 100]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, 50]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      var pr = presets[state.preset];

      MT.drawAxes(chart, xScale, yScale, 'Quantity', 'Price ($)');

      /* Demand (same for all) */
      MT.drawCurve(chart.plotArea,
        function (q) { return (dA - q) / (-dB); },
        [0, dA], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });

      chart.plotArea.append('text')
        .attr('x', xScale(Math.min(dA - 2, 96))).attr('y', yScale(1))
        .style('fill', colors.demand).style('font-size', '11px')
        .style('font-weight', 'bold').text('D');

      /* Original supply (faded) */
      var sMaxQ = pr.sA + pr.sB * yScale.domain()[1];
      MT.drawCurve(chart.plotArea,
        function (q) { return (q - pr.sA) / pr.sB; },
        [Math.max(0, pr.sA), Math.min(sMaxQ, xScale.domain()[1])], xScale, yScale,
        { color: colors.supplyFaded, strokeWidth: 2, dashed: true });

      chart.plotArea.append('text')
        .attr('x', xScale(Math.min(sMaxQ - 2, 96))).attr('y', yScale(yScale.domain()[1] - 2))
        .style('fill', colors.supplyFaded).style('font-size', '11px')
        .style('font-weight', 'bold').text('S\u2080');

      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors, pr);

      d3.select('#explain-03').html(pr.explain);
    }

    function update() {
      if (!dynamicG) return;
      dynamicG.selectAll('*').remove();
      drawDynamic(MT.getColors(), presets[state.preset]);
    }

    function drawDynamic(colors, pr) {
      /* Cost increase shifts supply LEFT (decrease sA) */
      var newSA = pr.sA + state.supplyShift - state.costShift * pr.sB;

      /* Shifted supply */
      var sMaxQ = newSA + pr.sB * yScale.domain()[1];
      MT.drawCurve(dynamicG,
        function (q) { return (q - newSA) / pr.sB; },
        [Math.max(0, newSA), Math.min(sMaxQ, xScale.domain()[1])], xScale, yScale,
        { color: colors.supply, strokeWidth: 2.5 });

      dynamicG.append('text')
        .attr('x', xScale(Math.min(sMaxQ - 2, 96))).attr('y', yScale(yScale.domain()[1] - 2))
        .style('fill', colors.supply).style('font-size', '11px')
        .style('font-weight', 'bold').text("S'");

      /* Equilibria */
      var eq0 = MT.solveLinearEq(dA, dB, pr.sA, pr.sB);
      var eq1 = MT.solveLinearEq(dA, dB, newSA, pr.sB);

      /* Original eq dot */
      if (eq0.P > 0 && eq0.Q > 0) {
        dynamicG.append('circle')
          .attr('cx', xScale(eq0.Q)).attr('cy', yScale(eq0.P))
          .attr('r', 4).attr('fill', colors.textLight);
      }

      if (eq1.P > 0 && eq1.Q > 0) {
        MT.addEqMarker(dynamicG, eq1.Q, eq1.P, xScale, yScale, {
          xLabel: "Q'=" + MT.fmt(eq1.Q, 1),
          yLabel: "P'=" + MT.fmt(eq1.P, 1)
        });
      }

      var dP = eq1.P - eq0.P;
      var dQ = eq1.Q - eq0.Q;
      d3.select('#info-03').html(
        '<strong>Original eq:</strong> P*=' + MT.fmt(eq0.P, 1) + ', Q*=' + MT.fmt(eq0.Q, 1) +
        '<br><strong>New eq:</strong> P\u2032=' + MT.fmt(eq1.P, 1) + ', Q\u2032=' + MT.fmt(eq1.Q, 1) +
        '<br><strong>\u0394P = ' + MT.fmt(dP, 1) + '</strong>, ' +
        '<strong>\u0394Q = ' + MT.fmt(dQ, 1) + '</strong>'
      );

      MT.updateMath('math-03',
        'Q_S = ' + MT.fmt(newSA, 0) + '+' + pr.sB + 'P \\;\\Rightarrow\\; ' +
        'P^*=' + MT.fmt(eq1.P, 1) + ',\\;Q^*=' + MT.fmt(eq1.Q, 1));
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
