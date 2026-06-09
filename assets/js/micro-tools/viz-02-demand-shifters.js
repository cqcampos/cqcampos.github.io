/* Viz 2 — Demand Shifters: Inferior vs Normal Goods
   Three presets sharing the SAME supply curve, Q_S = 2P − 10 (P*=20, Q*=30).
   1. Inferior good (Dollar General): income ↑ → demand LEFT
   2. Normal good, inelastic demand (Gasoline): steep, income ↑ → demand RIGHT
   3. Normal good, elastic demand (Restaurant meals): flat, income ↑ → demand RIGHT
   Pedagogical point: the shape/elasticity of demand determines
   how much prices and quantities move when demand shifts.            */
(function () {
  'use strict';
  var MT = window.MicroTools;

  /* Supply is the same for all presets so comparison is apples-to-apples */
  var sA = -10, sB = 2;   // Q_S = 2P − 10

  /* Each preset's demand passes through (Q=30, P=20) at baseline.
     Shift amount = incDir × slider value.                           */
  var presets = {
    inferior: {
      label: 'Inferior good (Dollar General)',
      dA: 50, dB: -1,       // Q = 50 − P  (moderate slope)
      incDir: -1,            // income UP → demand LEFT
      explain: '<strong>Dollar General is an inferior good.</strong> When the economy is strong and incomes rise, consumers switch to higher-quality stores. Demand shifts <em>left</em>, lowering both price and quantity.'
    },
    inelastic: {
      label: 'Normal good, inelastic demand (Gasoline)',
      dA: 50, dB: -1,       // same intercept for clean comparison
      incDir: 1,
      explain: '<strong>Gasoline has inelastic (steep) demand</strong> — people need it regardless of price. When income rises and demand shifts right, the price increase is <em>large</em> because consumers barely reduce quantity as prices climb.'
    },
    elastic: {
      label: 'Normal good, elastic demand (Restaurant meals)',
      dA: 90, dB: -3,       // Q = 90 − 3P  (flatter)
      incDir: 1,
      explain: '<strong>Restaurant meals have elastic (flat) demand</strong> — consumers can easily substitute home cooking. When income rises and demand shifts right, the price increase is <em>modest</em> because buyers are very price-sensitive.'
    }
  };

  /* Override inelastic preset to be genuinely steep through same eq */
  /* Steep: Q = 40 − 0.5P → at P=20, Q=30  ✓ */
  presets.inelastic.dA = 40;
  presets.inelastic.dB = -0.5;
  presets.inelastic.explain =
    '<strong>Gasoline has inelastic (steep) demand</strong> — people need it regardless of price. ' +
    'When income rises and demand shifts right, the steep curve means the price increase is <em>large</em> ' +
    'but the quantity increase is also sizable. Buyers keep buying even as prices rise.';

  function init() {
    var state = { preset: 'inferior', shift: 0 };
    var sliders = {};

    MT.addDropdown('controls-02', {
      label: 'Good type',
      value: 'inferior',
      options: [
        { value: 'inferior',  label: 'Inferior good (Dollar General)' },
        { value: 'inelastic', label: 'Normal good — inelastic demand (Gasoline)' },
        { value: 'elastic',   label: 'Normal good — elastic demand (Restaurant meals)' }
      ],
      onChange: function (v) { state.preset = v; render(); }
    });

    sliders.shift = MT.addSlider('controls-02', {
      label: 'Income change', min: -20, max: 20, value: 0, step: 1,
      format: function (v) { return (v >= 0 ? '+' : '') + v; },
      onChange: function (v) { state.shift = v; update(); }
    });

    /* Explanation box (populated by JS) */
    d3.select('#controls-02').append('div')
      .attr('id', 'explain-02')
      .attr('class', 'micro-info')
      .style('margin-top', '0.5rem');

    var chart, xScale, yScale, dynamicG;

    function setup() {
      chart  = MT.createChart('chart-02');
      xScale = d3.scaleLinear().domain([0, 100]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, 55]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      var pr = presets[state.preset];

      MT.drawAxes(chart, xScale, yScale, 'Quantity', 'Price ($)');

      /* Original demand (faded) */
      MT.drawCurve(chart.plotArea,
        function (q) { return (pr.dA - q) / (-pr.dB); },
        [0, Math.min(pr.dA, xScale.domain()[1])], xScale, yScale,
        { color: colors.demandFaded, strokeWidth: 2, dashed: true });

      /* Supply (same for all presets) */
      var sMaxQ = sA + sB * yScale.domain()[1];
      MT.drawCurve(chart.plotArea,
        function (q) { return (q - sA) / sB; },
        [Math.max(0, sA), Math.min(sMaxQ, xScale.domain()[1])], xScale, yScale,
        { color: colors.supply, strokeWidth: 2.5 });

      /* Labels */
      chart.plotArea.append('text')
        .attr('x', xScale(Math.min(pr.dA - 2, 96))).attr('y', yScale(1.5))
        .style('fill', colors.demandFaded).style('font-size', '11px')
        .style('font-weight', 'bold').text('D\u2080');
      chart.plotArea.append('text')
        .attr('x', xScale(Math.min(sMaxQ - 2, 96))).attr('y', yScale(yScale.domain()[1] - 2))
        .style('fill', colors.supply).style('font-size', '11px')
        .style('font-weight', 'bold').text('S');

      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors, pr);

      /* Update explanation text */
      d3.select('#explain-02').html(pr.explain);
    }

    function update() {
      if (!dynamicG) return;
      dynamicG.selectAll('*').remove();
      drawDynamic(MT.getColors(), presets[state.preset]);
    }

    function drawDynamic(colors, pr) {
      var shiftAmt = state.shift * pr.incDir;  // horizontal shift
      var newDA = pr.dA + shiftAmt;

      /* Shifted demand */
      MT.drawCurve(dynamicG,
        function (q) { return (newDA - q) / (-pr.dB); },
        [0, Math.max(0, Math.min(newDA, xScale.domain()[1]))], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });

      dynamicG.append('text')
        .attr('x', xScale(Math.min(Math.max(0, newDA - 2), 96)))
        .attr('y', yScale(1.5))
        .style('fill', colors.demand).style('font-size', '11px')
        .style('font-weight', 'bold').text("D'");

      /* Equilibria */
      var eq0 = MT.solveLinearEq(pr.dA, pr.dB, sA, sB);
      var eq1 = MT.solveLinearEq(newDA, pr.dB, sA, sB);

      /* Original eq dot (grey) */
      if (eq0.P > 0 && eq0.Q > 0) {
        dynamicG.append('circle')
          .attr('cx', xScale(eq0.Q)).attr('cy', yScale(eq0.P))
          .attr('r', 4).attr('fill', colors.textLight);
      }

      /* New eq marker */
      if (eq1.P > 0 && eq1.Q > 0) {
        MT.addEqMarker(dynamicG, eq1.Q, eq1.P, xScale, yScale, {
          xLabel: "Q'=" + MT.fmt(eq1.Q, 1),
          yLabel: "P'=" + MT.fmt(eq1.P, 1)
        });
      }

      var dP = eq1.P - eq0.P;
      var dQ = eq1.Q - eq0.Q;
      var dir = shiftAmt > 0 ? 'rightward' : shiftAmt < 0 ? 'leftward' : 'no shift';
      d3.select('#info-02').html(
        '<strong>Original eq:</strong> P*=' + MT.fmt(eq0.P, 1) + ', Q*=' + MT.fmt(eq0.Q, 1) +
        '<br><strong>New eq:</strong> P\u2032=' + MT.fmt(eq1.P, 1) + ', Q\u2032=' + MT.fmt(eq1.Q, 1) +
        '<br><strong>\u0394P = ' + MT.fmt(dP, 1) + '</strong>, ' +
        '<strong>\u0394Q = ' + MT.fmt(dQ, 1) + '</strong>' +
        '&ensp;(' + dir + ')'
      );

      MT.updateMath('math-02',
        "Q_D = " + MT.fmt(newDA, 0) + (pr.dB >= 0 ? '+' : '') + pr.dB + "P");
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
